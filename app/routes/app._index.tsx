import { json, redirect } from '@remix-run/node';
import { useLoaderData, useRef, useEffect } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { authenticateAdmin, getAuthUrl } from '~/shopify.server';

/**
 * /app - Main app route (loaded in Shopify admin iframe)
 *
 * Three cases:
 * 1. Has valid session → render dashboard
 * 2. No session + embedded in iframe → exit iframe via <form target="_top"> + useEffect
 * 3. No session + top-level window → server-side redirect to OAuth
 *
 * Key insight: React's dangerouslySetInnerHTML does NOT execute <script> tags.
 * That's why all previous approaches (App Bridge CDN, inline JS, form auto-submit)
 * silently failed. useEffect runs as part of React's lifecycle and is guaranteed
 * to execute after the component mounts.
 *
 * <form target="_top"> navigates the top-level window even from cross-origin iframes.
 * This is standard HTML behavior - same-origin policy restricts *reading* the parent,
 * not *navigating* it via form submission.
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
        // In iframe - return JSON so client component can exit iframe
        return json({ shop: null, status: 'exit_iframe', shopDomain });
      }

      // Top-level window - server-side redirect directly to OAuth (no JS needed)
      const state = crypto.randomUUID();
      const oauthUrl = getAuthUrl(shopDomain, state);
      return redirect(oauthUrl);
    }
    return json({ shop: null, status: 'unauthenticated' });
  }
}

/**
 * ExitIframe component - escapes Shopify admin iframe using form submission.
 *
 * Uses useEffect (NOT dangerouslySetInnerHTML) to auto-submit the form after mount.
 * Falls back to a manual button if auto-submit fails for any reason.
 */
function ExitIframe({ shopDomain }: { shopDomain: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const authUrl = `/auth?shop=${encodeURIComponent(shopDomain)}`;

  useEffect(() => {
    // Auto-submit the form to navigate the top-level window out of the iframe.
    // This runs as part of React's lifecycle, guaranteed to execute.
    formRef.current?.submit();
  }, []);

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
      <h2>Authenticating...</h2>
      <p>Redirecting to Shopify for authorization...</p>
      <form ref={formRef} method="GET" action={authUrl} target="_top">
        <button
          type="submit"
          style={{
            padding: '10px 24px',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '20px',
            background: '#008060',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
          }}
        >
          Click here if not automatically redirected
        </button>
      </form>
    </div>
  );
}

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();

  if (data.status === 'exit_iframe') {
    return <ExitIframe shopDomain={data.shopDomain} />;
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
