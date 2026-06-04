import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { useEffect } from 'react';
import { authenticateAdmin, getAuthUrl, API_KEY } from '~/shopify.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');

  try {
    const { session } = await authenticateAdmin(request);
    return json({ shop: session.shop, status: 'ok', apiKey: API_KEY, oauthUrl: null });
  } catch {
    if (shop) {
      const shopDomain = shop.replace(/https?:\/\//, '').split('/')[0];
      const state = crypto.randomUUID();
      const oauthUrl = getAuthUrl(shopDomain, state);
      return json({ shop: null, status: 'auth_required', apiKey: API_KEY, oauthUrl });
    }
    return json({ shop: null, status: 'unauthenticated', apiKey: API_KEY, oauthUrl: null });
  }
}

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();

  useEffect(() => {
    if (data.status !== 'auth_required' || !data.oauthUrl) return;

    // For Shopify embedded apps, we must redirect the PARENT window
    // (Shopify admin) to the OAuth URL. We cannot redirect the iframe itself.
    //
    // Strategy: Load @shopify/app-bridge from CDN, use its Redirect action
    // which communicates with the parent Shopify admin to navigate top-level.
    // Fallback: window.top.location.href
    const loadAppBridge = () => {
      return new Promise<void>((resolve) => {
        // Check if already loaded
        if ((window as any).shopify?.appBridge) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@shopify/app-bridge@4/umd/index.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => resolve(); // Don't block on failure
        document.head.appendChild(script);
      });
    };

    const doRedirect = async () => {
      await loadAppBridge();
      try {
        const shopify = (window as any).shopify;
        if (shopify?.appBridge?.createApp && data.apiKey) {
          const shopFromUrl = new URLSearchParams(window.location.search).get('shop') || '';
          const app = shopify.appBridge.createApp({
            apiKey: data.apiKey,
            shopOrigin: shopFromUrl,
          });
          const redirect = shopify.actions?.Redirect;
          if (redirect) {
            redirect.create(app).dispatch(redirect.Action.REMOTE, data.oauthUrl!);
            return;
          }
        }
      } catch (e) {
        console.error('App Bridge redirect failed, falling back:', e);
      }
      // Fallback
      if (window.top && window.top !== window) {
        window.top.location.href = data.oauthUrl!;
      } else {
        window.location.href = data.oauthUrl!;
      }
    };

    doRedirect();
  }, [data.status, data.oauthUrl, data.apiKey]);

  if (data.status === 'auth_required') {
    return (
      <div className="page">
        <h1>Authenticating...</h1>
        <p>Redirecting to Shopify authorization...</p>
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
