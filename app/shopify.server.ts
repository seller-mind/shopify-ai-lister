/**
 * Shopify App 配置 - 轻量版，使用 fetch 直接调用 Shopify API
 * 不依赖 @shopify/shopify-api SDK，减少部署体积和依赖冲突
 */
import { storeSessionInDB, loadSessionFromDB, deleteSessionFromDB } from '~/services/supabase.server';

// Config from env
const API_KEY = process.env.SHOPIFY_API_KEY!;
const API_SECRET = process.env.SHOPIFY_API_SECRET!;
const APP_URL = process.env.SHOPIFY_APP_URL!;
// SCOPES — MUST match shopify.app.toml. write_themes implies read_themes,
// so we don't list read_themes separately. If env is missing, fall back to
// the toml-declared set (defensive — env should be set on Vercel).
const SCOPES = process.env.SCOPES || 'read_products,read_orders,read_fulfillments,write_themes';

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
 * Verify and decode a Shopify session token (JWT)
 * Returns the payload if signature is valid AND not expired AND audience matches our API_KEY,
 * otherwise null. Caller must still validate `dest` field as the shop domain.
 *
 * Spec: https://shopify.dev/docs/apps/auth/session-tokens
 *  - alg: HS256
 *  - signed with API_SECRET
 *  - aud === API_KEY
 *  - dest === https://{shop}.myshopify.com (shop)
 *  - exp >= now
 */
async function verifySessionToken(token: string): Promise<Record<string, any> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;

    // Base64URL decode
    const b64urlToString = (s: string) => {
      const pad = '='.repeat((4 - (s.length % 4)) % 4);
      const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
      // atob is available in Node 18+ globals
      return atob(b64);
    };
    const b64urlToBytes = (s: string) => {
      const str = b64urlToString(s);
      const bytes = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
      return bytes;
    };

    const header = JSON.parse(b64urlToString(headerB64));
    if (header.alg !== 'HS256') return null;

    // Verify signature with API_SECRET
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(API_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const signingInput = encoder.encode(`${headerB64}.${payloadB64}`);
    const signatureBytes = b64urlToBytes(sigB64);
    const valid = await crypto.subtle.verify('HMAC', key, signatureBytes, signingInput);
    if (!valid) return null;

    const payload = JSON.parse(b64urlToString(payloadB64));

    // Validate exp (with 5s clock skew)
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === 'number' && payload.exp + 5 < now) return null;
    if (typeof payload.nbf === 'number' && payload.nbf - 5 > now) return null;

    // Validate audience
    if (payload.aud && payload.aud !== API_KEY) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract shop domain from a verified session token's `dest` field.
 * `dest` looks like "https://{shop}.myshopify.com"
 */
function shopFromDest(dest: unknown): string | null {
  if (typeof dest !== 'string') return null;
  try {
    const u = new URL(dest);
    const host = u.hostname.toLowerCase();
    if (!host.endsWith('.myshopify.com')) return null;
    return host;
  } catch {
    return null;
  }
}

/**
 * Multi-source shop resolution for authenticateAdmin.
 * Resolution order (per 2026-06-11 architecture rule for embedded apps):
 *   1. Verified Shopify session token (JWT) — Authorization: Bearer <token> or ?id_token=
 *      → extract shop from `dest` field. This is the strongest signal because it's signed.
 *   2. Query string ?shop= (initial iframe URL)
 *   3. Referer header ?shop= (subsequent navigations from Admin)
 *   4. Cookie `wismo_shop` (last-resort sticky fallback)
 *
 * Returns: { shop, source } or null if none worked.
 */
async function resolveShop(request: Request): Promise<{ shop: string; source: string } | null> {
  // 1. Session token (JWT) — strongest, cryptographically verified
  let token: string | null = null;
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }
  const url = new URL(request.url);
  if (!token) {
    token = url.searchParams.get('id_token');
  }
  if (token) {
    const payload = await verifySessionToken(token);
    if (payload) {
      const shop = shopFromDest(payload.dest);
      if (shop) return { shop, source: 'session-token' };
    }
  }

  // 2. Query string
  const queryShop = url.searchParams.get('shop');
  if (queryShop) {
    const cleaned = queryShop.replace(/https?:\/\//, '').split('/')[0].toLowerCase();
    if (cleaned.endsWith('.myshopify.com')) {
      return { shop: cleaned, source: 'query' };
    }
  }

  // 3. Referer
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refShop = refererUrl.searchParams.get('shop');
      if (refShop) {
        const cleaned = refShop.replace(/https?:\/\//, '').split('/')[0].toLowerCase();
        if (cleaned.endsWith('.myshopify.com')) {
          return { shop: cleaned, source: 'referer' };
        }
      }
    } catch {
      /* invalid referer — ignore */
    }
  }

  // 4. Cookie fallback (sticky shop hint, set by /auth/callback)
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)wismo_shop=([^;]+)/);
  if (match) {
    try {
      const cookieShop = decodeURIComponent(match[1]).toLowerCase();
      if (cookieShop.endsWith('.myshopify.com')) {
        return { shop: cookieShop, source: 'cookie' };
      }
    } catch {
      /* malformed cookie — ignore */
    }
  }

  return null;
}

/**
 * Authenticate admin request for embedded Shopify apps.
 * Uses 4-tier shop resolution: session token (JWT) → query → referer → cookie.
 * Then loads access token from the Supabase session store keyed by shop.
 */
export async function authenticateAdmin(request: Request) {
  const resolved = await resolveShop(request);
  if (!resolved) {
    throw new Response('Missing shop parameter', { status: 400 });
  }
  const shopDomain = resolved.shop;

  // Get session (access token) from database
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
    _meta: { shopSource: resolved.source },
  };
}

/**
 * Build Set-Cookie header value for the sticky shop cookie.
 * CHIPS-compliant: SameSite=None; Secure; Partitioned for cross-site iframes.
 */
export function buildShopCookie(shop: string, maxAgeSec = 60 * 60 * 24 * 30): string {
  // Partitioned (CHIPS) is required by Chrome 118+ for cookies set inside cross-site iframes.
  return [
    `wismo_shop=${encodeURIComponent(shop)}`,
    'Path=/',
    `Max-Age=${maxAgeSec}`,
    'HttpOnly',
    'Secure',
    'SameSite=None',
    'Partitioned',
  ].join('; ');
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
