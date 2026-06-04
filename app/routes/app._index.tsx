import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { authenticateAdmin, getAuthUrl } from '~/shopify.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');

  try {
    const { session } = await authenticateAdmin(request);
    return json({ shop: session.shop, status: 'ok', oauthUrl: null });
  } catch {
    // No valid session - build the FULL Shopify OAuth URL and return it
    // so the client can redirect window.top directly to Shopify.
    // We can't do a server redirect because we're inside an iframe,
    // and we can't redirect to /auth first because that adds a hop
    // that may fail in the cross-origin iframe context.
    if (shop) {
      const shopDomain = shop.replace(/https?:\/\//, '').split('/')[0];
      const state = crypto.randomUUID();
      const oauthUrl = getAuthUrl(shopDomain, state);
      return json({ shop: null, status: 'auth_required', oauthUrl });
    }
    return json({ shop: null, status: 'unauthenticated', oauthUrl: null });
  }
}

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();
  
  if (data.status === 'auth_required' && data.oauthUrl) {
    return (
      <div className="page">
        <h1>Authenticating...</h1>
        <p>Redirecting to Shopify authorization...</p>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Must redirect the top-level window (not the iframe)
              // to Shopify's OAuth page. Using a form with target="_top"
              // is more reliable than window.top.location.href across
              // different browsers and cross-origin iframe contexts.
              (function() {
                var form = document.createElement('form');
                form.method = 'GET';
                form.action = ${JSON.stringify(data.oauthUrl)};
                form.target = '_top';
                document.body.appendChild(form);
                form.submit();
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
