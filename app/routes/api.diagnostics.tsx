import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';

/**
 * /api/diagnostics
 *
 * Lightweight, NON-SECRET diagnostics endpoint to verify Vercel environment
 * config matches the Shopify Partners Dashboard / shopify.app.toml.
 *
 * IMPORTANT: This endpoint never returns secrets (API_SECRET, Supabase keys,
 * DeepSeek key). It only returns:
 *   - whether each required env is *present* (boolean)
 *   - first 8 chars of API_KEY (public anyway — used in OAuth URL)
 *   - the configured SHOPIFY_APP_URL (public — referenced by Partners Dashboard)
 *   - the actual host the request hit (so we can compare with APP_URL)
 *   - the redirect_uri that *would* be sent to Shopify in OAuth
 *   - SCOPES value (public — listed in Partners Dashboard)
 *
 * Auth: optional ?token= can be set via DIAG_TOKEN env to gate access.
 * If DIAG_TOKEN is not set, the endpoint is open (since no secrets leak).
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Optional access gate
  const diagToken = process.env.DIAG_TOKEN;
  if (diagToken) {
    const url = new URL(request.url);
    const provided = url.searchParams.get('token') || request.headers.get('x-diag-token') || '';
    if (provided !== diagToken) {
      return json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const apiKey = process.env.SHOPIFY_API_KEY || '';
  const appUrl = process.env.SHOPIFY_APP_URL || '';
  const scopes = process.env.SCOPES || '';

  // Compute actual public host the request hit (to compare with SHOPIFY_APP_URL)
  const url = new URL(request.url);
  const requestHost = url.host;
  const requestOrigin = `${url.protocol}//${url.host}`;
  const xForwardedHost = request.headers.get('x-forwarded-host') || null;
  const xForwardedProto = request.headers.get('x-forwarded-proto') || null;

  const expectedRedirectUri = `${appUrl || requestOrigin}/auth/callback`;
  const actualRedirectUri = `${requestOrigin}/auth/callback`;
  const redirectUriMatchesAppUrl = expectedRedirectUri === actualRedirectUri;

  // Required envs (presence-only, no values)
  const envs = {
    SHOPIFY_API_KEY: !!process.env.SHOPIFY_API_KEY,
    SHOPIFY_API_SECRET: !!process.env.SHOPIFY_API_SECRET,
    SHOPIFY_APP_URL: !!process.env.SHOPIFY_APP_URL,
    SCOPES: !!process.env.SCOPES,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    DEEPSEEK_API_KEY: !!process.env.DEEPSEEK_API_KEY,
  };

  // Hostname sanity check — APP_URL should match the actually-deployed host
  const appUrlHost = (() => {
    try {
      return new URL(appUrl).host;
    } catch {
      return null;
    }
  })();
  const hostMatchesAppUrl = appUrlHost ? appUrlHost === requestHost : false;

  // Critical issues that can cause "Authorize App → 404":
  //   - SHOPIFY_APP_URL missing or differs from actual host
  //     → redirect_uri sent to Shopify won't match toml allowlist → Shopify rejects OAuth
  const criticalIssues: string[] = [];
  if (!envs.SHOPIFY_API_KEY) criticalIssues.push('SHOPIFY_API_KEY env not set');
  if (!envs.SHOPIFY_API_SECRET) criticalIssues.push('SHOPIFY_API_SECRET env not set');
  if (!envs.SHOPIFY_APP_URL) criticalIssues.push('SHOPIFY_APP_URL env not set — redirect_uri will fall back to request host');
  if (envs.SHOPIFY_APP_URL && !hostMatchesAppUrl) {
    criticalIssues.push(
      `SHOPIFY_APP_URL host (${appUrlHost}) does not match deployed host (${requestHost}). ` +
      `redirect_uri sent to Shopify OAuth will NOT match shopify.app.toml allowlist → OAuth will fail with a 404-like error.`,
    );
  }
  if (!envs.SUPABASE_URL || !envs.SUPABASE_SERVICE_ROLE_KEY) {
    criticalIssues.push('Supabase env not set — sessions cannot be persisted, OAuth callback will fail');
  }

  return json({
    status: criticalIssues.length === 0 ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    deploy: {
      requestHost,
      requestOrigin,
      xForwardedHost,
      xForwardedProto,
    },
    shopify: {
      apiKeyPrefix: apiKey ? apiKey.slice(0, 8) + '...' : null,
      appUrl: appUrl || null,
      appUrlHost,
      hostMatchesAppUrl,
      scopes: scopes || null,
      expectedRedirectUri,
      actualRedirectUri,
      redirectUriMatchesAppUrl,
    },
    env: envs,
    criticalIssues,
    notes: {
      reviewerInstructions: 'Compare expectedRedirectUri with shopify.app.toml [auth].redirect_urls — they MUST match exactly.',
      whatTo404Means: 'If hostMatchesAppUrl=false, Shopify will return a 404-like error when the merchant clicks Authorize.',
    },
  });
}

// NO default export: this is a Remix "resource route" that returns raw JSON.
// Adding a default component caused the route to be rendered through the root
// layout (full HTML doc with __remixContext hydration) instead of plain JSON,
// which broke programmatic health-check consumers.
// See https://remix.run/docs/en/main/guides/resource-routes
