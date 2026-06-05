import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { shopify } from '~/shopify.server';
import { deleteStore } from '~/services/supabase.server';

/**
 * app/uninstalled - Webhook handler
 * 
 * Fired when a merchant uninstalls the app.
 * We delete all shop data immediately (Shopify sends shop/redact 48h later as backup).
 */
export async function action({ request }: ActionFunctionArgs) {
  const body = await request.text();
  const hmac = request.headers.get('X-Shopify-Hmac-Sha256') || '';
  const topic = request.headers.get('X-Shopify-Topic') || '';
  const shopDomain = request.headers.get('X-Shopify-Shop-Domain') || '';
  
  // Verify webhook signature — MUST reject invalid HMAC
  const isValid = await shopify.verifyHmac(body, hmac);
  if (!isValid) {
    console.error(`[Webhook] ❌ Invalid HMAC for ${topic} from ${shopDomain} — REJECTED`);
    return json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  console.log(`[Webhook] ✅ ${topic} from ${shopDomain}`);
  
  // Handle app uninstall — delete all data
  if (topic === 'app/uninstalled' && shopDomain) {
    const deleted = await deleteStore(shopDomain);
    if (deleted) {
      console.log(`[Webhook] ✅ All data deleted for ${shopDomain}`);
    } else {
      console.error(`[Webhook] ❌ Failed to delete data for ${shopDomain}`);
    }
  }
  
  return json({ success: true });
}

export async function loader() {
  return json({ error: 'Method not allowed' }, { status: 405 });
}
