import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { authenticateAdmin, getAuthUrl } from '~/shopify.server';

/**
 * /app - Main app route (loaded in Shopify admin iframe)
 *
 * When no session exists (app not yet authorized), we show an "Authorize" button
 * that opens OAuth in a NEW TAB via <a target="_blank">.
 *
 * Why this approach:
 * - Shopify's iframe has sandbox="allow-popups allow-popups-to-escape-sandbox"
 * - target="_blank" on a user-clicked link always works (not blocked by popup blockers)
 * - No need to escape the iframe — OAuth happens in a separate tab
 * - After OAuth, the new tab redirects to Shopify admin with the app loaded
 * - The original iframe can then be refreshed and will find the valid session
 *
 * All previous approaches failed because:
 * - App Bridge CDN: wrong API namespace (window.shopify vs Shopify.AppBridge)
 * - dangerouslySetInnerHTML <script>: never executes (HTML spec)
 * - useEffect + form target="_top": blocked by iframe sandbox (no allow-top-navigation)
 * - window.top.location: blocked by cross-origin policy
 * - Server-side redirect to OAuth from iframe: blocked by X-Frame-Options
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');

  try {
    const { session } = await authenticateAdmin(request);
    return json({ shop: session.shop, status: 'ok' });
  } catch {
    if (shop) {
      const shopDomain = shop.replace(/https?:\/\//, '').split('/')[0];
      const state = crypto.randomUUID();
      const oauthUrl = getAuthUrl(shopDomain, state);
      return json({ shop: null, status: 'need_auth', shopDomain, oauthUrl });
    }
    return json({ shop: null, status: 'unauthenticated' });
  }
}

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();

  if (data.status === 'need_auth') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '40px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
      }}>
        <div style={{
          maxWidth: '460px',
          padding: '48px 40px',
          borderRadius: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          background: '#fff',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: '#1a1a1a' }}>
            Welcome to Haimo AI Lister
          </h1>
          <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.6, marginBottom: '32px' }}>
            To get started, you need to authorize the app to access your Shopify store.
            Click the button below to continue.
          </p>
          <a
            href={data.oauthUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '14px 36px',
              fontSize: '16px',
              fontWeight: 600,
              color: '#fff',
              background: '#008060',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
          >
            Authorize App
          </a>
          <p style={{ fontSize: '13px', color: '#999', marginTop: '24px', lineHeight: 1.5 }}>
            After authorization, come back to this page and refresh.
          </p>
        </div>
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
