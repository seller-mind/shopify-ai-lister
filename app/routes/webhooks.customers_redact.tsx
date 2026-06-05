import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { shopify } from '~/shopify.server';
import { getSupabaseAdmin } from '~/services/supabase.server';

/**
 * customers/redact - GDPR compliance webhook
 * 
 * When a customer requests data deletion, Shopify sends this webhook.
 * Redaction occurs 10 days after request, or 60 days after last order, whichever is later.
 * 
 * We must delete any PII associated with the specified customer.
 */
export async function action({ request }: ActionFunctionArgs) {
  const body = await request.text();
  const hmac = request.headers.get('X-Shopify-Hmac-Sha256') || '';
  const topic = request.headers.get('X-Shopify-Topic') || '';
  const shopDomain = request.headers.get('X-Shopify-Shop-Domain') || '';

  // Verify webhook signature — MUST reject invalid HMAC
  const isValid = await shopify.verifyHmac(body, hmac);
  if (!isValid) {
    console.error(`[GDPR] ❌ Invalid HMAC for ${topic} from ${shopDomain} — REJECTED`);
    return json({ error: 'Invalid signature' }, { status: 401 });
  }

  console.log(`[GDPR] ✅ ${topic} from ${shopDomain}`);

  try {
    const payload = JSON.parse(body);
    const customerEmail = payload.customer?.email;
    const customerId = payload.customer?.id;
    console.log(`[GDPR] Customer redact: shop_id=${payload.shop_id}, customer_id=${customerId}`);

    // Redact customer PII from WISMO conversations
    if (shopDomain && customerEmail) {
      const supabase = getSupabaseAdmin();
      
      // Anonymize customer PII in conversations matching this email
      const { data: convs } = await supabase
        .from('wismo_conversations')
        .select('id')
        .eq('shop', shopDomain)
        .eq('customer_email', customerEmail);
      
      if (convs && convs.length > 0) {
        const convIds = convs.map((c: { id: string }) => c.id);
        // Delete messages and feedback for these conversations
        await supabase.from('wismo_messages').delete().in('conversation_id', convIds);
        await supabase.from('wismo_feedback').delete().in('conversation_id', convIds);
        // Anonymize the conversation record itself
        await supabase
          .from('wismo_conversations')
          .update({ customer_email: '[REDACTED]', customer_name: '[REDACTED]' })
          .in('id', convIds);
        console.log(`[GDPR] ✅ Redacted ${convIds.length} conversations for customer ${customerId}`);
      }
    }
  } catch (e) {
    console.error('[GDPR] Error processing customers/redact:', e);
  }

  return json({ success: true });
}

export async function loader() {
  return json({ error: 'Method not allowed' }, { status: 405 });
}
