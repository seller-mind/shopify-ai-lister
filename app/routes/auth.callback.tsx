import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { shopify, API_KEY } from '~/shopify.server';
import { storeSessionInDB, upsertStore } from '~/services/supabase.server';

/**
 * /auth/callback - OAuth callback handler
 * 
 * Shopify redirects here after the merchant authorizes the app.
 * We exchange the code for an access token and store the session.
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
    hasHmac: !!hmac,
    fullURL: request.url
  });

  if (!code && shop) {
    console.log('[auth/callback] No code, redirecting to /auth');
    return redirect(`/auth?shop=${encodeURIComponent(shop)}`);
  }

  if (!code || !shop) {
    console.error('[auth/callback] Missing required OAuth parameters');
    return new Response('Missing required OAuth parameters', { status: 400 });
  }

  const shopDomain = shop.replace(/https?:\/\//, '').split('/')[0];
  if (!shopDomain.includes('.myshopify.com')) {
    console.error('[auth/callback] Invalid shop domain:', shopDomain);
    return new Response('Invalid shop domain', { status: 400 });
  }

  console.log('[auth/callback] Exchanging code for token, shop:', shopDomain);
  
  let result;
  try {
    result = await shopify.exchangeCodeForToken(shopDomain, code);
  } catch (error) {
    console.error('[auth/callback] Token exchange exception:', error);
    return new Response('OAuth token exchange failed (exception)', { status: 500 });
  }

  if (!result) {
    console.error('[auth/callback] Token exchange returned null for shop:', shopDomain);
    return new Response('OAuth token exchange failed (null result)', { status: 400 });
  }

  console.log('[auth/callback] Token exchange successful! Scope:', result.scope);

  const sessionId = `${shopDomain}_${Date.now()}`;
  console.log('[auth/callback] Storing session:', sessionId);
  
  const sessionStored = await storeSessionInDB({
    id: sessionId,
    shop: shopDomain,
    state: state || '',
    isOnline: true,
    accessToken: result.accessToken,
    scope: result.scope,
  });

  if (!sessionStored) {
    console.error('[auth/callback] ❌ Failed to store session for:', shopDomain);
  } else {
    console.log('[auth/callback] ✅ Session stored successfully');
  }

  const storeId = await upsertStore(shopDomain, result.accessToken, true);
  if (!storeId) {
    console.error('[auth/callback] ❌ Failed to upsert store for:', shopDomain);
  } else {
    console.log('[auth/callback] ✅ Store upserted:', storeId);
  }

  // Register webhooks after installation
  try {
    await registerWebhooks(shopDomain, result.accessToken);
  } catch (error) {
    console.error('[auth/callback] Failed to register webhooks:', error);
  }

  // Register ScriptTag for widget auto-injection
  try {
    await registerScriptTag(shopDomain, result.accessToken);
  } catch (error) {
    console.error('[auth/callback] Failed to register script tag:', error);
  }

  console.log('[auth/callback] OAuth complete! Redirecting to Shopify admin for:', shopDomain);

  const shopName = shopDomain.replace('.myshopify.com', '');
  return redirect(`https://admin.shopify.com/store/${shopName}/apps/${API_KEY}`);
}

/**
 * Register webhooks with Shopify
 */
async function registerWebhooks(shop: string, accessToken: string) {
  const appUrl = process.env.SHOPIFY_APP_URL;
  if (!appUrl) return;

  const regularWebhooks = [
    { topic: 'app/uninstalled', address: '/webhooks/app_uninstalled' },
  ];

  for (const webhook of regularWebhooks) {
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
      } else {
        console.log(`[webhook] Registered ${webhook.topic}`);
      }
    } catch (error) {
      console.error(`[webhook] Error registering ${webhook.topic}:`, error);
    }
  }
}

/**
 * Register ScriptTag for automatic widget injection on the storefront
 * This loads our chat widget JS on all pages of the merchant's store
 */
async function registerScriptTag(shop: string, accessToken: string) {
  const appUrl = process.env.SHOPIFY_APP_URL;
  if (!appUrl) return;

  const widgetSrc = `${appUrl}/widget.js?shop=${shop}`;
  
  try {
    // Check if script tag already exists
    const listResp = await fetch(`https://${shop}/admin/api/2026-04/script_tags.json?src=${encodeURIComponent(widgetSrc)}`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });
    const listData = await listResp.json();
    
    if (listData.script_tags?.length > 0) {
      console.log('[script-tag] Already registered');
      return;
    }

    // Create script tag
    const resp = await fetch(`https://${shop}/admin/api/2026-04/script_tags.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script_tag: {
          event: 'onload',
          src: widgetSrc,
          display_scope: 'online_store',
        },
      }),
    });
    
    const result = await resp.json();
    if (!resp.ok) {
      console.error('[script-tag] Failed to register:', result);
    } else {
      console.log('[script-tag] ✅ Registered:', result.script_tag?.id);
    }
  } catch (error) {
    console.error('[script-tag] Error:', error);
  }
}
