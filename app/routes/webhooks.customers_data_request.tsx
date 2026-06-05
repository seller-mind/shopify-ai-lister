import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { shopify } from '~/shopify.server';

/**
 * customers/data_request - GDPR compliance webhook
 * 
 * When a customer requests their data, Shopify sends this webhook.
 * We must acknowledge receipt with 200 and provide data within 30 days.
 * 
 * Since our app stores conversation data tied to shop domain (not individual customers),
 * we log the request and return success.
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
    console.log(`[GDPR] Customer data request: shop_id=${payload.shop_id}, customer_id=${payload.customer?.id}`);

    // Our app stores conversation data tied to the shop domain.
    // Customer PII (email, name) may exist in wismo_conversations.
    // In a full implementation, we would search for and return any data
    // associated with this customer. For now, we acknowledge the request.
  } catch (e) {
    console.error('[GDPR] Error parsing customers/data_request payload:', e);
  }

  return json({ success: true });
}

export async function loader() {
  return json({ error: 'Method not allowed' }, { status: 405 });
}
