import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { shopify, API_KEY, API_SECRET } from '~/shopify.server';
import { storeSessionInDB, upsertStore } from '~/services/supabase.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  
  // Step 1: If no code, redirect to OAuth
  if (!code && shop) {
    const authState = crypto.randomUUID();
    const authUrl = shopify.getAuthUrl(shop, authState);
    return redirect(authUrl);
  }
  
  // Step 2: Exchange code for token
  if (code && shop) {
    const result = await shopify.exchangeCodeForToken(shop, code);
    
    if (!result) {
      return new Response('OAuth failed', { status: 400 });
    }
    
    // Store session in DB
    await storeSessionInDB({
      id: `${shop}_${Date.now()}`,
      shop,
      state: state || '',
      isOnline: true,
      accessToken: result.accessToken,
      scope: result.scope,
    });
    
    // Store store info
    await upsertStore(shop, result.accessToken, true);
    
    // Redirect to app in Shopify admin
    return redirect(`https://${shop}/admin/apps/${API_KEY}`);
  }
  
  return redirect('/app');
}
