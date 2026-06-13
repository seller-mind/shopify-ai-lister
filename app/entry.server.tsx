import { RemixServer } from '@remix-run/react';
import { handleRequest } from '@vercel/remix';
import type { EntryContext } from '@remix-run/node';

/**
 * Security headers applied to ALL responses.
 * - X-Content-Type-Options: prevents MIME sniffing
 * - Referrer-Policy: limits referrer leakage
 * - Permissions-Policy: disables unused browser features
 * - Content-Security-Policy: restricts resource loading + iframe embedding (Shopify admin)
 *
 * IMPORTANT — Shopify embedded apps:
 *   We MUST NOT set X-Frame-Options here. Shopify embeds this app inside
 *   admin.shopify.com via iframe, so X-Frame-Options: SAMEORIGIN/DENY would
 *   break embedding (browser shows blank/refused). The modern replacement is
 *   the CSP `frame-ancestors` directive below, which is the official Shopify
 *   recommendation: allow https://admin.shopify.com and https://*.myshopify.com.
 *   See: https://shopify.dev/docs/apps/store/security/iframe-protection
 */
function addSecurityHeaders(headers: Headers): Headers {
  headers.set('X-Content-Type-Options', 'nosniff');
  // Defensive: in case any upstream/middleware injects X-Frame-Options, drop it.
  headers.delete('X-Frame-Options');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // CSP allows Shopify admin embedding, our own domain, and necessary CDNs.
  // frame-ancestors below is the modern, Shopify-blessed clickjacking guard
  // (replaces X-Frame-Options for embedded apps).
  headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    // App Bridge script lives at https://cdn.shopify.com/shopifycloud/app-bridge.js
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.shopify.com; " +
    "style-src 'self' 'unsafe-inline' https://cdn.shopify.com; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https://cdn.shopify.com; " +
    // App Bridge / Admin / Storefront API + DeepSeek + Supabase. admin.shopify.com
    // covers App Bridge token-exchange XHRs on modern Admin (2025+).
    "connect-src 'self' https://*.myshopify.com https://admin.shopify.com https://api.deepseek.com https://*.supabase.co; " +
    "frame-ancestors https://admin.shopify.com https://*.myshopify.com; " +
    "form-action 'self' https://*.myshopify.com; " +
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
