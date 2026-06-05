import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { shopify } from '~/shopify.server';

/**
 * /auth - OAuth entry point
 * 
 * This route should ONLY be reached via a top-level navigation,
 * never from within an iframe. It redirects to Shopify's OAuth page.
 * 
 * Flow:
 * 1. App detects no session in iframe → uses App Bridge to escape iframe
 *    → redirects top-level window to /auth?shop=xxx (without embedded=1)
 * 2. This route does a server-side 3xx redirect to Shopify OAuth grant screen
 * 3. After user authorizes, Shopify redirects to /auth/callback
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');

  if (!shop) {
    return new Response('Missing shop parameter', { status: 400 });
  }

  // Validate shop domain format (prevent open redirect)
  const shopDomain = shop.replace(/https?:\/\//, '').split('/')[0];
  if (!shopDomain.endsWith('.myshopify.com') || shopDomain.length < 10) {
    return new Response('Invalid shop domain', { status: 400 });
  }

  // Generate state for CSRF protection
  const state = crypto.randomUUID();
  const authUrl = shopify.getAuthUrl(shopDomain, state);

  console.log('[auth] Redirecting to OAuth for shop:', shopDomain);

  // Server-side 3xx redirect to Shopify OAuth
  // This works because we're at the top level (not in an iframe)
  return redirect(authUrl);
}
