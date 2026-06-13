// Simulates the production environment by setting required envs before
// loading the build. This validates T4.3/T4.4/T4.7/T7.2 are env-only false
// positives and would PASS once Vercel envs are configured correctly.
process.env.SHOPIFY_API_KEY = 'a07b097182c0b2772f10316ef8c657b0';
// Mock value — actual secret stays in Vercel env / local .env, NEVER committed.
process.env.SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || 'mock_test_secret_for_e2e_only';
process.env.SHOPIFY_APP_URL = 'https://wismo-ai-app.vercel.app';
process.env.SCOPES = 'read_products,read_orders,read_fulfillments,write_themes';
process.env.SUPABASE_URL = 'https://sdeduzqplvsyttvnolxm.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-key-for-test';
process.env.DEEPSEEK_API_KEY = 'fake-deepseek-key';

const { createRequestHandler } = await import('@remix-run/node');
const build = await import('./build/server/nodejs-eyJydW50aW1lIjoibm9kZWpzIn0/index.js');
const handler = createRequestHandler(build, 'production');

async function req(url, opts = {}) {
  const r = await handler(new Request(url, opts));
  return { status: r.status, headers: Object.fromEntries(r.headers.entries()), body: await r.text() };
}

let passed = 0, failed = 0;
function check(label, ok, detail) {
  console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`);
  ok ? passed++ : failed++;
}

console.log('=== TEST WITH PRODUCTION-LIKE ENV ===\n');

// T4 with env
console.log('--- T4 /api/diagnostics with env ---');
const d = await req('https://wismo-ai-app.vercel.app/api/diagnostics');
let json;
try { json = JSON.parse(d.body); } catch {}
check('valid JSON', !!json);
check('SHOPIFY_API_KEY = true', json?.env?.SHOPIFY_API_KEY === true);
check('appUrl = https://wismo-ai-app.vercel.app', json?.shopify?.appUrl === 'https://wismo-ai-app.vercel.app');
check('scopes match toml', json?.shopify?.scopes === 'read_products,read_orders,read_fulfillments,write_themes');
check('hostMatchesAppUrl=true (deployed)', json?.shopify?.hostMatchesAppUrl === true);
check('expectedRedirectUri OK', json?.shopify?.expectedRedirectUri === 'https://wismo-ai-app.vercel.app/auth/callback');
check('redirectUriMatchesAppUrl=true', json?.shopify?.redirectUriMatchesAppUrl === true);
check('NO criticalIssues with env set', Array.isArray(json?.criticalIssues) && json.criticalIssues.length === 0,
  `criticalIssues=${JSON.stringify(json?.criticalIssues)}`);

// T7 with env
console.log('\n--- T7 /webhooks POST without HMAC with env ---');
const w = await req('https://wismo-ai-app.vercel.app/webhooks', { method: 'POST', body: 'fake', headers: { 'content-type': 'application/json' } });
check('POST /webhooks → 401 (HMAC missing)', w.status === 401 || w.status === 400 || w.status === 403, `status=${w.status}`);

// T2 OAuth URL with real client_id
console.log('\n--- T2 /auth with real env ---');
const a = await req('https://wismo-ai-app.vercel.app/auth?shop=test-store.myshopify.com');
const loc = a.headers['location'] || '';
check('OAuth URL contains real client_id', loc.includes('client_id=a07b097182c0b2772f10316ef8c657b0'));
check('redirect_uri = https://wismo-ai-app.vercel.app/auth/callback (URL-encoded)',
  loc.includes('redirect_uri=https%3A%2F%2Fwismo-ai-app.vercel.app%2Fauth%2Fcallback'));

// T3.3 absolute URL even with env
console.log('\n--- T3 /app form action with env ---');
const app = await req('https://wismo-ai-app.vercel.app/app?shop=test-store.myshopify.com');
check('Form action is ABSOLUTE URL with env',
  /<form[^>]*action="https:\/\/wismo-ai-app\.vercel\.app\/auth\?shop=test-store\.myshopify\.com"/.test(app.body));

console.log(`\n========================================\nWITH ENV: ${passed}/${passed+failed} passed`);
