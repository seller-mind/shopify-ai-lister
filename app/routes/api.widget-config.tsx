/**
 * GET /api/widget-config - Returns widget configuration for a store
 * Called by the storefront widget script on page load
 */
import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { getSupabaseAdmin, getStore } from '~/services/supabase.server';
import { addCorsHeaders, handleCorsPreflightRequest } from '~/utils/cors';

// ─── Rate Limiting (per-shop, in-memory) ─────────────────────────────
const RATE_LIMITS: Record<string, { count: number; resetAt: number }> = {};
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 config requests per minute per shop

function checkRateLimit(shop: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMITS[shop];
  if (!entry || now > entry.resetAt) {
    RATE_LIMITS[shop] = { count: 1, resetAt: now + RATE_LIMIT_WINDOW };
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}



// ─── Plan Limits ────────────────────────────────────────────────────
const PLAN_LIMITS: Record<string, number> = { FREE: 10, STARTER: 50, PRO: 500, BUSINESS: Infinity };

async function getPlanStatus(shop: string, plan: string): Promise<{ planLimited: boolean; conversationsUsed: number; conversationsLimit: number }> {
  const limit = PLAN_LIMITS[plan.toUpperCase()] ?? PLAN_LIMITS.FREE;
  if (limit === Infinity) return { planLimited: false, conversationsUsed: 0, conversationsLimit: limit };

  try {
    const db = getSupabaseAdmin();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count } = await db.from('wismo_conversations').select('*', { count: 'exact', head: true }).eq('shop', shop).gte('created_at', startOfMonth.toISOString());
    const used = count || 0;
    return { planLimited: used >= limit, conversationsUsed: used, conversationsLimit: limit };
  } catch {
    return { planLimited: false, conversationsUsed: 0, conversationsLimit: limit };
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  // Handle CORS preflight
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;

  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');

  if (!shop) {
    const h = new Headers(); addCorsHeaders(h, request);
    return json({ error: 'Missing shop parameter' }, { status: 400, headers: h });
  }

  // Validate shop domain format (prevent reconnaissance/abuse)
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop)) {
    const h = new Headers(); addCorsHeaders(h, request);
    return json({ error: 'Invalid shop domain' }, { status: 400, headers: h });
  }

  // Rate limit check
  if (!checkRateLimit(shop)) {
    const h = new Headers();
    addCorsHeaders(h, request);
    return json({ error: 'Too many requests' }, { status: 429, headers: h });
  }

  // Verify store exists and has app installed
  const store = await getStore(shop);
  if (!store) {
    const h = new Headers(); addCorsHeaders(h, request);
    return json({ error: 'Store not found' }, { status: 404, headers: h });
  }

  // Get WISMO settings
  let settings = {
    enabled: true,
    widgetPosition: 'bottom-right',
    widgetColor: '#008060',
    greeting: 'Track your order in seconds',
    brandName: '',
    faqItems: [] as { question: string; answer: string }[],
  };

  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('wismo_settings')
      .select('*')
      .eq('shop', shop)
      .single();

    if (data) {
      settings = {
        enabled: data.enabled ?? true,
        widgetPosition: data.widget_position ?? 'bottom-right',
        widgetColor: data.widget_color ?? '#008060',
        greeting: data.greeting ?? 'Track your order in seconds',
        brandName: data.brand_name ?? '',
        faqItems: data.faq_items || [],
      };
    }
  } catch { /* use defaults */ }

  if (!settings.enabled) {
    const h = new Headers(); addCorsHeaders(h, request);
    return json({ enabled: false }, { headers: h });
  }

  const responseHeaders = new Headers();
  addCorsHeaders(responseHeaders, request);

  // Check plan status for widget
  const planStatus = await getPlanStatus(shop, store.plan || 'FREE');

  return json({
    enabled: true,
    position: settings.widgetPosition,
    color: settings.widgetColor,
    greeting: settings.greeting,
    brandName: settings.brandName,
    faqItems: settings.faqItems || [],
    apiEndpoint: `${process.env.SHOPIFY_APP_URL || 'https://wismo-ai-app.vercel.app'}/api/chat`,
    shop,
    plan: store.plan || 'FREE',
    planLimited: planStatus.planLimited,
    conversationsUsed: planStatus.conversationsUsed,
    conversationsLimit: planStatus.conversationsLimit,
  }, { headers: responseHeaders });
}
