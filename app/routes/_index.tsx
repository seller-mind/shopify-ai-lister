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
    // Coming from Shopify - pass shop param to /app
    return redirect(`/app?shop=${encodeURIComponent(shop)}`);
  }
  
  // For direct access without shop param, show a landing/redirect
  return redirect('/app');
}
