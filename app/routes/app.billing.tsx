/**
 * /app/billing - WISMO AI Plans & Billing
 * Professional pricing cards with Shopify Billing API
 */
import { json, redirect } from '@remix-run/node';
import { useLoaderData, Form, useNavigation } from '@remix-run/react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { authenticateAdmin, shopifyGraphQL } from '~/shopify.server';
import { getSupabaseAdmin, getStore } from '~/services/supabase.server';

const PLANS = [
  {
    name: 'Starter',
    price: 15,
    features: ['50 AI conversations / month', 'Order tracking (WISMO)', 'FAQ auto-reply', 'Multi-language support', '1 store'],
    trialDays: 7,
    planId: 'STARTER',
  },
  {
    name: 'Pro',
    price: 49,
    features: ['500 AI conversations / month', 'Everything in Starter', 'Custom brand voice', 'Analytics dashboard', 'Priority support', '1 store'],
    trialDays: 7,
    planId: 'PRO',
    featured: true,
  },
  {
    name: 'Business',
    price: 149,
    features: ['Unlimited conversations', 'Everything in Pro', 'Handoff to human agents', 'Multiple stores', 'Custom integrations', 'Dedicated support'],
    trialDays: 14,
    planId: 'BUSINESS',
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { session, admin } = await authenticateAdmin(request);
  
  let currentPlan = 'FREE';
  try {
    const result = await admin.graphql(`{
      currentAppInstallation { subscription { name status test } }
    }`);
    const sub = result?.data?.currentAppInstallation?.subscription;
    if (sub?.status === 'ACTIVE') {
      const name = sub.name.toUpperCase();
      if (name.includes('BUSINESS')) currentPlan = 'BUSINESS';
      else if (name.includes('PRO')) currentPlan = 'PRO';
      else if (name.includes('STARTER')) currentPlan = 'STARTER';
    }
  } catch { /* no sub */ }

  let usage = { count: 0, limit: 10 };
  try {
    const supabase = getSupabaseAdmin();
    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const { count } = await supabase.from('wismo_conversations').select('*', { count: 'exact', head: true }).eq('shop', session.shop).gte('created_at', startOfMonth.toISOString());
    const limits: Record<string, number> = { FREE: 10, STARTER: 50, PRO: 500, BUSINESS: Infinity };
    usage = { count: count || 0, limit: limits[currentPlan] || 10 };
  } catch { /* empty */ }

  return json({ shop: session.shop, currentPlan, usage });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await authenticateAdmin(request);
  const fd = await request.formData();
  const planId = fd.get('plan_id') as string;
  if (!planId) return json({ error: 'Missing plan' }, { status: 400 });

  const plan = PLANS.find(p => p.planId === planId);
  if (!plan) return json({ error: 'Invalid plan' }, { status: 400 });

  try {
    const returnUrl = `${process.env.SHOPIFY_APP_URL}/auth/billing?shop=${encodeURIComponent(session.shop)}`;
    const result = await admin.graphql(`
      mutation CreateSubscription($name: String!, $price: Decimal!, $returnUrl: URL!, $trialDays: Int!, $test: Boolean!) {
        appSubscriptionCreate(
          name: $name returnUrl: $returnUrl test: $test trialDays: $trialDays
          lineItems: [{ plan: { appRecurringPricingDetails: { price: { amount: $price, currencyCode: USD }, interval: EVERY_30_DAYS } } }]
        ) { userErrors { field message } confirmationUrl appSubscription { id status } }
      }
    `, {
      name: plan.name, price: plan.price, returnUrl, trialDays: plan.trialDays,
      test: process.env.NODE_ENV === 'production' ? false : true,
    });

    const sr = result?.data?.appSubscriptionCreate;
    if (sr?.userErrors?.length > 0) return json({ error: sr.userErrors[0].message }, { status: 400 });
    if (sr?.confirmationUrl) return redirect(sr.confirmationUrl);
    return json({ error: 'Failed to create subscription' }, { status: 500 });
  } catch (e) {
    console.error('[Billing] Error:', e);
    return json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}

export default function Billing() {
  const { currentPlan, usage } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="page">
      <h1>Plans & Billing</h1>
      <p className="sub">Choose the plan that fits your store</p>

      {/* Usage */}
      <div className="usage-bar">
        <div className="label">Monthly usage: <strong>{usage.count}</strong> / {usage.limit === Infinity ? '∞' : usage.limit} conversations</div>
        {usage.limit !== Infinity && (
          <div className="usage-track">
            <div className="usage-fill" style={{ width: `${Math.min((usage.count / usage.limit) * 100, 100)}%` }} />
          </div>
        )}
      </div>

      {/* Plans */}
      <div className="plans">
        {PLANS.map(plan => (
          <div key={plan.planId} className={`plan-card ${plan.featured ? 'featured' : ''} ${currentPlan === plan.planId ? 'active-plan' : ''}`}>
            {plan.featured && <div className="plan-badge">Most Popular</div>}
            <h2>{plan.name}</h2>
            <div className="plan-price">${plan.price}<span>/mo</span></div>
            <ul className="plan-features">
              {plan.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <Form method="post" style={{ marginTop: '20px' }}>
              <input type="hidden" name="plan_id" value={plan.planId} />
              {currentPlan === plan.planId ? (
                <button type="button" className="btn" style={{ width: '100%', background: '#e3f0ea', color: '#008060' }} disabled>Current Plan</button>
              ) : (
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : `Start ${plan.trialDays}-day free trial`}
                </button>
              )}
            </Form>
          </div>
        ))}
      </div>
    </div>
  );
}
