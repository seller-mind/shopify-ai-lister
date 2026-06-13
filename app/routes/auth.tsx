import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { shopify } from '~/shopify.server';

/**
 * /auth - OAuth entry point
 *
 * This route MUST be reached as a top-level navigation (not inside iframe).
 * It performs a server-side 3xx redirect to the Shopify OAuth grant screen,
 * which is the recommended pattern for Shopify embedded apps.
 *
 * Flow:
 * 1. App detects no/invalid session in iframe → renders an Authorize button with
 *    target="_top" pointing to /auth?shop=xxx
 * 2. Browser navigates the top window to /auth?shop=xxx (escapes iframe)
 * 3. This loader does a 302 redirect to https://{shop}/admin/oauth/authorize
 * 4. After user approves, Shopify redirects back to /auth/callback
 * 5. /auth/callback exchanges code → access_token, stores session, redirects
 *    to https://admin.shopify.com/store/{name}/apps/{API_KEY} (re-enters embedded admin)
 *
 * Note: shop param is REQUIRED for OAuth. We try multiple sources before giving up.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  let shop = url.searchParams.get('shop');

  // Fallback 1: try Referer header (e.g. when navigating from inside Admin)
  if (!shop) {
    const referer = request.headers.get('referer');
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        shop = refererUrl.searchParams.get('shop');
      } catch {
        /* invalid referer — ignore */
      }
    }
  }

  if (!shop) {
    // Render a small HTML page asking for shop, instead of opaque 400.
    // The audit reviewer should never hit this path, but render-friendly fallback
    // beats a hard 400 if any link is malformed.
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Install WISMO AI</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;background:#f6f6f7;margin:0;padding:40px;color:#1c1c1e}
.box{max-width:480px;margin:80px auto;background:#fff;border-radius:14px;padding:32px;border:1px solid #e1e3e5;text-align:center}
h1{font-size:20px;margin:0 0 8px}p{color:#6d7175;font-size:14px;line-height:1.6;margin:8px 0 20px}
input{width:100%;padding:12px;border:1px solid #c9cccf;border-radius:8px;font-size:14px;box-sizing:border-box;margin-bottom:12px}
button{width:100%;padding:12px;background:#008060;color:#fff;border:0;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px}
.hint{font-size:12px;color:#8c9196;margin-top:8px}</style></head>
<body><div class="box">
<h1>Install WISMO AI</h1>
<p>Enter your Shopify store domain to begin authorization.</p>
<form method="GET" action="/auth">
<input name="shop" placeholder="your-store.myshopify.com" required pattern="[a-zA-Z0-9-]+\\.myshopify\\.com" autofocus />
<button type="submit">Continue to Shopify</button>
<p class="hint">Format: your-store.myshopify.com</p>
</form></div></body></html>`;
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Validate shop domain format (prevent open redirect)
  const shopDomain = shop.replace(/https?:\/\//, '').split('/')[0].toLowerCase().trim();
  if (!shopDomain.endsWith('.myshopify.com') || shopDomain.length < 14 || shopDomain.length > 100) {
    console.error('[auth] Invalid shop domain rejected:', shopDomain);
    return new Response('Invalid shop domain', { status: 400 });
  }
  // Extra safety: only allow [a-z0-9-] in store name
  const storeName = shopDomain.replace('.myshopify.com', '');
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/i.test(storeName)) {
    console.error('[auth] Invalid store name format:', storeName);
    return new Response('Invalid shop domain', { status: 400 });
  }

  // Generate state for CSRF protection (passed through OAuth round-trip)
  const state = crypto.randomUUID();
  const authUrl = shopify.getAuthUrl(shopDomain, state);

  console.log('[auth] Top-level redirect to OAuth grant page for shop:', shopDomain);

  // Server-side 3xx redirect to Shopify OAuth (top-level, not iframe)
  return redirect(authUrl);
}
