/**
 * Shopify App 配置 - 轻量版，使用 fetch 直接调用 Shopify API
 * 不依赖 @shopify/shopify-api SDK，减少部署体积和依赖冲突
 */
import { storeSessionInDB, loadSessionFromDB, deleteSessionFromDB } from '~/services/supabase.server';

// Config from env
const API_KEY = process.env.SHOPIFY_API_KEY!;
const API_SECRET = process.env.SHOPIFY_API_SECRET!;
const APP_URL = process.env.SHOPIFY_APP_URL!;
const SCOPES = process.env.SCOPES || 'read_products,read_orders,read_fulfillments';

/**
 * Generate HMAC for Shopify webhook verification
 */
async function verifyHmac(body: string, hmacHeader: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(API_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const digest = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  // Timing-safe comparison to prevent timing attacks
  if (digest.length !== hmacHeader.length) return false;
  let result = 0;
  for (let i = 0; i < digest.length; i++) {
    result |= digest.charCodeAt(i) ^ hmacHeader.charCodeAt(i);
  }
  return result === 0;
}

/**
 * OAuth: Build authorization URL
 */
export function getAuthUrl(shop: string, state: string): string {
  const redirectUri = `${APP_URL}/auth/callback`;
  return `https://${shop}/admin/oauth/authorize?client_id=${API_KEY}&scope=${SCOPES}&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
}

/**
 * OAuth: Exchange code for access token
 */
export async function exchangeCodeForToken(shop: string, code: string): Promise<{ accessToken: string; scope: string } | null> {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: API_KEY,
      client_secret: API_SECRET,
      code,
    }),
  });
  
  if (!response.ok) {
    console.error('Token exchange failed:', response.status, await response.text());
    return null;
  }
  const data = await response.json();
  // Shopify API returns snake_case, map to camelCase for our codebase
  return {
    accessToken: data.access_token,
    scope: data.scope,
  };
}

/**
 * Shopify Admin GraphQL API client
 */
export async function shopifyGraphQL(shop: string, accessToken: string, query: string, variables?: Record<string, unknown>) {
  const response = await fetch(`https://${shop}/admin/api/2026-04/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  return response.json();
}

/**
 * Shopify Admin REST API client
 */
export async function shopifyREST(shop: string, accessToken: string, path: string, options?: RequestInit) {
  const response = await fetch(`https://${shop}/admin/api/2026-04${path}`, {
    ...options,
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  return response.json();
}

/**
 * Authenticate admin request
 * For embedded Shopify apps, the shop domain is passed via ?shop= query param
 * We look up the session from our database using the shop domain
 */
export async function authenticateAdmin(request: Request) {
  // Get shop from query params
  const url = new URL(request.url);
  let shop = url.searchParams.get('shop');
  
  // Also check Referer header (Shopify passes shop in the iframe URL)
  if (!shop) {
    const referer = request.headers.get('referer');
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        shop = refererUrl.searchParams.get('shop');
      } catch {
        // Invalid referer, ignore
      }
    }
  }
  
  if (!shop) {
    throw new Response('Missing shop parameter', { status: 400 });
  }
  
  // Clean up shop domain
  const shopDomain = shop.replace(/https?:\/\//, '').split('/')[0];
  
  // Get session from database
  const session = await loadSessionFromDBByShop(shopDomain);
  if (!session) {
    throw new Response('Unauthorized - App not installed for this shop', { status: 401 });
  }
  
  return {
    session: {
      shop: session.shop,
      accessToken: session.accessToken,
    },
    admin: {
      graphql: (query: string, variables?: Record<string, unknown>) => 
        shopifyGraphQL(session.shop, session.accessToken, query, variables),
      rest: (path: string, options?: RequestInit) =>
        shopifyREST(session.shop, session.accessToken, path, options),
    },
  };
}

/**
 * Load session by shop domain
 */
async function loadSessionFromDBByShop(shop: string): Promise<{ shop: string; accessToken: string } | null> {
  try {
    const { getSupabaseAdmin } = await import('~/services/supabase.server');
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('shopify_sessions')
      .select('shop, access_token')
      .eq('shop', shop)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) return null;
    return { shop: data.shop, accessToken: data.access_token };
  } catch {
    return null;
  }
}

export const shopify = {
  getAuthUrl,
  exchangeCodeForToken,
  authenticateAdmin,
  verifyHmac,
  shopifyGraphQL,
  shopifyREST,
};

export { storeSessionInDB, loadSessionFromDB, deleteSessionFromDB };
export { API_KEY, API_SECRET, APP_URL, SCOPES };
