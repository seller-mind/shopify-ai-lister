/**
 * /app/billing - WISMO AI Plans & Billing
 * Uses Shopify Billing API for subscription management
 */
import { json, redirect } from '@remix-run/node';
import { useLoaderData, Form, useNavigation } from '@remix-run/react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { authenticateAdmin, shopifyREST } from '~/shopify.server';
import { getSupabaseAdmin } from '~/services/supabase.server';

const PLANS = [
  {
    name: 'Starter',
    price: 15,
    priceSuffix: '/mo',
    features: [
      '50 AI conversations/month',
      'Order tracking (WISMO)',
      'FAQ auto-reply',
      'Multi-language support',
      '1 store',
    ],
    trialDays: 7,
    planId: 'STARTER',
  },
  {
    name: 'Pro',
    price: 49,
    priceSuffix: '/mo',
    features: [
      '500 AI conversations/month',
      'Order tracking (WISMO)',
      'FAQ auto-reply',
      'Multi-language support',
      'Custom brand voice',
      'Analytics dashboard',
      'Priority support',
      '1 store',
    ],
    trialDays: 7,
    planId: 'PRO',
    featured: true,
  },
  {
    name: 'Business',
    price: 149,
    priceSuffix: '/mo',
    features: [
      'Unlimited AI conversations',
      'Everything in Pro',
      'Handoff to human agents',
      'Multiple stores',
      'Custom integrations',
      'Dedicated support',
    ],
    trialDays: 14,
    planId: 'BUSINESS',
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { session, admin } = await authenticateAdmin(request);
  
  // Check current subscription
  let currentPlan = 'FREE';
  try {
    const result = await admin.rest('/recurring_application_charges.json');
    const charges = result.recurring_application_charges || [];
    const active = charges.find((c: any) => c.status === 'active');
    if (active) {
      currentPlan = active.name?.toUpperCase() || 'FREE';
    }
  } catch { /* no active subscription */ }

  // Get usage
  let usage = { count: 0, limit: 10 };
  try {
    const supabase = getSupabaseAdmin();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const store = await getStore(session.shop);
    if (store) {
      const { count } = await supabase
        .from('wismo_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('shop', session.shop)
        .gte('created_at', startOfMonth.toISOString());
      
      const limits: Record<string, number> = { FREE: 10, STARTER: 50, PRO: 500, BUSINESS: Infinity };
      usage = { count: count || 0, limit: limits[currentPlan] || 10 };
    }
  } catch { /* empty */ }

  return json({ shop: session.shop, currentPlan, usage });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await authenticateAdmin(request);
  const formData = await request.formData();
  const planId = formData.get('plan_id') as string;

  if (!planId) {
    return json({ error: 'Missing plan_id' }, { status: 400 });
  }

  const plan = PLANS.find(p => p.planId === planId);
  if (!plan) {
    return json({ error: 'Invalid plan' }, { status: 400 });
  }

  try {
    // Create Shopify recurring charge
    const returnUrl = `https://${session.shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`;
    
    const result = await admin.rest('/recurring_application_charges.json', {
      method: 'POST',
      body: JSON.stringify({
        recurring_application_charge: {
          name: plan.name,
          price: plan.price,
          return_url: returnUrl,
          trial_days: plan.trialDays,
          test: process.env.NODE_ENV !== 'production',
        },
      }),
    });

    const confirmationUrl = result.recurring_application_charge?.confirmation_url;
    if (confirmationUrl) {
      return redirect(confirmationUrl);
    }

    return json({ error: 'Failed to create subscription' }, { status: 500 });
  } catch (error) {
    console.error('[Billing] Error:', error);
    return json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}

async function getStore(shop: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('stores').select('id').eq('shop', shop).single();
  return data;
}

export default function Billing() {
  const { currentPlan, usage } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="page">
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>💳 Plans & Billing</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>Choose the plan that fits your store</p>
      
      {/* Usage Bar */}
      <div style={{ background: '#e8f0fe', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '13px' }}>
        <span>Monthly usage: <strong>{usage.count}</strong> / {usage.limit === Infinity ? '∞' : usage.limit} conversations</span>
        {usage.limit !== Infinity && (
          <div style={{ background: '#c5daf0', borderRadius: '4px', height: '6px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ background: '#008060', height: '100%', borderRadius: '4px', width: `${Math.min((usage.count / usage.limit) * 100, 100)}%` }} />
          </div>
        )}
      </div>

      {/* Plans Grid */}
      <div className="plans">
        {PLANS.map(plan => (
          <div key={plan.planId} className={`plan-card ${plan.featured ? 'featured' : ''} ${currentPlan === plan.planId ? 'active-plan' : ''}`}>
            {plan.featured && <div style={{ background: '#008060', color: '#fff', padding: '4px', borderRadius: '4px 4px 0 0', fontSize: '12px', fontWeight: 600 }}>MOST POPULAR</div>}
            <h2>{plan.name}</h2>
            <div className="price">${plan.price}<span style={{ fontSize: '14px', fontWeight: 400 }}>{plan.priceSuffix}</span></div>
            <ul>
              {plan.features.map((f, i) => (
                <li key={i}>✓ {f}</li>
              ))}
            </ul>
            <Form method="post" style={{ marginTop: '16px' }}>
              <input type="hidden" name="plan_id" value={plan.planId} />
              {currentPlan === plan.planId ? (
                <button type="button" className="btn" style={{ width: '100%', background: '#e3f1e8', color: '#008060' }} disabled>Current Plan</button>
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
