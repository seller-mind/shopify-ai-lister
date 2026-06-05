import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { shopify } from '~/shopify.server';
import { deleteStore } from '~/services/supabase.server';

/**
 * shop/redact - GDPR compliance webhook
 * 
 * Fired 48 hours after a merchant uninstalls the app.
 * We must delete ALL shop data within 30 days.
 * 
 * This handler deletes all data for the shop from our database,
 * including WISMO conversations, messages, feedback, analytics, and settings.
 */
export async function action({ request }: ActionFunctionArgs) {
  const body = await request.text();
  const hmac = request.headers.get('X-Shopify-Hmac-Sha256') || '';
  const topic = request.headers.get('X-Shopify-Topic') || '';
  const shopDomain = request.headers.get('X-Shopify-Shop-Domain') || '';

  // Verify webhook signature — MUST reject invalid HMAC
  // This is critical: without verification, anyone could trigger shop data deletion
  const isValid = await shopify.verifyHmac(body, hmac);
  if (!isValid) {
    console.error(`[GDPR] ❌ Invalid HMAC for ${topic} from ${shopDomain} — REJECTED`);
    return json({ error: 'Invalid signature' }, { status: 401 });
  }

  console.log(`[GDPR] ✅ ${topic} from ${shopDomain}`);

  try {
    const payload = JSON.parse(body);
    console.log(`[GDPR] Shop redact: shop_id=${payload.shop_id}, shop_domain=${payload.shop_domain}`);

    // Delete ALL data for this shop from our database
    if (shopDomain) {
      const deleted = await deleteStore(shopDomain);
      if (deleted) {
        console.log(`[GDPR] ✅ All data deleted for ${shopDomain}`);
      } else {
        console.error(`[GDPR] ❌ Failed to delete data for ${shopDomain}`);
      }
    }
  } catch (e) {
    console.error('[GDPR] Error processing shop/redact:', e);
  }

  return json({ success: true });
}

export async function loader() {
  return json({ error: 'Method not allowed' }, { status: 405 });
}
