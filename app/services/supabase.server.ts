/**
 * Supabase 客户端配置
 * 
 * 连接已有的Supabase项目: sdeduzqplvsyttvnolxm.supabase.co
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 环境变量
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * 创建Supabase客户端（公开访问）
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * 创建Supabase客户端（服务端/管理权限）
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * 存储Session到数据库
 */
export async function storeSessionInDB(session: { id: string; shop: string; state: string; isOnline: boolean; accessToken: string; scope?: string }): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase.from('shopify_sessions').upsert({
      id: session.id,
      shop: session.shop,
      state: session.state,
      is_online: session.isOnline,
      access_token: session.accessToken,
      scope: session.scope,
      updated_at: new Date().toISOString(),
    });
    
    if (error) {
      console.error('Error storing session:', JSON.stringify(error));
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error storing session:', error);
    return false;
  }
}

/**
 * 从数据库加载Session
 */
export async function loadSessionFromDB(sessionId: string): Promise<{
  id: string;
  shop: string;
  state: string;
  isOnline: boolean;
  accessToken: string;
  scope?: string;
} | null> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('shopify_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      id: data.id,
      shop: data.shop,
      state: data.state,
      isOnline: data.is_online,
      accessToken: data.access_token,
      scope: data.scope,
    };
  } catch (error) {
    console.error('Error loading session:', error);
    return null;
  }
}

/**
 * 从数据库删除Session
 */
export async function deleteSessionFromDB(sessionId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase
      .from('shopify_sessions')
      .delete()
      .eq('id', sessionId);
    
    return !error;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
}

/**
 * 存储/更新店铺信息
 */
export async function upsertStore(shop: string, accessToken: string, isOnline: boolean): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('stores')
      .upsert({
        shop: shop,
        access_token: accessToken,
        is_online: isOnline,
        installed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error upserting store:', error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error('Error upserting store:', error);
    return null;
  }
}

/**
 * 获取店铺信息
 */
export async function getStore(shop: string): Promise<{
  id: string;
  shop: string;
  accessToken: string;
  plan?: string;
  installedAt: string;
} | null> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('shop', shop)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      id: data.id,
      shop: data.shop,
      accessToken: data.access_token,
      plan: data.plan,
      installedAt: data.installed_at,
    };
  } catch (error) {
    console.error('Error getting store:', error);
    return null;
  }
}

/**
 * 删除店铺及关联数据
 */
export async function deleteStore(shop: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    
    // Get store ID for potential future cleanup
    const store = await getStore(shop);
    
    // 删除WISMO相关数据（含客户PII：邮箱、姓名、对话内容）
    // 必须先删子表（有外键引用的），再删父表
    const wismoConvIds = await getWismoConvIds(shop);
    if (wismoConvIds.length > 0) {
      await supabase.from('wismo_messages').delete().in('conversation_id', wismoConvIds);
      await supabase.from('wismo_feedback').delete().in('conversation_id', wismoConvIds);
    }
    await supabase.from('wismo_conversations').delete().eq('shop', shop);
    await supabase.from('wismo_analytics').delete().eq('shop', shop);
    await supabase.from('wismo_settings').delete().eq('shop', shop);
    
    // 删除sessions
    await supabase.from('shopify_sessions').delete().eq('shop', shop);
    
    // 删除store
    const { error } = await supabase.from('stores').delete().eq('shop', shop);
    
    console.log(`[GDPR] ✅ All data deleted for ${shop} (including WISMO conversations, messages, feedback, analytics, settings)`);
    return !error;
  } catch (error) {
    console.error('Error deleting store:', error);
    return false;
  }
}

/**
 * 获取WISMO对话ID列表（用于级联删除消息和反馈）
 */
async function getWismoConvIds(shop: string): Promise<string[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('wismo_conversations')
      .select('id')
      .eq('shop', shop);
    return data?.map((d: { id: string }) => d.id) || [];
  } catch {
    return [];
  }
}

// Legacy generation functions (recordGeneration, getGenerations, getMonthlyUsage)
// removed in v2.1.3 — these were from the old AI Lister product and are no longer called.
