import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';

/**
 * Root route - entry point for Shopify app
 *
 * Non-embedded mode: Shopify opens this URL in a new browser tab.
 * No iframe issues. Simply redirect to /app preserving shop param.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');
  
  if (shop) {
    return redirect(`/app?shop=${encodeURIComponent(shop)}`);
  }
  
  return redirect('/app');
}
