import { json, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { authenticateAdmin, getAuthUrl, API_KEY } from '~/shopify.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');

  try {
    const { session } = await authenticateAdmin(request);
    return json({ shop: session.shop, status: 'ok' });
  } catch {
    if (shop) {
      // If we're in an iframe (Shopify admin) and need OAuth,
      // we MUST redirect via Shopify App Bridge.
      // Build the OAuth URL and return it to the client.
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
      <div className="page">
        <h1>Authenticating...</h1>
        <p>Redirecting to Shopify for authorization...</p>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Shopify App Bridge: the official way to redirect from within an iframe.
                // Load the CDN script, initialize, and use Redirect action.
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
                      redirect.create(app).dispatch(redirect.Action.REMOTE, ${JSON.stringify(data.oauthUrl)});
                      return;
                    }
                  } catch(e) {
                    console.error('App Bridge error:', e);
                  }
                  // Fallback: navigate top window directly
                  if (window.top) {
                    window.top.location.href = ${JSON.stringify(data.oauthUrl)};
                  }
                };
                script.onerror = function() {
                  // CDN failed - fallback
                  if (window.top) {
                    window.top.location.href = ${JSON.stringify(data.oauthUrl)};
                  }
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
