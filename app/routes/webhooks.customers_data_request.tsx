import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { shopify } from '~/shopify.server';

/**
 * customers/data_request - GDPR compliance webhook
 * 
 * When a customer requests their data, Shopify sends this webhook.
 * We must acknowledge receipt with 200 and provide data within 30 days.
 * 
 * Since our app doesn't store customer PII (only product generation data),
 * we log the request and return success.
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
    console.log(`[GDPR] Customer data request: shop_id=${payload.shop_id}, customer_id=${payload.customer?.id}`);

    // Our app doesn't store customer PII - only product generation data
    // tied to the shop domain, not individual customers.
    // No customer data to return, but we acknowledge the request.
  } catch (e) {
    console.error('[GDPR] Error parsing customers/data_request payload:', e);
  }

  return json({ success: true });
}

export async function loader() {
  return json({ error: 'Method not allowed' }, { status: 405 });
}
