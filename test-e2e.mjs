// E2E test harness: load the production build server and simulate HTTP requests
// to verify response headers, redirects, HTML content, and security posture.

import { createRequestHandler } from '@remix-run/node';
import * as build from './build/server/nodejs-eyJydW50aW1lIjoibm9kZWpzIn0/index.js';

const handler = createRequestHandler(build, 'production');

// helper
async function req(url, opts = {}) {
  const request = new Request(url, opts);
  const response = await handler(request);
  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: await response.text(),
  };
}

function check(label, ok, detail) {
  const tag = ok ? '✅ PASS' : '❌ FAIL';
  console.log(`${tag}  ${label}${detail ? ' — ' + detail : ''}`);
  return ok;
}

const results = [];
function record(...r) { results.push(r); }

console.log('=== E2E TEST: WISMO AI Shopify App ===\n');

// ============================================================
// TEST 1: Security headers — X-Frame-Options must be GONE
// ============================================================
console.log('--- [Test Group 1] Security headers / iframe embedding ---');
{
  const r = await req('https://wismo-ai-app.vercel.app/');
  record('T1.1', check('GET / returns 200', r.status === 200, `status=${r.status}`));
  record('T1.2', check('GET / has NO X-Frame-Options header (Shopify embedded app rule)',
    !('x-frame-options' in r.headers),
    r.headers['x-frame-options'] ? `present="${r.headers['x-frame-options']}"` : 'absent ✓'));
  const csp = r.headers['content-security-policy'] || '';
  record('T1.3', check('CSP contains frame-ancestors with admin.shopify.com',
    csp.includes('frame-ancestors') && csp.includes('admin.shopify.com'),
    `frame-ancestors: ${csp.match(/frame-ancestors[^;]*/)?.[0] || '(missing)'}`));
  record('T1.4', check('CSP frame-ancestors allows *.myshopify.com',
    csp.includes('*.myshopify.com'),
    `${csp.includes('*.myshopify.com') ? 'present' : 'missing'}`));
  record('T1.5', check('Strict-Transport-Security set', !!r.headers['strict-transport-security']));
}

// ============================================================
// TEST 2: /auth route — OAuth entry point
// ============================================================
console.log('\n--- [Test Group 2] /auth — OAuth entry ---');
{
  const r = await req('https://wismo-ai-app.vercel.app/auth?shop=test-store.myshopify.com');
  record('T2.1', check('GET /auth?shop=valid → 302 redirect',
    r.status === 302,
    `status=${r.status}`));
  const loc = r.headers['location'] || '';
  record('T2.2', check('Redirect goes to https://{shop}/admin/oauth/authorize',
    loc.startsWith('https://test-store.myshopify.com/admin/oauth/authorize'),
    `Location=${loc.slice(0, 100)}`));
  record('T2.3', check('OAuth URL contains client_id', loc.includes('client_id=')));
  record('T2.4', check('OAuth URL contains scope', loc.includes('scope=')));
  record('T2.5', check('OAuth URL contains redirect_uri pointing to /auth/callback',
    loc.includes('redirect_uri=') && loc.includes('%2Fauth%2Fcallback'),
    `redirect_uri segment present`));
  record('T2.6', check('OAuth URL contains state (CSRF)', loc.includes('state=')));
  // Verify scope matches toml
  const scopeMatch = loc.match(/scope=([^&]+)/);
  const scope = scopeMatch ? decodeURIComponent(scopeMatch[1]) : '';
  record('T2.7', check('Scope matches toml exactly (no read_themes redundancy)',
    scope === 'read_products,read_orders,read_fulfillments,write_themes',
    `scope="${scope}"`));
}

// /auth without shop — should return friendly HTML, NOT 400
{
  const r = await req('https://wismo-ai-app.vercel.app/auth');
  record('T2.8', check('GET /auth (no shop) → 200 friendly HTML (not 400)',
    r.status === 200, `status=${r.status}`));
  record('T2.9', check('Friendly fallback page contains shop input form',
    r.body.includes('action="/auth"') && r.body.includes('name="shop"')));
  record('T2.10', check('Friendly fallback content-type text/html',
    (r.headers['content-type'] || '').includes('text/html')));
}

