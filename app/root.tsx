import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import globalStyles from '~/styles/global.css?url';

export async function loader({ request }: LoaderFunctionArgs) {
  // ─── Geo-block: China mainland (compliance) ───
  const country = request.headers.get('x-vercel-ip-country') || '';
  if (country === 'CN') {
    throw new Response('This service is not available in your region.', {
      status: 451,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return json({
    apiKey: process.env.SHOPIFY_API_KEY!,
  });
}

export function links() {
  return [{ rel: 'stylesheet', href: globalStyles }];
}

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="app-layout">
          <nav className="sidebar">
            <div className="logo">
              <span className="logo-icon">✨</span> Haimo AI Lister
            </div>
            <a href="/app" className="nav-item">📊 Dashboard</a>
            <a href="/app/generate" className="nav-item">🤖 AI Generate</a>
            <a href="/app/billing" className="nav-item">💳 Plans</a>
            <a href="/app/settings" className="nav-item">⚙️ Settings</a>
          </nav>
          <main className="content">
            <Outlet />
          </main>
        </div>
        <footer style={{ padding: '8px 16px', textAlign: 'center', fontSize: '11px', color: '#888', borderTop: '1px solid #e5e5e5' }}>
          🌐 Available for international users only. Not available in mainland China.
        </footer>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error - Haimo AI Lister</title>
      </head>
      <body>
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
          <h1 style={{ color: '#bf0711' }}>Something went wrong</h1>
          <p>Sorry, an error occurred.</p>
          <a href="/app">Back to Home</a>
        </div>
      </body>
    </html>
  );
}
