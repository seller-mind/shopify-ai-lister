import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';

/**
 * Root route - the entry point for Shopify app
 * 
 * CRITICAL: This route can be loaded in TWO contexts:
 * 1. TOP-LEVEL: During initial app installation, Shopify redirects here with ?shop=xxx
 * 2. IFRAME: After installation, Shopify admin loads this URL in an iframe
 * 
 * We MUST NOT do a server-side redirect to an external URL (OAuth),
 * because that would happen inside the iframe and get blocked by
 * Shopify's X-Frame-Options.
 * 
 * Instead, we redirect to /app (same-origin, safe in iframe),
 * preserving all Shopify parameters (shop, host, embedded).
 * app._index.tsx then handles the OAuth flow correctly:
 * - If embedded=1: uses Shopify App Bridge to escape iframe, then redirect to OAuth
 * - If not embedded: redirects directly to OAuth
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');
  const host = url.searchParams.get('host');
  const embedded = url.searchParams.get('embedded');
  
  if (shop) {
    // Preserve ALL Shopify parameters when redirecting to /app
    // shop, host, and embedded are all needed for App Bridge initialization
    const params = new URLSearchParams();
    params.set('shop', shop);
    if (host) params.set('host', host);
    if (embedded) params.set('embedded', embedded);
    return redirect(`/app?${params.toString()}`);
  }
  
  // Direct access without shop param - redirect to /app
  return redirect('/app');
}
