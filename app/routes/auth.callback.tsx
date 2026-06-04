import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { shopify, API_KEY } from '~/shopify.server';
import { storeSessionInDB, upsertStore } from '~/services/supabase.server';

/**
 * /auth/callback - OAuth callback handler
 * Shopify redirects here after the merchant authorizes the app
 * We exchange the code for an access token and store the session
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const shop = url.searchParams.get('shop');
  const state = url.searchParams.get('state');
  const hmac = url.searchParams.get('hmac');

  console.log('[auth/callback] Received callback:', { 
    hasCode: !!code, 
    shop, 
    hasState: !!state,
    hasHmac: !!hmac 
  });

  // If no code, this might be a re-auth request - redirect to auth
  if (!code && shop) {
    return redirect(`/auth?shop=${encodeURIComponent(shop)}`);
  }

  // Must have code and shop
  if (!code || !shop) {
    console.error('[auth/callback] Missing required OAuth parameters');
    return new Response('Missing required OAuth parameters', { status: 400 });
  }

  // Validate shop domain
  const shopDomain = shop.replace(/https?:\/\//, '').split('/')[0];
  if (!shopDomain.includes('.myshopify.com')) {
    console.error('[auth/callback] Invalid shop domain:', shopDomain);
    return new Response('Invalid shop domain', { status: 400 });
  }

  // Exchange code for access token
  console.log('[auth/callback] Exchanging code for token, shop:', shopDomain);
  const result = await shopify.exchangeCodeForToken(shopDomain, code);

  if (!result) {
    console.error('[auth/callback] Token exchange failed for shop:', shopDomain);
    return new Response('OAuth token exchange failed', { status: 400 });
  }

  console.log('[auth/callback] Token exchange successful, storing session for:', shopDomain);

  // Store session in database
  const sessionStored = await storeSessionInDB({
    id: `${shopDomain}_${Date.now()}`,
    shop: shopDomain,
    state: state || '',
    isOnline: true,
    accessToken: result.accessToken,
    scope: result.scope,
  });

  if (!sessionStored) {
    console.error('[auth/callback] Failed to store session for:', shopDomain);
    // Continue anyway - the session might still be usable
  }

  // Store/update store info
  await upsertStore(shopDomain, result.accessToken, true);

  // Register webhooks after installation
  try {
    await registerWebhooks(shopDomain, result.accessToken);
  } catch (error) {
    console.error('[auth/callback] Failed to register webhooks:', error);
  }

  console.log('[auth/callback] OAuth complete, redirecting to Shopify admin for:', shopDomain);

  // Redirect back to Shopify admin with the app
  return redirect(`https://${shopDomain}/admin/apps/${API_KEY}`);
}

/**
 * Register required webhooks with Shopify
 */
async function registerWebhooks(shop: string, accessToken: string) {
  const webhookTopics = [
    { topic: 'app/uninstalled', address: '/webhooks/app_uninstalled' },
    { topic: 'customers/data_request', address: '/webhooks/customers_data_request' },
    { topic: 'customers/redact', address: '/webhooks/customers_redact' },
    { topic: 'shop/redact', address: '/webhooks/shop_redact' },
  ];

  const appUrl = process.env.SHOPIFY_APP_URL;
  if (!appUrl) return;

  for (const webhook of webhookTopics) {
    try {
      const resp = await fetch(`https://${shop}/admin/api/2026-04/webhooks.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook: {
            topic: webhook.topic,
            address: `${appUrl}${webhook.address}`,
            format: 'json',
          },
        }),
      });
      const result = await resp.json();
      if (!resp.ok) {
        console.error(`[webhook] Failed to register ${webhook.topic}:`, result);
      }
    } catch (error) {
      console.error(`[webhook] Error registering ${webhook.topic}:`, error);
    }
  }
}
