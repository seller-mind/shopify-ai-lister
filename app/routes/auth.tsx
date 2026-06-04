import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { shopify } from '~/shopify.server';

/**
 * /auth - OAuth entry point
 * 
 * This route should ONLY be reached via a top-level navigation,
 * never from within an iframe. It redirects to Shopify's OAuth page.
 * 
 * For iframe contexts, the app._index.tsx handles OAuth via
 * client-side redirect (App Bridge or window.top).
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');

  if (!shop) {
    return new Response('Missing shop parameter', { status: 400 });
  }

  // Validate shop domain format
  const shopDomain = shop.replace(/https?:\/\//, '').split('/')[0];
  if (!shopDomain.includes('.myshopify.com')) {
    return new Response('Invalid shop domain', { status: 400 });
  }

  // Generate state for CSRF protection
  const state = crypto.randomUUID();
  const authUrl = shopify.getAuthUrl(shopDomain, state);

  console.log('[auth] Redirecting to OAuth for shop:', shopDomain);

  // Redirect to Shopify OAuth
  return redirect(authUrl);
}
