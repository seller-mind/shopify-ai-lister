/**
 * CORS utility for API endpoints
 * Allows Shopify storefronts to call our API
 * 
 * Must allow any HTTPS origin because Shopify stores use custom domains
 * (e.g., https://www.mystore.com) — restricting to *.myshopify.com would
 * break the widget on the vast majority of real stores.
 * 
 * Security is enforced at the application layer:
 * - Shop domain validation (regex + DB lookup)
 * - Rate limiting per shop
 * - No cookie-based auth on public API endpoints
 */

export function addCorsHeaders(headers: Headers, request: Request): Headers {
  const origin = request.headers.get('Origin') || '';
  
  // Allow any HTTPS origin (Shopify stores use custom domains)
  // Also allow our own domain for development/admin
  if (origin.startsWith('https://')) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    headers.set('Access-Control-Max-Age', '86400');
  }
  
  return headers;
}

export function handleCorsPreflightRequest(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    const headers = new Headers();
    addCorsHeaders(headers, request);
    return new Response(null, { status: 204, headers });
  }
  return null;
}
