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
 * 2. No session (need OAuth) → escape iframe then redirect to OAuth
 * 
 * The OAuth redirect MUST happen at the top level (not in the iframe),
 * because Shopify's OAuth page blocks iframe embedding (X-Frame-Options: DENY).
 * 
 * When embedded=1, we use Shopify App Bridge CDN to escape the iframe
 * by redirecting the top-level window to /auth?shop=xxx (without embedded=1).
 * The /auth route then does a normal server-side 3xx redirect to Shopify OAuth.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');
  const host = url.searchParams.get('host');
  const embedded = url.searchParams.get('embedded');

  try {
    const { session } = await authenticateAdmin(request);
    return json({ shop: session.shop, status: 'ok' });
  } catch {
    if (shop) {
      // Need OAuth - check if we're in an iframe or top-level
      const shopDomain = shop.replace(/https?:\/\//, '').split('/')[0];
      
      if (embedded === '1') {
        // We're in an iframe - need to escape it first using App Bridge
        // The exit-iframe pattern: redirect top-level window to /auth (without embedded=1)
        // Then /auth will do a server-side 3xx redirect to Shopify OAuth
        const redirectUri = `${process.env.SHOPIFY_APP_URL}/auth?shop=${encodeURIComponent(shopDomain)}`;
        return json({
          shop: null,
          status: 'exit_iframe',
          apiKey: API_KEY,
          host: host || btoa(shopDomain),
          shopDomain,
          redirectUri,
        });
      }
      
      // Top-level window (not in iframe) - redirect directly to OAuth
      const state = crypto.randomUUID();
      const oauthUrl = getAuthUrl(shopDomain, state);
      return json({ shop: null, status: 'auth_required', oauthUrl });
    }
    return json({ shop: null, status: 'unauthenticated' });
  }
}

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();

  if (data.status === 'exit_iframe') {
    // We're in an iframe - use Shopify App Bridge CDN to escape it
    // This renders a page that:
    // 1. Loads the official Shopify App Bridge from CDN
    // 2. Uses Redirect.Action.REMOTE to navigate the top-level window to /auth
    // This breaks us out of the iframe, then /auth redirects to OAuth
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
        {/* App Bridge requires this meta tag for auto-initialization */}
        <meta name="shopify-api-key" content={data.apiKey} />
        
        <h2>Authenticating...</h2>
        <p>Redirecting to Shopify for authorization...</p>
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var redirectUri = ${JSON.stringify(data.redirectUri)};
                var apiKey = ${JSON.stringify(data.apiKey)};
                var host = ${JSON.stringify(data.host)};
                var shopOrigin = ${JSON.stringify(data.shopDomain)};
                
                // Load the official Shopify App Bridge CDN
                var script = document.createElement('script');
                script.src = 'https://cdn.shopify.com/shopifycloud/app-bridge.js';
                script.onload = function() {
                  try {
                    // App Bridge CDN exposes createApp on the shopify global
                    // Reference: https://shopify.dev/docs/api/app-bridge-library
                    var app = window.shopify.createApp({
                      apiKey: apiKey,
                      host: host,
                      shopOrigin: shopOrigin,
                      forceRedirect: false
                    });
                    
                    // Use Redirect.REMOTE to navigate the top-level window
                    // This is the official way to escape an iframe in Shopify
                    var redirect = window.shopify.actions.Redirect;
                    redirect.create(app).dispatch(redirect.Action.REMOTE, redirectUri);
                  } catch(e) {
                    console.error('[App Bridge] Error:', e);
                    // Last resort fallback: try parent frame navigation
                    try { window.top.location.href = redirectUri; } catch(e2) {
                      console.error('[App Bridge] Fallback also failed:', e2);
                    }
                  }
                };
                script.onerror = function() {
                  console.error('[App Bridge] CDN load failed');
                  // CDN failed - try direct navigation (will likely fail in cross-origin iframe)
                  try { window.top.location.href = redirectUri; } catch(e) {
                    console.error('[App Bridge] Direct navigation failed:', e);
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

  if (data.status === 'auth_required' && data.oauthUrl) {
    // Top-level window - redirect directly to OAuth
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h2>Authenticating...</h2>
        <p>Redirecting to Shopify for authorization...</p>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.location.href = ${JSON.stringify(data.oauthUrl)};
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
