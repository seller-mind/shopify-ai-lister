/**
 * Usage Tracker Service - 用量追踪
 * 
 * 追踪AI生成次数，管理配额
 */
import type { PlanType, UsageStats } from '~/types';
import { getMonthlyUsage, getStore } from './supabase.server';
import { checkSubscription } from './billing.server';

/**
 * 获取用户用量统计
 */
export async function getUsageStats(request: Request): Promise<UsageStats> {
  const { session } = await authenticate.admin(request);
  
  // 获取订阅信息
  const subscription = await checkSubscription(request);
  
  // 获取用量
  const usage = await getMonthlyUsage(session.shop);
  
  return {
    monthlyGenerations: usage.count,
    monthlyLimit: usage.limit,
    planType: subscription.plan,
    isActive: subscription.status === 'active' || subscription.status === 'trialing',
    trialEndsAt: subscription.trialEndsAt,
    subscriptionEndsAt: subscription.subscriptionEndsAt,
  };
}

/**
 * 检查是否可以继续生成
 */
export async function canGenerate(request: Request): Promise<{
  allowed: boolean;
  reason?: string;
  remainingGenerations: number;
}> {
  const stats = await getUsageStats(request);
  
  // 检查是否有活跃订阅或试用
  if (!stats.isActive && stats.planType === 'FREE') {
    if (stats.monthlyGenerations >= stats.monthlyLimit) {
      return {
        allowed: false,
        reason: '本月免费次数已用完，请升级到付费计划',
        remainingGenerations: 0,
      };
    }
  }
  
  // 检查是否超出限制
  if (stats.monthlyGenerations >= stats.monthlyLimit) {
    return {
      allowed: false,
      reason: `本月生成次数已用完 (${stats.monthlyLimit}/${stats.monthlyLimit})`,
      remainingGenerations: 0,
    };
  }
  
  return {
    allowed: true,
    remainingGenerations: stats.monthlyLimit - stats.monthlyGenerations,
  };
}

/**
 * 记录生成（更新配额）
 */
export async function recordGenerationUsage(
  shopDomain: string,
  tokensUsed: number
): Promise<void> {
  // 用量已经在supabase.server.ts的recordGeneration中记录
  // 这里主要用于实时更新缓存或其他操作
  console.log(`Generation recorded for ${shopDomain}: ${tokensUsed} tokens`);
}

/**
 * 获取套餐限制说明
 */
export function getPlanLimits(plan: PlanType): {
  generations: number;
  bulkMax: number;
  features: string[];
} {
  const limits: Record<PlanType, { generations: number; bulkMax: number; features: string[] }> = {
    FREE: {
      generations: 5,
      bulkMax: 1,
      features: [
        'Amazon格式支持',
        '基础关键词建议',
        'Shopify直接应用',
      ],
    },
    STARTER: {
      generations: 100,
      bulkMax: 10,
      features: [
        'Amazon + Shopify双平台',
        '高级关键词策略',
        '批量生成',
        '优先生成速度',
      ],
    },
    PRO: {
      generations: Infinity,
      bulkMax: 50,
      features: [
        '无限生成次数',
        '品牌声音定制',
        '自定义关键词库',
        '最大批量处理',
        '优先客户支持',
      ],
    },
  };
  
  return limits[plan];
}

/**
 * 格式化用量显示
 */
export function formatUsageDisplay(stats: UsageStats): {
  used: string;
  total: string;
  percentage: number;
  status: 'ok' | 'warning' | 'critical' | 'exceeded';
} {
  const used = stats.monthlyGenerations;
  const total = stats.monthlyLimit === Infinity ? '∞' : stats.monthlyLimit;
  const percentage = stats.monthlyLimit === Infinity 
    ? 0 
    : Math.round((used / stats.monthlyLimit) * 100);
  
  let status: 'ok' | 'warning' | 'critical' | 'exceeded' = 'ok';
  if (stats.monthlyLimit === Infinity) {
    status = 'ok';
  } else if (used >= stats.monthlyLimit) {
    status = 'exceeded';
  } else if (percentage >= 90) {
    status = 'critical';
  } else if (percentage >= 75) {
    status = 'warning';
  }
  
  return {
    used: `${used}`,
    total: `${total}`,
    percentage,
    status,
  };
}

// 导入authenticate
import { authenticate } from '~/shopify.server';
