import { json, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
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
 * where app._index.tsx handles the OAuth flow correctly:
 * - In iframe: uses Shopify App Bridge or window.top to redirect
 * - At top level: uses window.location.href directly
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');
  
  if (shop) {
    // Redirect to /app with shop parameter - this is a same-origin redirect,
    // so it's safe in both iframe and top-level contexts.
    // app._index.tsx will handle OAuth if needed.
    return redirect(`/app?shop=${encodeURIComponent(shop)}`);
  }
  
  // Direct access without shop param - show landing page
  return redirect('/app');
}
