/**
 * /app/settings - WISMO AI Settings
 * Configure chatbot behavior, widget appearance, and FAQ items
 */
import { json, redirect } from '@remix-run/node';
import { useLoaderData, Form, useActionData, useNavigation } from '@remix-run/react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { authenticateAdmin } from '~/shopify.server';
import { getSupabaseAdmin } from '~/services/supabase.server';

// ─── Loader ──────────────────────────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticateAdmin(request);

  let settings = null;
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('wismo_settings')
      .select('*')
      .eq('shop', session.shop)
      .single();
    settings = data;
  } catch { /* defaults */ }

  return json({
    shop: session.shop,
    settings: settings || {
      enabled: true,
      widget_position: 'bottom-right',
      widget_color: '#008060',
      greeting: 'Hi! 👋 How can I help you today?',
      brand_name: '',
      auto_reply_language: 'auto',
      faq_items: [],
    },
  });
}

// ─── Action ──────────────────────────────────────────────────────────

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticateAdmin(request);
  const formData = await request.formData();

  const enabled = formData.get('enabled') === 'on';
  const widgetPosition = formData.get('widget_position') as string || 'bottom-right';
  const widgetColor = formData.get('widget_color') as string || '#008060';
  const greeting = formData.get('greeting') as string || 'Hi! 👋 How can I help you today?';
  const brandName = formData.get('brand_name') as string || '';
  const autoReplyLanguage = formData.get('auto_reply_language') as string || 'auto';
  
  // Parse FAQ items
  const faqQuestions = formData.getAll('faq_question') as string[];
  const faqAnswers = formData.getAll('faq_answer') as string[];
  const faqItems = faqQuestions.map((q, i) => ({
    question: q.trim(),
    answer: (faqAnswers[i] || '').trim(),
  })).filter(item => item.question && item.answer);

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('wismo_settings')
      .upsert({
        shop: session.shop,
        enabled,
        widget_position: widgetPosition,
        widget_color: widgetColor,
        greeting,
        brand_name: brandName,
        auto_reply_language: autoReplyLanguage,
        faq_items: faqItems,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'shop' });

    if (error) {
      console.error('[Settings] Save error:', error);
      return json({ error: 'Failed to save settings' }, { status: 500 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('[Settings] Save error:', error);
    return json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

// ─── Component ───────────────────────────────────────────────────────

export default function Settings() {
  const { shop, settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSaving = navigation.state === 'submitting';

  return (
    <div className="page">
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>⚙️ Settings</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Configure your WISMO AI chatbot</p>

      {actionData?.success && (
        <div style={{ background: '#e3f1e8', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          ✅ Settings saved successfully
        </div>
      )}
      {actionData?.error && (
        <div style={{ background: '#fef3cd', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', color: '#856404' }}>
          ⚠️ {actionData.error}
        </div>
      )}

      <Form method="post">
        {/* Widget Status */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Widget Status</h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" name="enabled" defaultChecked={settings.enabled} style={{ width: '18px', height: '18px' }} />
            <span style={{ fontSize: '14px' }}>Enable WISMO AI widget on your store</span>
          </label>
        </div>

        {/* Appearance */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Appearance</h2>
          
          <div className="form-group">
            <label>Widget Position</label>
            <select name="widget_position" defaultValue={settings.widget_position}>
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>

          <div className="form-group">
            <label>Widget Color</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="color" name="widget_color" defaultValue={settings.widget_color} style={{ width: '40px', height: '40px', border: '1px solid #c9cccf', borderRadius: '6px', padding: '2px', cursor: 'pointer' }} />
              <input type="text" name="widget_color_text" defaultValue={settings.widget_color} style={{ width: '100px', padding: '8px 12px', border: '1px solid #c9cccf', borderRadius: '6px', fontSize: '14px' }} readOnly />
            </div>
          </div>
        </div>

        {/* Chatbot Behavior */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Chatbot Behavior</h2>
          
          <div className="form-group">
            <label>Brand Name</label>
            <input type="text" name="brand_name" defaultValue={settings.brand_name} placeholder="Your store name" />
            <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Used in AI responses to sound like your brand</p>
          </div>

          <div className="form-group">
            <label>Greeting Message</label>
            <input type="text" name="greeting" defaultValue={settings.greeting} />
          </div>

          <div className="form-group">
            <label>Response Language</label>
            <select name="auto_reply_language" defaultValue={settings.auto_reply_language}>
              <option value="auto">Auto-detect (recommended)</option>
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="ja">日本語</option>
            </select>
          </div>
        </div>

        {/* FAQ Items */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>FAQ Items</h2>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>Add common questions and answers. The AI will use these to respond to customers.</p>
          
          <div id="faq-list">
            {(settings.faq_items || []).map((item: any, i: number) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '8px' }}>
                <input type="text" name="faq_question" defaultValue={item.question} placeholder="Question" style={{ padding: '8px 12px', border: '1px solid #c9cccf', borderRadius: '6px', fontSize: '14px' }} />
                <input type="text" name="faq_answer" defaultValue={item.answer} placeholder="Answer" style={{ padding: '8px 12px', border: '1px solid #c9cccf', borderRadius: '6px', fontSize: '14px' }} />
                <button type="button" onClick={() => (event?.target as HTMLElement)?.closest?.('div')?.remove?.()} style={{ background: '#fff', border: '1px solid #c9cccf', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', color: '#bf0711' }}>✕</button>
              </div>
            ))}
          </div>
          <button type="button" id="add-faq-btn" style={{ background: '#f6f6f7', border: '1px dashed #c9cccf', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', color: '#666' }}>
            + Add FAQ Item
          </button>
        </div>

        {/* Save */}
        <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ width: '100%', padding: '14px', fontSize: '16px' }}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </Form>

      {/* Install Widget */}
      <div className="card" style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>📦 Install Widget</h2>
        <div style={{ background: '#e3f1e8', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', lineHeight: 1.6 }}>
          <strong>Easy Install:</strong> Go to your Shopify Admin → Online Store → Themes → Customize → App Embeds → Enable "WISMO AI Chat". That's it!
        </div>
        <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
          The widget is injected automatically via Theme App Extension — no code changes needed.
        </p>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('add-faq-btn')?.addEventListener('click', function() {
              const list = document.getElementById('faq-list');
              const div = document.createElement('div');
              div.style.cssText = 'display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px';
              div.innerHTML = '<input type="text" name="faq_question" placeholder="Question" style="padding:8px 12px;border:1px solid #c9cccf;border-radius:6px;font-size:14px" /><input type="text" name="faq_answer" placeholder="Answer" style="padding:8px 12px;border:1px solid #c9cccf;border-radius:6px;font-size:14px" /><button type="button" onclick="this.parentElement.remove()" style="background:#fff;border:1px solid #c9cccf;border-radius:6px;padding:8px 12px;cursor:pointer;color:#bf0711">✕</button>';
              list.appendChild(div);
            });

            // Sync color picker with text input
            const colorInput = document.querySelector('input[type="color"]');
            const colorText = document.querySelector('input[name="widget_color_text"]');
            if (colorInput && colorText) {
              colorInput.addEventListener('input', function() { colorText.value = this.value; });
            }
          `,
        }}
      />
    </div>
  );
}