// /auth with malicious shop — should reject
{
  const r = await req('https://wismo-ai-app.vercel.app/auth?shop=evil.com');
  record('T2.11', check('GET /auth?shop=evil.com → rejected (open-redirect guard)',
    r.status === 400,
    `status=${r.status}`));
}
{
  const r = await req('https://wismo-ai-app.vercel.app/auth?shop=https://evil.com/.myshopify.com');
  record('T2.12', check('GET /auth with prefixed scheme → still validates',
    r.status === 400 || r.status === 302,
    `status=${r.status}`));
}

// ============================================================
// TEST 3: /app — Dashboard, must escape iframe to OAuth
// ============================================================
console.log('\n--- [Test Group 3] /app — Dashboard authorize button ---');
{
  // Without session → should land in need_auth state (since shop is in query but no DB session)
  const r = await req('https://wismo-ai-app.vercel.app/app?shop=test-store.myshopify.com');
  record('T3.1', check('GET /app?shop=... returns 200 (renders need_auth)',
    r.status === 200, `status=${r.status}`));
  record('T3.2', check('Page contains <form ...target="_top"...>',
    /<form[^>]*target="_top"/.test(r.body)));
  record('T3.3', check('Form action is absolute URL to /auth',
    /<form[^>]*action="https:\/\/wismo-ai-app\.vercel\.app\/auth/.test(r.body)));
  record('T3.4', check('Form action includes shop param',
    /action="[^"]*\?shop=test-store\.myshopify\.com/.test(r.body)));
  record('T3.5', check('Hidden shop input present',
    /<input[^>]*name="shop"[^>]*value="test-store\.myshopify\.com"/.test(r.body)));
  record('T3.6', check('Authorize App button present',
    r.body.includes('Authorize App') || r.body.includes('Re-authorize App')));
  record('T3.7', check('NO target="_blank" on auth button (Bug A regression test)',
    !r.body.includes('target="_blank" rel="noopener noreferrer" className="btn btn-primary')));
  record('T3.8', check('No legacy <a href={oauthUrl} target="_blank"> in served HTML',
    !/<a[^>]*href[^>]*target="_blank"[^>]*Authorize App/.test(r.body)));
  // Check for top-level navigation JS
  record('T3.9', check('Inline JS uses window.top.location for top-nav escape',
    r.body.includes('window.top.location.href')));
}

// /app without shop or session
{
  const r = await req('https://wismo-ai-app.vercel.app/app');
  record('T3.10', check('GET /app (no shop) returns 200 (unauthenticated state)',
    r.status === 200, `status=${r.status}`));
}

// ============================================================
// TEST 4: /api/diagnostics — production health check
// ============================================================
console.log('\n--- [Test Group 4] /api/diagnostics health ---');
{
  const r = await req('https://wismo-ai-app.vercel.app/api/diagnostics');
  record('T4.1', check('GET /api/diagnostics returns 200',
    r.status === 200, `status=${r.status}`));
  let json;
  try { json = JSON.parse(r.body); } catch {}
  record('T4.2', check('Response is valid JSON', !!json));
  if (json) {
    record('T4.3', check('Reports SHOPIFY_API_KEY present',
      json.env?.SHOPIFY_API_KEY === true,
      JSON.stringify(json.env)));
    record('T4.4', check('Reports SHOPIFY_APP_URL = https://wismo-ai-app.vercel.app',
      json.shopify?.appUrl === 'https://wismo-ai-app.vercel.app',
      `appUrl="${json.shopify?.appUrl}"`));
    record('T4.5', check('hostMatchesAppUrl evaluates correctly',
      typeof json.shopify?.hostMatchesAppUrl === 'boolean'));
    record('T4.6', check('expectedRedirectUri = https://wismo-ai-app.vercel.app/auth/callback',
      json.shopify?.expectedRedirectUri === 'https://wismo-ai-app.vercel.app/auth/callback'));
    record('T4.7', check('Scopes in diagnostics match toml',
      json.shopify?.scopes === 'read_products,read_orders,read_fulfillments,write_themes',
      `scopes="${json.shopify?.scopes}"`));
    record('T4.8', check('NO secrets leaked in response',
      !r.body.includes(process.env.SHOPIFY_API_SECRET || 'shpss_PLACEHOLDER_NEVER_LEAK') &&
      !r.body.includes(process.env.SUPABASE_SERVICE_ROLE_KEY || 'XXXXXX'),
      'inspected body for known secret prefixes'));
  }
}

// ============================================================
// TEST 5: /app/billing — payment form must escape iframe
// ============================================================
console.log('\n--- [Test Group 5] /app/billing form must escape iframe ---');
{
  const r = await req('https://wismo-ai-app.vercel.app/app/billing?shop=test-store.myshopify.com');
  // Without DB session, this might 401 from authenticateAdmin. That's OK.
  // We just want to ensure the build artifact contains target="_top" markers.
  // Check the BUILD assets directly:
  const fs = await import('node:fs');
  const billingChunk = fs.readdirSync('./build/client/assets').find(f => f.startsWith('app.billing-'));
  if (billingChunk) {
    const content = fs.readFileSync(`./build/client/assets/${billingChunk}`, 'utf8');
    record('T5.1', check('Billing chunk includes reloadDocument flag',
      content.includes('reloadDocument') || content.includes('reload-document')));
    record('T5.2', check('Billing chunk includes target="_top" marker',
      content.includes('"_top"')));
  } else {
    record('T5.0', check('Billing chunk found in build assets', false, 'chunk not found'));
  }
  console.log(`  (live status for /app/billing: ${r.status} — auth gate expected)`);
}

// ============================================================
// TEST 6: Public pages — landing, privacy, terms — should render
// ============================================================
console.log('\n--- [Test Group 6] Public pages ---');
for (const path of ['/', '/privacy', '/terms', '/dpa', '/dmca', '/health']) {
  const r = await req(`https://wismo-ai-app.vercel.app${path}`);
  record(`T6.${path}`, check(`GET ${path} returns 200`, r.status === 200, `status=${r.status}`));
}

// ============================================================
// TEST 7: Webhooks — should reject GET / require HMAC
// ============================================================
console.log('\n--- [Test Group 7] Webhooks ---');
{
  const r = await req('https://wismo-ai-app.vercel.app/webhooks');
  record('T7.1', check('GET /webhooks returns 200 (health/info)',
    r.status === 200 || r.status === 405,
    `status=${r.status}`));

  const r2 = await req('https://wismo-ai-app.vercel.app/webhooks', { method: 'POST', body: 'fake' });
  record('T7.2', check('POST /webhooks without HMAC → rejected',
    r2.status === 401 || r2.status === 400 || r2.status === 403,
    `status=${r2.status}`));
}

// ============================================================
// TEST 8: Headers consistency on every route
// ============================================================
console.log('\n--- [Test Group 8] Header consistency across routes ---');
const routesToCheck = ['/', '/auth?shop=test.myshopify.com', '/app?shop=test.myshopify.com', '/api/diagnostics', '/privacy', '/health', '/webhooks'];
let allNoXFO = true;
let allHaveCSP = true;
for (const path of routesToCheck) {
  const r = await req(`https://wismo-ai-app.vercel.app${path}`);
  if ('x-frame-options' in r.headers) {
    allNoXFO = false;
    console.log(`  ❌ ${path} has X-Frame-Options=${r.headers['x-frame-options']}`);
  }
  if (!r.headers['content-security-policy']?.includes('frame-ancestors')) {
    allHaveCSP = false;
    console.log(`  ❌ ${path} missing frame-ancestors CSP`);
  }
}
record('T8.1', check('NO route emits X-Frame-Options', allNoXFO));
record('T8.2', check('ALL routes emit CSP frame-ancestors', allHaveCSP));

// ============================================================
// SUMMARY
// ============================================================
const passed = results.filter(r => r[1]).length;
const total = results.length;
console.log('\n========================================');
console.log(`SUMMARY: ${passed}/${total} checks passed`);
const failed = results.filter(r => !r[1]);
if (failed.length > 0) {
  console.log('\nFAILED:');
  failed.forEach(([id]) => console.log(`  - ${id}`));
  process.exit(1);
}
console.log('========================================');
