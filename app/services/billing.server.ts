/**
 * Billing Service - Shopify Billing API
 * 
 * 处理订阅计划管理、应用内购买
 */
import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '~/shopify.server';
import type { PlanType, SubscriptionInfo } from '~/types';

// 计划配置
const PLANS = {
  FREE: null, // 免费计划不需要Billing API
  STARTER: 'STARTER_PLAN',
  PRO: 'PRO_PLAN',
};

/**
 * 检查用户订阅状态
 */
export async function checkSubscription(request: Request): Promise<SubscriptionInfo> {
  const { billing } = await authenticate.admin(request);
  
  try {
    // 检查是否有活跃订阅
    const hasActivePayment = await billing.check({
      plans: [PLANS.STARTER, PLANS.PRO],
    });
    
    if (hasActivePayment.hasActivePayment) {
      // 获取订阅详情
      const subscription = await billing.getSubscriptionInfo();
      
      return {
        plan: determinePlan(subscription?.name),
        status: mapBillingStatus(hasActivePayment),
        trialEndsAt: subscription?.trialEndsAt,
        subscriptionEndsAt: subscription?.billingOn,
        cancelAtPeriodEnd: subscription?.cancelledAt !== null,
      };
    }
    
    // 检查试用状态
    if (hasActivePayment.hasTrial) {
      return {
        plan: determinePlan(hasActivePayment.trialPlans?.[0]),
        status: 'trialing',
        trialEndsAt: hasActivePayment.trialEndsAt,
      };
    }
    
    return {
      plan: 'FREE',
      status: 'none',
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return {
      plan: 'FREE',
      status: 'none',
    };
  }
}

/**
 * 请求订阅计划
 */
export async function requestSubscription(
  request: Request,
  plan: PlanType
): Promise<Response> {
  const { billing } = await authenticate.admin(request);
  
  const planName = PLANS[plan];
  if (!planName) {
    throw new Error('Invalid plan');
  }
  
  const confirmUrl = await billing.request({
    plan: planName,
    isTest: process.env.NODE_ENV !== 'production',
  });
  
  if (confirmUrl) {
    return redirect(confirmUrl);
  }
  
  throw new Error('Failed to create billing request');
}

/**
 * 取消订阅
 */
export async function cancelSubscription(
  request: Request,
  plan: PlanType
): Promise<{ success: boolean; error?: string }> {
  const { billing } = await authenticate.admin(request);
  
  const planName = PLANS[plan];
  if (!planName) {
    return { success: false, error: 'Invalid plan' };
  }
  
  try {
    const result = await billing.cancel({
      plan: planName,
    });
    
    return { success: result.cancelled };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * 获取所有可用计划
 */
export function getAvailablePlans(): {
  name: string;
  price: number;
  features: string[];
  limits: {
    generations: number;
    bulkMax: number;
  };
}[] {
  return [
    {
      name: 'Free',
      price: 0,
      features: [
        '每月5次生成',
        'Amazon格式',
        'Shopify直接应用',
        '基础关键词建议',
      ],
      limits: {
        generations: 5,
        bulkMax: 1,
      },
    },
    {
      name: 'Starter',
      price: 19,
      features: [
        '每月100次生成',
        'Amazon + Shopify双平台',
        '批量生成（最多10个）',
        '高级关键词策略',
        '7天免费试用',
      ],
      limits: {
        generations: 100,
        bulkMax: 10,
      },
    },
    {
      name: 'Pro',
      price: 39,
      features: [
        '无限次生成',
        'Amazon + Shopify双平台',
        '批量生成（最多50个）',
        '品牌声音定制',
        '自定义关键词库',
        '优先客户支持',
        '7天免费试用',
      ],
      limits: {
        generations: Infinity,
        bulkMax: 50,
      },
    },
  ];
}

/**
 * 根据Shopify计划名称确定内部计划类型
 */
function determinePlan(shopifyPlanName?: string | null): PlanType {
  if (!shopifyPlanName) return 'FREE';
  
  if (shopifyPlanName.includes('PRO')) return 'PRO';
  if (shopifyPlanName.includes('STARTER')) return 'STARTER';
  
  return 'FREE';
}

/**
 * 映射Shopify Billing状态到内部状态
 */
function mapBillingStatus(billingCheck: any): SubscriptionInfo['status'] {
  if (billingCheck.active) return 'active';
  if (billingCheck.trialing) return 'trialing';
  if (billingCheck.pastDue) return 'past_due';
  if (billingCheck.accepted) return 'active';
  
  return 'none';
}
