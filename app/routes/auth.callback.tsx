import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { shopify, API_KEY, buildShopCookie } from '~/shopify.server';
import { storeSessionInDB, upsertStore } from '~/services/supabase.server';
import { injectWidget } from '~/services/widget-inject.server';

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
  const timestamp = url.searchParams.get('timestamp');

  console.log('[auth/callback] Received callback:', { 
    hasCode: !!code, 
    shop, 
    hasState: !!state,
    hasHmac: !!hmac,
  });

  if (!code && shop) {
    console.log('[auth/callback] No code, redirecting to /auth');
    return redirect(`/auth?shop=${encodeURIComponent(shop)}`);
  }

  if (!code || !shop) {
    console.error('[auth/callback] Missing required OAuth parameters');
    return new Response('Missing required OAuth parameters', { status: 400 });
  }

  // Validate shop domain format (prevent open redirect)
  const shopDomain = shop.replace(/https?:\/\//, '').split('/')[0];
  if (!shopDomain.endsWith('.myshopify.com') || shopDomain.length < 10) {
    console.error('[auth/callback] Invalid shop domain:', shopDomain);
    return new Response('Invalid shop domain', { status: 400 });
  }

  // Verify HMAC to prevent URL tampering (Shopify includes hmac + timestamp in callback)
  // This is separate from the state parameter — it's the URL-level signature
  if (hmac && timestamp) {
    const params = new URLSearchParams(url.search);
    params.delete('hmac');
    const sortedParams = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
    const message = sortedParams.map(([k, v]) => `${k}=${v}`).join('&');
    const isValidHmac = await shopify.verifyHmac(message, hmac);
    if (!isValidHmac) {
      console.error('[auth/callback] Invalid HMAC signature — possible URL tampering');
      return new Response('Invalid signature', { status: 401 });
    }
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

  // Webhooks are registered via shopify.app.toml (compliance_topics + topics)
  // and deployed via `shopify app deploy`. No per-shop registration needed.
  // App-level webhooks automatically apply to all installations.

  console.log('[auth/callback] OAuth complete! Redirecting to Shopify admin for:', shopDomain);

  // Auto-inject WISMO widget into the store's theme
  try {
    const widgetResult = await injectWidget({ shop: shopDomain, accessToken: result.accessToken });
    if (widgetResult.success) {
      console.log('[auth/callback] ✅ Widget auto-injected into theme');
    } else {
      console.error('[auth/callback] ⚠️ Widget injection failed:', widgetResult.error);
    }
  } catch (e) {
    console.error('[auth/callback] ⚠️ Widget injection exception:', e);
  }

  const shopName = shopDomain.replace('.myshopify.com', '');
  // Set a CHIPS-compliant sticky shop cookie so subsequent embedded iframe
  // requests can resolve shop even if query/referer is stripped by some browsers.
  return redirect(`https://admin.shopify.com/store/${shopName}/apps/${API_KEY}`, {
    headers: { 'Set-Cookie': buildShopCookie(shopDomain) },
  });
}

// Webhook registration handled by shopify.app.toml + `shopify app deploy`
// All webhooks (app/uninstalled + GDPR compliance) are registered as app-level
// webhooks and apply to all installations automatically.
