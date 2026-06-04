import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { authenticateAdmin } from '~/shopify.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');

  try {
    const { session } = await authenticateAdmin(request);
    return json({ shop: session.shop, status: 'ok' });
  } catch {
    // No valid session - return authRequired flag so the component
    // can use window.top to exit the iframe and start OAuth
    // (server-side redirect inside iframe causes "refused to connect")
    if (shop) {
      return json({ shop: null, status: 'auth_required', authShop: shop });
    }
    return json({ shop: null, status: 'unauthenticated' });
  }
}

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();
  
  // If we need to start OAuth from inside a Shopify iframe,
  // we must redirect the TOP-LEVEL window (not the iframe)
  // otherwise Shopify's OAuth page refuses iframe embedding
  if (data.status === 'auth_required' && data.authShop) {
    const authUrl = `/auth?shop=${encodeURIComponent(data.authShop)}`;
    if (typeof window !== 'undefined' && window.top) {
      window.top.location.href = authUrl;
    }
    return (
      <div className="page">
        <h1>Authenticating...</h1>
        <p>Redirecting to Shopify authorization. If nothing happens, <a href={authUrl} target="_top">click here</a>.</p>
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
