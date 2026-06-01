/**
 * GDPR - 店铺数据删除Webhook
 * 
 * 当商家请求删除店铺所有数据时处理
 * 必须实现：App Store审核要求
 */
import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { verifyShopifyWebhook } from '@shopify/shopify-api';
import { deleteStore } from '~/services/supabase.server';

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
    
    console.log(`[GDPR] Shop data redact request for ${shopDomain || data.shop_domain}`);
    
    // 删除店铺所有数据
    const targetShop = shopDomain || data.shop_domain;
    
    if (targetShop) {
      await deleteStore(targetShop);
    }
    
    console.log('[GDPR] Shop data redacted successfully');
    
    return json({ 
      success: true, 
      message: 'Shop data deletion completed' 
    });
  } catch (error) {
    console.error('GDPR shop redact error:', error);
    return json({ error: 'Processing failed' }, { status: 500 });
  }
}

export async function loader() {
  return json({ error: 'Method not allowed' }, { status: 405 });
}
