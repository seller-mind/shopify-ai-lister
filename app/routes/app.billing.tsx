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
    trialDays: 7,
    planId: 'BUSINESS',
  },
];

// Plan tier order for upgrade/downgrade detection
const PLAN_TIER: Record<string, number> = { FREE: 0, STARTER: 1, PRO: 2, BUSINESS: 3 };

export async function loader({ request }: LoaderFunctionArgs) {
  const { session, admin } = await authenticateAdmin(request);
  
  let currentPlan = 'FREE';
  try {
    const result = await admin.graphql(`{
      currentAppInstallation { activeSubscriptions { name status test } }
    }`);
    const sub = result?.data?.currentAppInstallation?.activeSubscriptions?.[0];
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

  // Check if merchant already has an active subscription (plan change = no trial)
  let isPlanChange = false;
  try {
    const result = await admin.graphql(`{
      currentAppInstallation { activeSubscriptions { name status } }
    }`);
    const sub = result?.data?.currentAppInstallation?.activeSubscriptions?.[0];
    if (sub?.status === 'ACTIVE') isPlanChange = true;
  } catch { /* assume no existing sub */ }

  // Plan changes (upgrade/downgrade) don't get trial days
  const effectiveTrialDays = isPlanChange ? 0 : plan.trialDays;

  try {
    // Shopify Billing API: creating a new subscription automatically cancels
    // the existing one, enabling plan changes (upgrade/downgrade) without
    // requiring merchant to contact support (Shopify App Store requirement 1.2.3)
    const returnUrl = `${process.env.SHOPIFY_APP_URL}/app/billing?shop=${encodeURIComponent(session.shop)}`;
    const result = await admin.graphql(`
      mutation CreateSubscription($name: String!, $price: Decimal!, $returnUrl: URL!, $trialDays: Int!, $test: Boolean!) {
        appSubscriptionCreate(
          name: $name returnUrl: $returnUrl test: $test trialDays: $trialDays
          lineItems: [{ plan: { appRecurringPricingDetails: { price: { amount: $price, currencyCode: USD }, interval: EVERY_30_DAYS } } }]
        ) { userErrors { field message } confirmationUrl appSubscription { id status } }
      }
    `, {
      name: plan.name, price: plan.price, returnUrl, trialDays: effectiveTrialDays,
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
        <div className="label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          Monthly usage: <strong>{usage.count}</strong> / {usage.limit === Infinity ? '∞' : usage.limit} conversations
        </div>
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
            {plan.featured && (
              <div className="plan-badge">Most Popular</div>
            )}
            <h2>{plan.name}</h2>
            <div className="plan-price">
              ${plan.price}
              <span>/mo</span>
            </div>
            <ul className="plan-features">
              {plan.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <Form method="post" style={{ marginTop: '20px' }}>
              <input type="hidden" name="plan_id" value={plan.planId} />
              {currentPlan === plan.planId ? (
                <button type="button" className="btn" style={{ width: '100%', background: '#e3f0ea', color: '#008060', borderColor: '#008060' }} disabled>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Current Plan
                </button>
              ) : (
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : currentPlan === 'FREE' 
                    ? `Start ${plan.trialDays}-day free trial` 
                    : PLAN_TIER[plan.planId] > PLAN_TIER[currentPlan]
                      ? `Upgrade to ${plan.name}`
                      : `Downgrade to ${plan.name}`
                  }
                </button>
              )}
            </Form>
          </div>
        ))}
      </div>

      {/* Trust Signals */}
      <div className="trust-signals">
        <div className="trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          256-bit SSL encryption
        </div>
        <div className="trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          Cancel anytime
        </div>
        <div className="trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          No credit card required for trial
        </div>
        <div className="trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          Setup in 2 minutes
        </div>
      </div>

      {/* Tax Disclosure */}
      <div className="card" style={{ marginTop: '16px', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
          <strong>Tax notice:</strong> All prices are in USD. Applicable taxes (VAT, sales tax) are calculated and collected by Shopify at checkout based on your billing address. EU merchants: VAT is included in the price where required by local law.
        </p>
      </div>

      {/* Refund & EU Withdrawal Notice */}
      <div className="card" style={{ marginTop: '12px', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
          <strong>Refund policy:</strong> 7-day money-back guarantee on all paid plans. Contact haimozhouqiu@outlook.com for a full refund within 7 days of purchase.
          EU merchants: You have the right to withdraw within 14 days without giving any reason (see our <a href="/terms" style={{ color: '#2563eb' }}>Terms of Service</a>).
        </p>
      </div>

      {/* Plan Change Notice */}
      {currentPlan !== 'FREE' && (
        <div className="card" style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            <strong>Plan changes:</strong> Upgrading or downgrading takes effect immediately. When you upgrade, you'll be charged a prorated amount for the remainder of your billing cycle. When you downgrade, the new plan starts at your next billing date.
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#64748b' }}>
            <strong>Cancel:</strong> You can cancel your subscription at any time from your Shopify admin: Settings → Apps and sales channels → WISMO AI → Delete. Cancellation takes effect at the end of your current billing period.
          </p>
        </div>
      )}

      {/* Plan Comparison */}
      <div className="card" style={{ marginTop: '32px' }}>
        <h2>Plan Comparison</h2>
        <table style={{ marginTop: '12px' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #e1e3e5', padding: '12px 8px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8c9196' }}>Feature</th>
              <th style={{ borderBottom: '1px solid #e1e3e5', padding: '12px 8px', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8c9196' }}>Starter</th>
              <th style={{ borderBottom: '1px solid #e1e3e5', padding: '12px 8px', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#008060' }}>Pro</th>
              <th style={{ borderBottom: '1px solid #e1e3e5', padding: '12px 8px', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8c9196' }}>Business</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '13px' }}>
            {[
              ['Monthly conversations', '50', '500', 'Unlimited'],
              ['Stores', '1', '1', 'Unlimited'],
              ['Order tracking (WISMO)', '✓', '✓', '✓'],
              ['FAQ auto-reply', '✓', '✓', '✓'],
              ['Multi-language support', '✓', '✓', '✓'],
              ['Custom brand voice', '—', '✓', '✓'],
              ['Analytics dashboard', '—', '✓', '✓'],
              ['Human agent handoff', '—', '—', '✓'],
              ['Custom integrations', '—', '—', '✓'],
              ['Priority support', '—', '✓', 'Dedicated'],
            ].map(([feature, ...vals], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : '#fafbfc' }}>
                <td style={{ padding: '11px 8px', fontWeight: '500' }}>{feature}</td>
                {vals.map((val, j) => (
                  <td key={j} style={{ padding: '11px 8px', textAlign: 'center', color: val === '✓' ? '#008060' : val === '—' ? '#c4c7ca' : 'inherit' }}>
                    {val === '✓' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ margin: '0 auto', display: 'block' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    ) : val === '—' ? '—' : val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
