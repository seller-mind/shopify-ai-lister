import '@shopify/shopify-api/adapters/node';
import { shopifyApp, BillingInterval } from '@shopify/shopify-app-remix/server';

/**
 * Shopify App 配置
 * 
 * 使用官方Remix适配器，配置OAuth、计费和GDPR Webhook
 */
const shopify = shopifyApp({
  // API凭证 - 从环境变量读取
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  
  // 应用URL（用于OAuth回调）
  appUrl: process.env.SHOPIFY_APP_URL!,
  
  // 访问权限范围
  scopes: process.env.SCOPES?.split(',') ?? ['read_products', 'write_products'],
  
  // 是否为嵌入式应用（true才能嵌入Shopify Admin）
  isEmbeddedApp: true,
  
  // 启用新的嵌入式认证策略（消除OAuth重定向）
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
  
  // 计费计划配置
  billing: {
    'STARTER_PLAN': {
      amount: 19,
      currencyCode: 'USD',
      interval: BillingInterval.Every30Days,
      trialDays: 7, // 7天免费试用
    },
    'PRO_PLAN': {
      amount: 39,
      currencyCode: 'USD',
      interval: BillingInterval.Every30Days,
      trialDays: 7,
    },
  },
  
  // Webhook配置
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: 'http',
      callbackUrl: '/webhooks/app_uninstalled',
    },
    CUSTOMERS_DATA_REQUEST: {
      deliveryMethod: 'http',
      callbackUrl: '/webhooks/customers_data_request',
    },
    CUSTOMERS_REDACT: {
      deliveryMethod: 'http',
      callbackUrl: '/webhooks/customers_redact',
    },
    SHOP_REDACT: {
      deliveryMethod: 'http',
      callbackUrl: '/webhooks/shop_redact',
    },
    APP_PURCHASES_UPDATE: {
      deliveryMethod: 'http',
      callbackUrl: '/webhooks/app_purchases_update',
    },
  },
  
  // 存储配置 - 使用内存存储（生产环境建议使用Prisma+PostgreSQL）
  sessionStorage: {
    storeSession: async (session) => {
      // 存储session到数据库
      const { storeSessionInDB } = await import('~/services/supabase.server');
      return storeSessionInDB(session);
    },
    loadSession: async (sessionId) => {
      const { loadSessionFromDB } = await import('~/services/supabase.server');
      return loadSessionFromDB(sessionId);
    },
    deleteSession: async (sessionId) => {
      const { deleteSessionFromDB } = await import('~/services/supabase.server');
      return deleteSessionFromDB(sessionId);
    },
  },
});

export default shopify;

/**
 * 认证辅助函数 - 用于保护路由
 */
export const authenticate = {
  admin: shopify.authenticate.admin,
  public: shopify.authenticate.public,
};

/**
 * 登录助手 - 用于发起OAuth流程
 */
export const login = shopify.login;

/**
 * 卸载助手 - 处理App卸载
 */
export const uninstall = shopify.uninstall;
