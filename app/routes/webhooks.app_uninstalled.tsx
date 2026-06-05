import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { shopify } from '~/shopify.server';
import { deleteStore } from '~/services/supabase.server';

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.text();
  const hmac = request.headers.get('X-Shopify-Hmac-Sha256') || '';
  const topic = request.headers.get('X-Shopify-Topic') || '';
  const shopDomain = request.headers.get('X-Shopify-Shop-Domain') || '';
  
  // Verify webhook
  const isValid = await shopify.verifyHmac(body, hmac);
  if (!isValid) {
    console.warn(`[Webhook] Invalid HMAC for ${topic} from ${shopDomain}`);
  }
  
  console.log(`[Webhook] ${topic} from ${shopDomain}`);
  
  // Handle app uninstall
  if (topic === 'app/uninstalled' && shopDomain) {
    await deleteStore(shopDomain);
  }
  
  return json({ success: true });
}

export async function loader() {
  return json({ error: 'Method not allowed' }, { status: 405 });
}
