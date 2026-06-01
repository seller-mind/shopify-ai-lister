/**
 * Billing Service - Shopify Billing API
 * Using direct fetch instead of SDK
 */
import type { PlanType, SubscriptionInfo } from '~/types';

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY!;
const APP_URL = process.env.SHOPIFY_APP_URL!;

const PLANS = {
  FREE: null,
  STARTER: 'STARTER_PLAN',
  PRO: 'PRO_PLAN',
};

export async function checkSubscription(shop: string, accessToken: string): Promise<SubscriptionInfo> {
  try {
    const response = await fetch(`https://${shop}/admin/api/2026-04/recurring_application_charges.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });
    const data = await response.json();
    
    const charges = data.recurring_application_charges || [];
    const active = charges.find((c: any) => c.status === 'active');
    
    if (active) {
      return {
        plan: active.name?.includes('PRO') ? 'PRO' : active.name?.includes('STARTER') ? 'STARTER' : 'FREE',
        status: 'active',
      };
    }
    
    return { plan: 'FREE', status: 'none' };
  } catch {
    return { plan: 'FREE', status: 'none' };
  }
}

export function getAvailablePlans() {
  return [
    { name: 'Free', price: 0, generations: 5, bulkMax: 1 },
    { name: 'Starter', price: 19, generations: 100, bulkMax: 10, trialDays: 7 },
    { name: 'Pro', price: 39, generations: Infinity, bulkMax: 50, trialDays: 7 },
  ];
}
