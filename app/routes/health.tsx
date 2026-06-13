import { json } from '@remix-run/node';

/**
 * /health — Health check endpoint (resource route).
 *
 * Returns JSON-only status. Used by uptime monitors / Vercel deployment
 * checks / external probes. NO default export so Remix won't render this
 * through the root layout (which would emit a full HTML document and break
 * programmatic JSON consumers — same lesson as /api/diagnostics).
 *
 * NEVER exposes any environment values — only presence-as-boolean.
 */
export async function loader() {
  const isHealthy = !!(process.env.SHOPIFY_API_KEY && process.env.SHOPIFY_API_SECRET && process.env.SUPABASE_URL);
  return json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
  });
}

// NO default export — pure JSON resource route.
// See https://remix.run/docs/en/main/guides/resource-routes
