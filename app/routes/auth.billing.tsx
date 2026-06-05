/**
 * /auth/billing - Billing confirmation callback
 * 
 * After a merchant confirms/cancels a subscription in Shopify,
 * Shopify redirects them here with charge_id parameter.
 * We update the store's plan and redirect back to the app.
 */
import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { authenticateAdmin, shopifyREST, API_KEY } from '~/shopify.server';
import { getSupabaseAdmin } from '~/services/supabase.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const chargeId = url.searchParams.get('charge_id');
  const shop = url.searchParams.get('shop');

  if (!chargeId || !shop) {
    return redirect(`/app?shop=${shop || ''}`);
  }

  // Verify the charge status via Shopify API
  try {
    const { session } = await authenticateAdmin(request);
    const result = await shopifyREST(
      session.shop,
      session.accessToken,
      `/recurring_application_charges/${chargeId}.json`
    );

    const charge = result.recurring_application_charge;
    if (charge?.status === 'active') {
      // Update store plan in database
      const supabase = getSupabaseAdmin();
      const planName = charge.name?.toUpperCase() || 'STARTER';
      
      await supabase
        .from('stores')
        .update({ plan: planName, updated_at: new Date().toISOString() })
        .eq('shop', session.shop);

      console.log(`[Billing] Store ${session.shop} subscribed to ${planName}`);
    } else if (charge?.status === 'declined') {
      console.log(`[Billing] Store ${session.shop} declined subscription`);
    }
  } catch (error) {
    console.error('[Billing] Error processing billing callback:', error);
  }

  // Redirect back to app
  const shopName = shop.replace('.myshopify.com', '');
  return redirect(`https://admin.shopify.com/store/${shopName}/apps/${API_KEY}`);
}
