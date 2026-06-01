import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { shopify } from '~/shopify.server';

/**
 * /auth - OAuth entry point
 * Shopify redirects here when installing or opening the app
 * We redirect to Shopify's OAuth authorization page
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

  // Redirect to Shopify OAuth
  return redirect(authUrl);
}
