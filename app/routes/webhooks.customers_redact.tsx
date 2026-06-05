import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { shopify } from '~/shopify.server';

/**
 * customers/redact - GDPR compliance webhook
 * 
 * When a customer requests data deletion, Shopify sends this webhook.
 * Redaction occurs 10 days after request, or 60 days after last order, whichever is later.
 * 
 * Since our app doesn't store customer PII, we log and acknowledge.
 */
export async function action({ request }: ActionFunctionArgs) {
  const body = await request.text();
  const hmac = request.headers.get('X-Shopify-Hmac-Sha256') || '';
  const topic = request.headers.get('X-Shopify-Topic') || '';
  const shopDomain = request.headers.get('X-Shopify-Shop-Domain') || '';

  // Verify webhook signature
  const isValid = await shopify.verifyHmac(body, hmac);
  if (!isValid) {
    console.warn(`[GDPR] Invalid HMAC for ${topic} from ${shopDomain}`);
    console.warn('[GDPR] HMAC verification failed - still acknowledging request');
  }

  console.log(`[GDPR] ${topic} from ${shopDomain}`);

  try {
    const payload = JSON.parse(body);
    console.log(`[GDPR] Customer redact: shop_id=${payload.shop_id}, customer_id=${payload.customer?.id}, orders_to_redact=${payload.orders_to_redact?.length || 0}`);

    // Our app doesn't store customer PII - no customer data to redact.
    // We acknowledge the request as required.
  } catch (e) {
    console.error('[GDPR] Error parsing customers/redact payload:', e);
  }

  return json({ success: true });
}

export async function loader() {
  return json({ error: 'Method not allowed' }, { status: 405 });
}
