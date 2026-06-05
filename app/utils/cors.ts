/**
 * CORS utility for API endpoints
 * Allows Shopify storefronts to call our API
 */

export function addCorsHeaders(headers: Headers, request: Request): Headers {
  const origin = request.headers.get('Origin') || '';
  
  // Allow any Shopify store domain and our own domain
  // Only match valid *.myshopify.com origins (prevents subdomain bypass)
  const isShopifyStore = /^https:\/\/[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(origin) || 
                         origin === 'https://shopify-ai-lister-tau.vercel.app';
  
  if (isShopifyStore) {
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
