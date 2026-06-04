/**
 * GET /api/widget-config - Returns widget configuration for a store
 * Called by the storefront widget script on page load
 */
import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { getSupabaseAdmin, getStore } from '~/services/supabase.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');

  if (!shop) {
    return json({ error: 'Missing shop parameter' }, { status: 400 });
  }

  // Verify store exists and has app installed
  const store = await getStore(shop);
  if (!store) {
    return json({ error: 'Store not found' }, { status: 404 });
  }

  // Get WISMO settings
  let settings = {
    enabled: true,
    widgetPosition: 'bottom-right',
    widgetColor: '#008060',
    greeting: 'Hi! 👋 How can I help you today?',
    brandName: '',
  };

  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('wismo_settings')
      .select('*')
      .eq('shop', shop)
      .single();

    if (data) {
      settings = {
        enabled: data.enabled ?? true,
        widgetPosition: data.widget_position ?? 'bottom-right',
        widgetColor: data.widget_color ?? '#008060',
        greeting: data.greeting ?? 'Hi! 👋 How can I help you today?',
        brandName: data.brand_name ?? '',
      };
    }
  } catch { /* use defaults */ }

  if (!settings.enabled) {
    return json({ enabled: false });
  }

  return json({
    enabled: true,
    position: settings.widgetPosition,
    color: settings.widgetColor,
    greeting: settings.greeting,
    brandName: settings.brandName,
    apiEndpoint: `https://shopify-ai-lister-tau.vercel.app/api/chat`,
    shop,
  });
}
