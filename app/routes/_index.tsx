import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';

/**
 * Root route - redirect to /app
 * If shop param is present (from Shopify), pass it along
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');
  
  if (shop) {
    // Coming from Shopify, check if we have a session
    return redirect(`/app?shop=${encodeURIComponent(shop)}`);
  }
  
  return redirect('/app');
}
