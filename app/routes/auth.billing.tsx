/**
 * /auth/billing - Billing confirmation callback
 * 
 * After a merchant confirms/cancels a subscription in Shopify,
 * Shopify redirects them here with charge_id parameter.
 * We redirect back to the app dashboard.
 */
import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { API_KEY } from '~/shopify.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');

  // With the GraphQL Billing API, Shopify handles the subscription activation
  // automatically when the merchant confirms. We just redirect back to the app.
  
  console.log('[Billing] Confirmation callback received for shop:', shop);

  // Redirect back to app dashboard
  if (shop) {
    const shopName = shop.replace('.myshopify.com', '');
    return redirect(`https://admin.shopify.com/store/${shopName}/apps/${API_KEY}`);
  }

  // Fallback redirect
  return redirect('https://admin.shopify.com');
}
