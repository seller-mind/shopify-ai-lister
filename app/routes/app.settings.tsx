/**
 * /app/settings - WISMO AI Settings
 * Clean, sectioned settings with professional design
 */
import { json } from '@remix-run/node';
import { useLoaderData, Form, useActionData, useNavigation } from '@remix-run/react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { authenticateAdmin } from '~/shopify.server';
import { getSupabaseAdmin, getStore } from '~/services/supabase.server';
import { injectWidget } from '~/services/widget-inject.server';
import { sanitizeText, sanitizeUrl, sanitizeColor, sanitizePosition, sanitizeFaqItem } from '~/utils/sanitize';
import { useState, useEffect } from 'react';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticateAdmin(request);
  let settings = null;
  try {
    const { data } = await getSupabaseAdmin().from('wismo_settings').select('*').eq('shop', session.shop).single();
    settings = data;
  } catch { /* defaults */ }

  // Extract return_policy from business_hours JSON
  const settingsData = settings ? {
    ...settings,
    return_policy: settings.business_hours?.return_policy || '',
  } : {
    enabled: true, widget_position: 'bottom-right', widget_color: '#008060',
    greeting: 'Track your order in seconds', brand_name: '', auto_reply_language: 'auto', faq_items: [],
    return_policy: '',
  };

  return json({
    shop: session.shop,
    settings: settingsData,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticateAdmin(request);
  const fd = await request.formData();

  const enabled = fd.get('enabled') === 'on';
  const widgetPosition = sanitizePosition((fd.get('widget_position') as string) || 'bottom-right');
  const widgetColor = sanitizeColor((fd.get('widget_color') as string) || '#008060');
  const greeting = sanitizeText((fd.get('greeting') as string) || 'Track your order in seconds').substring(0, 200);
  const brandName = sanitizeText((fd.get('brand_name') as string) || '').substring(0, 100);
  const autoReplyLanguage = (fd.get('auto_reply_language') as string) || 'auto';
  const returnPolicy = sanitizeUrl((fd.get('return_policy') as string) || '');

  const faqQuestions = fd.getAll('faq_question') as string[];
  const faqAnswers = fd.getAll('faq_answer') as string[];
  const faqItems = faqQuestions.map((q, i) => sanitizeFaqItem(q, faqAnswers[i] || '')).filter(item => item.question && item.answer);

  // Merge return_policy into business_hours JSON (column doesn't exist as standalone)
  const { data: existingSettings } = await getSupabaseAdmin().from('wismo_settings').select('business_hours').eq('shop', session.shop).single();
  const businessHours = { ...(existingSettings?.business_hours || {}), return_policy: returnPolicy || null };

  try {
    const { error } = await getSupabaseAdmin().from('wismo_settings').upsert({
      shop: session.shop, enabled, widget_position: widgetPosition, widget_color: widgetColor,
      greeting, brand_name: brandName, auto_reply_language: autoReplyLanguage, faq_items: faqItems,
      business_hours: businessHours,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'shop' });

    if (error) return json({ error: 'Failed to save settings' }, { status: 500 });

    // Re-inject widget with updated settings
    try {
      const store = await getStore(session.shop);
      if (store) {
        await injectWidget({
          shop: session.shop,
          accessToken: store.accessToken,
          position: widgetPosition,
          color: widgetColor,
          greeting,
          brandName: brandName,
        });
        console.log('[Settings] Widget re-injected with updated config');
      }
    } catch (e) {
      console.error('[Settings] Widget re-injection failed:', e);
    }

    return json({ success: true });
  } catch {
    return json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

export default function Settings() {
  const { settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSaving = navigation.state === 'submitting';
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [widgetColor, setWidgetColor] = useState(settings.widget_color);
  const [widgetPosition, setWidgetPosition] = useState(settings.widget_position);
  const [greeting, setGreeting] = useState(settings.greeting);
  const [showSuccess, setShowSuccess] = useState(false);

  // Show success checkmark
  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success) {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [actionData]);

  return (
    <div className="page">
      <h1>Settings</h1>
      <p className="sub">Configure your WISMO AI chatbot</p>

      {actionData && 'success' in actionData && actionData.success && (
        <div className="banner banner-success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Settings saved successfully
        </div>
      )}

      <Form method="post">
        {/* Widget Toggle */}
        <div className="card">
          <h2>Widget Status</h2>
          <label className="toggle-label">
            <div className="toggle-wrap">
              <input type="checkbox" name="enabled" defaultChecked={settings.enabled} className="toggle-input" />
              <div className="toggle-track">
                <div className="toggle-thumb" />
              </div>
            </div>
            <span className="toggle-text">Enable WISMO AI on your store</span>
          </label>
        </div>

        {/* Live Preview */}
        <div className="settings-preview">
          <h3>Live Preview</h3>
          <div style={{ display: 'flex', justifyContent: widgetPosition === 'bottom-left' ? 'flex-start' : 'flex-end' }}>
            <div className="mini-widget" style={{ maxWidth: '280px' }}>
              <div className="mini-widget-header" style={{ background: `linear-gradient(135deg, ${widgetColor}, ${adjustColor(widgetColor, 20)})` }}>
                <div className="mini-widget-avatar">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/></svg>
                </div>
                <div>
                  <div className="mini-widget-text">WISMO AI</div>
                  <div className="mini-widget-sub"><span className="mini-widget-dot"></span> Online</div>
                </div>
              </div>
              <div className="mini-widget-body">
                <div className="mini-widget-card">
                  <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>{greeting || 'Track your order in seconds'}</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      type="text" 
                      placeholder="#1001 or email" 
                      className="mini-widget-greeting" 
                      style={{ flex: 1, border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', outline: 'none' }}
                      disabled
                    />
                    <div style={{ background: widgetColor, color: '#fff', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>Track</div>
                  </div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>Order number or email address</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="card">
          <h2>Appearance</h2>
          <div className="settings-description">
            Choose how your chat widget looks. The position affects where customers see it on your store, and the color should match your brand.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>Widget Position</label>
              <select name="widget_position" defaultValue={settings.widget_position} onChange={(e) => setWidgetPosition(e.target.value)}>
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>
            <div className="form-group">
              <label>Widget Color</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="color" name="widget_color" defaultValue={settings.widget_color} className="color-picker" onInput={(e) => setWidgetColor((e.target as HTMLInputElement).value)} />
                <div className="color-presets">
                  {['#008060', '#000000', '#1a1a2e', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#ca8a04'].map(c => (
                    <button key={c} type="button" className={`color-swatch ${settings.widget_color === c ? 'color-swatch-active' : ''}`} style={{ background: c }} data-color={c} onClick={() => {
                      const picker = document.querySelector('input[name="widget_color"]') as HTMLInputElement;
                      if (picker) { picker.value = c; picker.dispatchEvent(new Event('input', { bubbles: true })); }
                      setWidgetColor(c);
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Behavior */}
        <div className="card">
          <h2>Chatbot Behavior</h2>
          <div className="settings-description">
            Customize how WISMO AI communicates with your customers. Good settings here make the bot feel more like a helpful team member than a robot.
          </div>
          <div className="form-group">
            <label>Brand Name</label>
            <input type="text" name="brand_name" defaultValue={settings.brand_name} placeholder="Your store name" />
            <p className="hint">Used in AI responses to match your brand voice — makes responses feel more personal</p>
          </div>
          <div className="form-group">
            <label>Greeting Message</label>
            <input type="text" name="greeting" defaultValue={settings.greeting} onChange={(e) => setGreeting(e.target.value)} />
            <p className="hint">The first message customers see — keep it short and inviting (e.g., "Track your order in seconds")</p>
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
              <option value="ko">한국어</option>
              <option value="pt">Português</option>
              <option value="it">Italiano</option>
              <option value="nl">Nederlands</option>
              <option value="ru">Русский</option>
              <option value="ar">العربية</option>
              <option value="th">ไทย</option>
              <option value="vi">Tiếng Việt</option>
              <option value="id">Bahasa Indonesia</option>
              <option value="tr">Türkçe</option>
              <option value="pl">Polski</option>
              <option value="sv">Svenska</option>
              <option value="hi">हिन्दी</option>
            </select>
            <p className="hint">Auto-detect means the AI will respond in the customer's language (20+ languages supported)</p>
          </div>
          <div className="form-group">
            <label>Return Policy URL</label>
            <input type="text" name="return_policy" defaultValue={settings.return_policy || ''} placeholder="https://yourstore.com/policies/refund-policy" />
            <p className="hint">When customers ask about returns, the AI will reference your return policy — reduces support tickets</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="card">
          <h2>FAQ Items</h2>
          <div className="settings-description">
            Add common questions and answers. The AI will use these to respond to customers automatically — no more repetitive support tickets.
          </div>
          <div id="faq-list">
            {(settings.faq_items || []).map((item: any, i: number) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '8px' }}>
                <input type="text" name="faq_question" defaultValue={item.question} placeholder="Question" style={{ padding: '10px 12px', border: '1px solid #e1e3e5', borderRadius: '10px', fontSize: '14px' }} />
                <input type="text" name="faq_answer" defaultValue={item.answer} placeholder="Answer" style={{ padding: '10px 12px', border: '1px solid #e1e3e5', borderRadius: '10px', fontSize: '14px' }} />
                <button type="button" className="btn" style={{ padding: '8px 12px', color: '#dc2626' }} onClick={(e) => { (e.currentTarget.closest('div') as HTMLElement)?.remove(); }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
              </div>
            ))}
          </div>
          <AddFaqButton />
        </div>

        {/* Compliance Notice */}
        <div style={{ marginTop: '32px', padding: '16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <strong style={{ fontSize: '14px', color: '#1e40af' }}>Legal Compliance Notice</strong>
          </div>
          <ul style={{ fontSize: '13px', color: '#1e40af', lineHeight: '1.6', paddingLeft: '20px', margin: '0' }}>
            <li>You are the <strong>Data Controller</strong> for your customers' data processed through this chatbot. We act as your Data Processor.</li>
            <li>Your privacy policy must disclose the use of this AI chatbot. We display &quot;AI-powered&quot; in the widget header.</li>
            <li>For EU merchants: Our <a href="/dpa" target="_blank" style={{ color: '#2563eb' }}>DPA</a> is available. GDPR webhooks (data request, redaction) are fully supported.</li>
            <li>Customer conversations are retained for 90 days and automatically purged. All data is deleted upon uninstallation.</li>
          </ul>
        </div>

        {/* Save Button */}
        <div className="btn-save-wrap">
          <button type="submit" className={`btn btn-primary ${showSuccess ? 'btn-save-success' : ''}`} disabled={isSaving} style={{ width: '100%', padding: '14px', fontSize: '15px', borderRadius: '12px' }}>
            {isSaving ? (
              <>Saving...</>
            ) : showSuccess ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Saved!
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </Form>

      {/* FAQ Accordion */}
      <div className="card" style={{ marginTop: '24px' }}>
        <h2>Frequently Asked Questions</h2>
        {[
          { q: 'How does WISMO AI track orders?', a: 'WISMO AI connects directly to your Shopify store and uses the order number customers provide to look up real-time status, tracking numbers, and shipping estimates.' },
          { q: 'What languages does it support?', a: 'WISMO AI auto-detects and responds in 20+ languages including English, Chinese, Spanish, French, German, Japanese, Korean, Portuguese, Italian, and more.' },
          { q: 'Can customers track orders without an account?', a: 'Yes! Customers just need their order number. No login or account required.' },
          { q: 'How do I know if it\'s working?', a: 'Check the Dashboard to see conversation counts, resolution rates, and recent chats. Green "Active" status means the widget is live.' },
        ].map((faq, i) => (
          <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
            <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              {faq.q}
              <svg className="faq-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <div className="faq-answer">
              <div className="faq-answer-inner">{faq.a}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Install */}
      <div className="card" style={{ marginTop: '16px' }}>
        <h2>Install Widget</h2>
        <div className="banner banner-info" style={{ marginBottom: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          The widget is automatically injected into your store theme. No code changes needed.
        </div>
      </div>
    </div>
  );
}

// React component to replace dangerouslySetInnerHTML <script> (which doesn't execute in Remix)
function AddFaqButton() {
  const handleClick = () => {
    const list = document.getElementById('faq-list');
    if (!list) return;
    const div = document.createElement('div');
    div.style.cssText = 'display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px';
    div.innerHTML = '<input type="text" name="faq_question" placeholder="Question" style="padding:10px 12px;border:1px solid #e1e3e5;border-radius:10px;font-size:14px" /><input type="text" name="faq_answer" placeholder="Answer" style="padding:10px 12px;border:1px solid #e1e3e5;border-radius:10px;font-size:14px" /><button type="button" class="btn" style="padding:8px 12px;color:#dc2626"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
    div.querySelector('button')?.addEventListener('click', () => div.remove());
    list.appendChild(div);
    // Focus the new question input
    const input = div.querySelector('input[name="faq_question"]') as HTMLInputElement;
    if (input) input.focus();
  };
  return <button type="button" className="btn" style={{ marginTop: '4px' }} onClick={handleClick}>+ Add FAQ Item</button>;
}

// Helper to lighten/darken hex colors
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
