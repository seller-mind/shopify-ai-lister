/**
 * GDPR - 客户数据请求Webhook
 * 
 * 当客户请求导出其个人数据时处理
 * 必须实现：App Store审核要求
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
    
    console.log(`[GDPR] Customer data request from ${shopDomain}`, {
      customerId: data.customer?.id,
      customerEmail: data.customer?.email,
      requestId: data.request_id,
    });
    
    // 提取客户标识信息
    const customerId = data.customer?.id;
    const customerEmail = data.customer?.email;
    
    if (!customerId && !customerEmail) {
      return json({ error: 'Missing customer identifier' }, { status: 400 });
    }
    
    // TODO: 从数据库收集该客户的个人数据
    // 返回客户的所有个人数据
    
    const customerData = {
      requestId: data.request_id,
      shopDomain,
      customerId,
      customerEmail,
      // 这里应该返回实际存储的客户数据
      // 格式由GDPR要求决定
      dataCollected: [],
    };
    
    console.log('[GDPR] Customer data collected for export:', customerData);
    
    return json({ 
      success: true, 
      message: 'Customer data export request received' 
    });
  } catch (error) {
    console.error('GDPR data request error:', error);
    return json({ error: 'Processing failed' }, { status: 500 });
  }
}

export async function loader() {
  return json({ error: 'Method not allowed' }, { status: 405 });
}
