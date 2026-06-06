/**
 * AI Lister 应用类型定义
 */

/** 订阅计划类型 */
export type PlanType = 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS';

/** 目标平台类型 */
export type TargetPlatform = 'amazon' | 'shopify' | 'both';

/** 生成状态 */
export type GenerationStatus = 'pending' | 'generating' | 'completed' | 'failed';

/** Shopify产品变体 */
export interface ProductVariant {
  id: string;
  title: string;
  price: string;
  sku?: string;
  inventoryQuantity?: number;
}

/** Shopify产品 */
export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  descriptionHtml: string;
  description?: string;
  tags: string[];
  vendor?: string;
  productType?: string;
  variants: ProductVariant[];
  images?: { url: string; altText?: string }[];
  createdAt: string;
  updatedAt: string;
}

/** AI generation input (any language) */
export interface GenerationInput {
  // Product name (any language)
  productName: string;
  // Product category
  category?: string;
  // Key features (one per line, any language)
  features?: string;
  // Target market keywords
  keywords?: string;
  // 竞品参考（可选）
  competitorReferences?: string;
  // 品牌名称
  brandName?: string;
  // 材质/规格
  material?: string;
  // 包装内容
  packageContents?: string;
  // 目标平台
  targetPlatform: TargetPlatform;
}

/** AI生成输出（英文） */
export interface GenerationOutput {
  // 简短标题（Amazon Search Term优化）
  shortTitle: string;
  // 5点产品要点（Bullet Points）
  bulletPoints: string[];
  // 产品描述
  productDescription: string;
  // SEO关键词
  seoKeywords: string[];
  // 后端搜索词（Amazon）
  backendSearchTerms: string;
}

/** 生成历史记录 */
export interface GenerationRecord {
  id: string;
  storeId: string;
  shopDomain: string;
  productId?: string;
  productTitle?: string;
  input: GenerationInput;
  output: GenerationOutput | null;
  status: GenerationStatus;
  model: string;
  tokensUsed: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

/** 用量追踪 */
export interface UsageStats {
  monthlyGenerations: number;
  monthlyLimit: number;
  planType: PlanType;
  isActive: boolean;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
}

/** Shopify店铺信息 */
export interface StoreInfo {
  id: string;
  shop: string;
  shopName: string;
  shopEmail?: string;
  plan: string;
  accessToken: string;
  installedAt: string;
}

/** 用户订阅信息 */
export interface SubscriptionInfo {
  plan: PlanType;
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'none';
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
  cancelAtPeriodEnd?: boolean;
}

/** API响应结构 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Webhook事件类型 */
export type WebhookEventType = 
  | 'app_uninstalled'
  | 'customers_data_request'
  | 'customers_redact'
  | 'shop_redact'
  | 'app_purchases_update';

/** GDPR数据请求 */
export interface GDPRDataRequest {
  shopDomain: string;
  shopId: string;
  customer: {
    id?: string;
    email?: string;
    phone?: string;
  };
  requestId: string;
  sentAt: string;
}

/** 设置项 */
export interface AppSettings {
  defaultPlatform: TargetPlatform;
  autoApplyToShopify: boolean;
  defaultTone: 'professional' | 'casual' | 'luxury' | 'friendly';
  brandVoice?: string;
  preferredKeywords?: string[];
}
