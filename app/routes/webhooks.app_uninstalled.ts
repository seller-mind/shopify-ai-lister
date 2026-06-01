/**
 * App卸载Webhook处理
 * 
 * 当商家卸载应用时清理数据
 */
import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { verifyShopifyWebhook } from '@shopify/shopify-api';
import { deleteStore } from '~/services/supabase.server';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.text();
    const hmac = request.headers.get('X-Shopify-Hmac-Sha256');
    const topic = request.headers.get('X-Shopify-Topic');
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
    
    // 解析webhook数据
    const data = JSON.parse(body);
    
    console.log(`[Webhook] App uninstalled from ${shopDomain}`);
    
    // 清理店铺数据
    if (shopDomain) {
      await deleteStore(shopDomain);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// 阻止GET请求
export async function loader() {
  return json({ error: 'Method not allowed' }, { status: 405 });
}
