/**
 * OAuth认证回调处理
 * 
 * 处理Shopify OAuth安装流程
 */
import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { shopify } from '~/shopify.server';

/**
 * OAuth回调处理
 * 
 * 流程：
 * 1. Shopify重定向用户到 /auth/callback?code=xxx&hmac=xxx&shop=xxx
 * 2. 服务器用code换取access_token
 * 3. 存储session并重定向到应用首页
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  
  // 检查是否为安装完成后的回调
  const shop = url.searchParams.get('shop');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const embedded = url.searchParams.get('embedded');
  
  if (!shop) {
    // 没有shop参数，可能是直接访问
    throw new Error('Missing shop parameter');
  }
  
  try {
    // 使用官方authenticate.admin处理OAuth
    // 这会完成token交换并存储session
    await shopify.authenticate.admin(request);
    
    // 保存店铺信息到数据库
    const { upsertStore } = await import('~/services/supabase.server');
    const session = await shopify.getSession(shop);
    
    if (session) {
      await upsertStore(shop, session.accessToken, session.isOnline);
    }
    
    // 确定重定向目标
    let redirectTarget = '/app';
    
    // 如果是嵌入式App，需要返回特殊格式
    if (embedded === '1') {
      // 重定向到Shopify Admin中的应用
      return redirect(`https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}/`);
    }
    
    return redirect(redirectTarget);
  } catch (error) {
    console.error('Auth callback error:', error);
    
    // 重定向到错误页面
    return redirect(`/auth/error?shop=${shop}`);
  }
}
