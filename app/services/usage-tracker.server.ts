/**
 * Usage Tracker Service
 */
import type { PlanType, UsageStats } from '~/types';
import { getMonthlyUsage } from './supabase.server';

export async function getUsageStats(shop: string): Promise<UsageStats> {
  const usage = await getMonthlyUsage(shop);
  return {
    monthlyGenerations: usage.count,
    monthlyLimit: usage.limit,
    planType: 'FREE',
    isActive: true,
  };
}

export function getPlanLimits(plan: PlanType) {
  const limits: Record<PlanType, { generations: number; bulkMax: number; features: string[] }> = {
    FREE: { generations: 5, bulkMax: 1, features: ['Amazon format', 'Basic keywords', 'Shopify apply'] },
    STARTER: { generations: 100, bulkMax: 10, features: ['Amazon + Shopify', 'Advanced keywords', 'Batch generate'] },
    PRO: { generations: Infinity, bulkMax: 50, features: ['Unlimited', 'Brand voice', 'Custom keywords'] },
  };
  return limits[plan];
}
