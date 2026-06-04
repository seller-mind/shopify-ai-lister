import { json, redirect } from '@remix-run/node';
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
    // No valid session - redirect to OAuth if we have a shop param
    if (shop) {
      return redirect(`/auth?shop=${encodeURIComponent(shop)}`);
    }
    return json({ shop: null, status: 'unauthenticated' });
  }
}

export default function Dashboard() {
  const { shop, status } = useLoaderData<typeof loader>();
  
  return (
    <div className="page">
      <h1>Welcome to Haimo AI Lister</h1>
      {shop ? (
        <div className="card">
          <p>Connected store: <strong>{shop}</strong></p>
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
