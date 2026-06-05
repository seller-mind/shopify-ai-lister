/**
 * Billing Service - Shopify Billing API
 * Using GraphQL Billing API (current standard)
 */
import type { PlanType, SubscriptionInfo } from '~/types';

const APP_URL = process.env.SHOPIFY_APP_URL!;

const PLANS = {
  FREE: null,
  STARTER: 'WISMO_STARTER',
  PRO: 'WISMO_PRO',
  BUSINESS: 'WISMO_BUSINESS',
};

export const PLAN_CONFIGS = {
  STARTER: {
    name: 'Starter',
    price: 15,
    trialDays: 7,
    features: ['50 AI conversations/month', 'Order tracking (WISMO)', 'FAQ auto-reply', 'Multi-language support'],
  },
  PRO: {
    name: 'Pro',
    price: 49,
    trialDays: 7,
    features: ['500 AI conversations/month', 'Order tracking (WISMO)', 'FAQ auto-reply', 'Multi-language support', 'Custom brand voice', 'Analytics dashboard', 'Priority support'],
  },
  BUSINESS: {
    name: 'Business',
    price: 149,
    trialDays: 14,
    features: ['Unlimited AI conversations', 'Everything in Pro', 'Handoff to human agents', 'Multiple stores', 'Custom integrations', 'Dedicated support'],
  },
} as const;

export async function checkSubscription(shop: string, accessToken: string): Promise<SubscriptionInfo> {
  try {
    // Use GraphQL to check current subscriptions
    const response = await fetch(`https://${shop}/admin/api/2026-04/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `{
          currentAppInstallation {
            subscription {
              name
              status
              test
            }
          }
        }`,
      }),
    });

    const data = await response.json();
    const subscription = data?.data?.currentAppInstallation?.subscription;

    if (subscription?.status === 'ACTIVE') {
      const planName = subscription.name?.toUpperCase() || 'FREE';
      const plan = Object.keys(PLAN_CONFIGS).find(k => 
        PLAN_CONFIGS[k as keyof typeof PLAN_CONFIGS].name.toUpperCase() === planName || k === planName
      ) || 'FREE';
      return { plan: plan as PlanType, status: 'active' };
    }

    return { plan: 'FREE', status: 'none' };
  } catch {
    return { plan: 'FREE', status: 'none' };
  }
}

export function getAvailablePlans() {
  return Object.entries(PLAN_CONFIGS).map(([key, config]) => ({
    id: key,
    name: config.name,
    price: config.price,
    trialDays: config.trialDays,
    features: config.features,
  }));
}
