/**
 * 应用购买更新Webhook
 * 
 * 当用户订阅发生变化时处理
 */
import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { verifyShopifyWebhook } from '@shopify/shopify-api';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.text();
    const hmac = request.headers.get('X-Shopify-Hmac-Sha256');
    const shopDomain = request.headers.get('X-Shopify-Shop-Domain');
    
    // 验证Webhook签名
    const secret = process.env.SHOPIFY_API_SECRET!;
    const hash = await verifyShopifyWebhook({ 
      rawBody: body, 
      hmacHeader: hmac || '', 
      secret 
    });
    
    if (!hash) {
      console.error('Invalid webhook signature');
      return json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const data = JSON.parse(body);
    
    console.log(`[Webhook] App purchases update from ${shopDomain}`, {
      status: data.status,
      termsAccepted: data.terms_accepted_at,
    });
    
    // 更新店铺的订阅状态
    const { upsertStore } = await import('~/services/supabase.server');
    
    if (shopDomain) {
      // 获取最新session
      const session = await shopifyApp.getSession(shopDomain);
      if (session) {
        await upsertStore(shopDomain, session.accessToken, session.isOnline);
      }
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('App purchases update error:', error);
    return json({ error: 'Processing failed' }, { status: 500 });
  }
}

export async function loader() {
  return json({ error: 'Method not allowed' }, { status: 405 });
}

// 导入shopify实例
import { shopify as shopifyApp } from '~/shopify.server';
