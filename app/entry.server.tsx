import { RemixServer } from '@remix-run/react';
import { handleRequest } from '@vercel/remix';
import type { EntryContext } from '@remix-run/node';

/**
 * Security headers applied to ALL responses.
 * - X-Content-Type-Options: prevents MIME sniffing
 * - X-Frame-Options: prevents clickjacking (Shopify apps are embedded via App Bridge, not iframes directly)
 * - Referrer-Policy: limits referrer leakage
 * - Permissions-Policy: disables unused browser features
 * - Content-Security-Policy: restricts resource loading (Shopify admin + storefront compat)
 */
function addSecurityHeaders(headers: Headers): Headers {
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // CSP allows Shopify admin embedding, our own domain, and necessary CDNs
  headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.shopify.com; " +
    "style-src 'self' 'unsafe-inline' https://cdn.shopify.com; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https://cdn.shopify.com; " +
    "connect-src 'self' https://*.myshopify.com https://api.deepseek.com https://*.supabase.co; " +
    "frame-ancestors 'self' https://admin.shopify.com https://*.myshopify.com; " +
    "form-action 'self'; " +
    "base-uri 'self';"
  );
  return headers;
}

export default async function (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  // Apply security headers to every response
  addSecurityHeaders(responseHeaders);

  try {
    const remixServer = <RemixServer context={remixContext} url={request.url} />;
    return await handleRequest(
      request,
      responseStatusCode,
      responseHeaders,
      remixServer,
    );
  } catch (error) {
    console.error('[entry.server] Render error:', error);
    const headers = new Headers({ 'Content-Type': 'text/plain' });
    addSecurityHeaders(headers);
    return new Response(`Internal Server Error`, {
      status: 500,
      headers,
    });
  }
}
