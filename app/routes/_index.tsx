import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';

/**
 * Root route - the entry point for Shopify app installation
 * 
 * When Shopify starts the OAuth flow, it redirects here with ?shop=xxx
 * at the TOP LEVEL (not in an iframe). We must redirect to /auth to
 * start the server-side OAuth flow. This is the ONLY reliable way to
 * complete OAuth - client-side redirects from within an iframe don't work.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');
  
  if (shop) {
    // Coming from Shopify - start OAuth flow via server redirect
    return redirect(`/auth?shop=${encodeURIComponent(shop)}`);
  }
  
  // Direct access without shop param - show landing page
  return redirect('/app');
}
