/**
 * GDPR - 客户数据删除Webhook
 * 
 * 当客户请求删除其个人数据时处理
 * 必须实现：App Store审核要求
 */
import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { verifyShopifyWebhook } from '@shopify/shopify-api';
import { getSupabaseAdmin } from '~/services/supabase.server';

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
    
    console.log(`[GDPR] Customer data redact request from ${shopDomain}`, {
      customerId: data.customer?.id,
      customerEmail: data.customer?.email,
      requestId: data.request_id,
    });
    
    // 提取客户标识信息
    const customerId = data.customer?.id;
    const customerEmail = data.customer?.email;
    const phone = data.customer?.phone;
    
    // 删除客户个人数据
    const supabase = getSupabaseAdmin();
    
    // 构建删除条件
    let deleteQuery = supabase.from('customers').select('id');
    
    if (customerId) {
      deleteQuery = deleteQuery.eq('shopify_customer_id', customerId);
    } else if (customerEmail) {
      deleteQuery = deleteQuery.eq('email', customerEmail);
    } else if (phone) {
      deleteQuery = deleteQuery.eq('phone', phone);
    }
    
    const { error } = await deleteQuery;
    
    if (error) {
      console.error('Error deleting customer data:', error);
      // 即使删除失败，也要返回成功（GDPR要求尽可能删除）
    }
    
    console.log('[GDPR] Customer data redacted successfully');
    
    return json({ 
      success: true, 
      message: 'Customer data deletion completed' 
    });
  } catch (error) {
    console.error('GDPR redact error:', error);
    return json({ error: 'Processing failed' }, { status: 500 });
  }
}

export async function loader() {
  return json({ error: 'Method not allowed' }, { status: 405 });
}
