import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { authenticateAdmin, getAuthUrl } from '~/shopify.server';

/**
 * /app - Main app route (loaded in Shopify admin iframe)
 * 
 * Handles three cases:
 * 1. Has valid session → render the dashboard
 * 2. No session + embedded in iframe → exit iframe, then redirect to OAuth
 * 3. No session + top-level window → redirect directly to OAuth
 * 
 * Exit iframe uses <form target="_top"> which is a standard HTML mechanism
 * that works from cross-origin iframes (unlike window.top.location access).
 * The form navigates the top-level window to /auth, which does a server-side
 * 3xx redirect to Shopify OAuth.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');
  const embedded = url.searchParams.get('embedded');

  try {
    const { session } = await authenticateAdmin(request);
    return json({ shop: session.shop, status: 'ok' });
  } catch {
    if (shop) {
      const shopDomain = shop.replace(/https?:\/\//, '').split('/')[0];
      
      if (embedded === '1') {
        // In iframe - need to escape it before redirecting to OAuth
        // form target="_top" will navigate the top-level window
        return json({
          shop: null,
          status: 'exit_iframe',
          shopDomain,
        });
      }
      
      // Top-level window - redirect directly to OAuth
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
    // Exit iframe using <form target="_top"> - the most reliable approach.
    // App Bridge CDN is fragile (API namespace changes, CDN loading failures).
    // HTML form target="_top" is a standard mechanism that always works from
    // cross-origin iframes. The browser navigates the top-level window to
    // the form's action URL, bypassing the iframe entirely.
    const authUrl = `/auth?shop=${encodeURIComponent(data.shopDomain)}`;
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h2>Authenticating...</h2>
        <p>Redirecting to Shopify for authorization...</p>
        <form id="exit-iframe-form" method="GET" action={authUrl} target="_top" />
        <script
          dangerouslySetInnerHTML={{
            __html: `document.getElementById('exit-iframe-form').submit();`,
          }}
        />
        <noscript>
          <p style={{ marginTop: '20px' }}>
            <button type="submit" form="exit-iframe-form" style={{ padding: '10px 24px', fontSize: '16px', cursor: 'pointer' }}>
              Click here to continue
            </button>
          </p>
        </noscript>
      </div>
    );
  }

  if (data.status === 'auth_required' && data.oauthUrl) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h2>Authenticating...</h2>
        <p>Redirecting to Shopify for authorization...</p>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.location.href = ${JSON.stringify(data.oauthUrl)};`,
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
