import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { authenticateAdmin, getAuthUrl, API_KEY } from '~/shopify.server';

/**
 * /app - Main app route (loaded in Shopify admin iframe)
 * 
 * This route is loaded in the Shopify admin iframe after installation.
 * It handles two cases:
 * 1. Has valid session → render the dashboard
 * 2. No session (need OAuth) → redirect top-level window to OAuth
 * 
 * The OAuth redirect MUST happen at the top level (not in the iframe),
 * because Shopify's OAuth page blocks iframe embedding.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');

  try {
    const { session } = await authenticateAdmin(request);
    return json({ shop: session.shop, status: 'ok' });
  } catch {
    if (shop) {
      // Need OAuth - build the OAuth URL and return it to the client
      // The client-side code will redirect the TOP-LEVEL window
      const shopDomain = shop.replace(/https?:\/\//, '').split('/')[0];
      const state = crypto.randomUUID();
      const oauthUrl = getAuthUrl(shopDomain, state);
      return json({ shop: null, status: 'auth_required', apiKey: API_KEY, oauthUrl });
    }
    return json({ shop: null, status: 'unauthenticated' });
  }
}

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();

  if (data.status === 'auth_required' && data.oauthUrl) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h2>Authenticating...</h2>
        <p>Redirecting to Shopify for authorization...</p>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var oauthUrl = ${JSON.stringify(data.oauthUrl)};
                
                // Detect if we're in an iframe
                var inIframe = (window.self !== window.top);
                
                if (!inIframe) {
                  // Top-level window: direct redirect (installation flow)
                  window.location.href = oauthUrl;
                  return;
                }
                
                // In iframe: MUST redirect the top-level window
                // Try Shopify App Bridge first (official way)
                var script = document.createElement('script');
                script.src = 'https://unpkg.com/@shopify/app-bridge@4/umd/index.js';
                script.onload = function() {
                  try {
                    var shopify = window.shopify;
                    if (shopify && shopify.appBridge && shopify.actions) {
                      var searchParams = new URLSearchParams(window.location.search);
                      var shop = searchParams.get('shop') || '';
                      var app = shopify.appBridge.createApp({
                        apiKey: ${JSON.stringify(data.apiKey)},
                        shopOrigin: shop
                      });
                      var redirect = shopify.actions.Redirect;
                      redirect.create(app).dispatch(redirect.Action.REMOTE, oauthUrl);
                      return;
                    }
                  } catch(e) {
                    console.error('App Bridge error:', e);
                  }
                  // Fallback: navigate top window
                  try { window.top.location.href = oauthUrl; } catch(e) {}
                };
                script.onerror = function() {
                  // CDN failed - direct fallback
                  try { window.top.location.href = oauthUrl; } catch(e) {}
                };
                document.head.appendChild(script);
              })();
            `,
          }}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Welcome to Haimo AI Lister</h1>
      {data.shop ? (
        <div className="card">
          <p>Connected store: <strong>{data.shop}</strong></p>
          <div className="quick-start">
            <h2>Quick Start</h2>
            <ol>
              <li>Enter Chinese product info</li>
              <li>AI generates optimized English listing</li>
              <li>Apply directly to your Shopify store</li>
            </ol>
          </div>
          <a href="/app/generate" className="btn btn-primary">Generate New Description</a>
        </div>
      ) : (
        <div className="card">
          <p>Please install the app from your Shopify admin.</p>
        </div>
      )}
    </div>
  );
}
