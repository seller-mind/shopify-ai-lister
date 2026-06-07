import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  useLocation,
} from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import globalStyles from '~/styles/global.css?url';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const isShopifyRequest = url.searchParams.has('shop') || 
      url.pathname.startsWith('/auth') || 
      url.pathname.startsWith('/webhooks') ||
      url.pathname.startsWith('/api/');

    if (!isShopifyRequest) {
      const country = request.headers.get('x-vercel-ip-country') || '';
      if (country === 'CN') {
        throw new Response('This service is not available in your region.', {
          status: 451,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    }

    return json({});
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error('[root.tsx] Loader error:', error);
    return json({});
  }
}

export function links() {
  return [{ rel: 'stylesheet', href: globalStyles }];
}

const NAV_ITEMS = [
  { href: '/app', label: 'Dashboard', icon: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>' },
  { href: '/app/settings', label: 'Settings', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>' },
  { href: '/app/billing', label: 'Plans', icon: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>' },
];

export default function App() {
  const location = useLocation();
  const currentPath = location.pathname;
  // Preserve shop parameter across navigation so authenticateAdmin always works
  const shopParam = new URLSearchParams(location.search).get('shop');
  const shopQuery = shopParam ? `?shop=${encodeURIComponent(shopParam)}` : '';

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>WISMO AI</title>
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='32' height='32' rx='8' fill='%23008060'/%3E%3Cpath d='M8 20V14C8 10.6863 10.6863 8 14 8H18C21.3137 8 24 10.6863 24 14V20' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3Ccircle cx='10' cy='22' r='2' fill='white'/%3E%3Ccircle cx='22' cy='22' r='2' fill='white'/%3E%3C/svg%3E" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="app-layout">
          <nav className="sidebar">
            <div className="logo">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#008060"/>
                <path d="M8 20V14C8 10.6863 10.6863 8 14 8H18C21.3137 8 24 10.6863 24 14V20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="10" cy="22" r="2" fill="white"/>
                <circle cx="22" cy="22" r="2" fill="white"/>
              </svg>
              WISMO AI
            </div>
            {NAV_ITEMS.map(item => (
              <a
                key={item.href}
                href={`${item.href}${shopQuery}`}
                className={`nav-item ${currentPath === item.href || (item.href === '/app' && currentPath === '/app') ? 'active' : ''}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: item.icon }} />
                {item.label}
              </a>
            ))}
          </nav>
          <main className="content">
            <Outlet />
          </main>
        </div>
        <div className="footer-note">
          WISMO AI — AI-powered order tracking for Shopify stores · <a href="/privacy" style={{ color: '#888' }}>Privacy</a> · <a href="/terms" style={{ color: '#888' }}>Terms</a> · <a href="/dmca" style={{ color: '#888' }}>DMCA</a>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const errorMessage = error instanceof Error ? error.message : 
    (error && typeof error === 'object' && 'statusText' in error) ? (error as any).statusText :
    (error && typeof error === 'object' && 'data' in error) ? String((error as any).data) :
    'Unknown error';
  const errorStatus = (error && typeof error === 'object' && 'status' in error) ? (error as any).status : '';
  
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error - WISMO AI</title>
      </head>
      <body style={{ fontFamily: 'system-ui', background: '#f6f6f7' }}>
        <div style={{ maxWidth: '480px', margin: '80px auto', padding: '40px', background: '#fff', borderRadius: '14px', border: '1px solid #e1e3e5', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#1c1c1e' }}>Something went wrong</h1>
          {errorStatus && <p style={{ fontSize: '13px', color: '#6d7175', marginBottom: '8px' }}>Status: {errorStatus}</p>}
          <p style={{ fontSize: '14px', color: '#6d7175', lineHeight: 1.5 }}>{errorMessage}</p>
          <a href="/app" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 24px', background: '#008060', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>Back to Dashboard</a>
        </div>
      </body>
    </html>
  );
}
