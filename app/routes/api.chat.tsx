/**
 * POST /api/chat - WISMO Chat API Endpoint v2
 * 
 * Speed-optimized: order status responses are instant (no AI call)
 * Supports quick reply buttons for faster customer interaction
 */
import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { getSupabaseAdmin, getStore } from '~/services/supabase.server';
import { detectIntentAI, lookupOrderByNumber, lookupOrdersByEmail, generateResponse, getDemoOrder } from '~/services/wismo-engine.server';
import { addCorsHeaders, handleCorsPreflightRequest } from '~/utils/cors';

export async function action({ request }: ActionFunctionArgs) {
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { shop, message, conversationId, customerEmail, customerName, customerLocale } = body;

    if (!shop || !message || typeof message !== 'string') {
      return json({ error: 'Missing required fields: shop, message' }, { status: 400 });
    }

    const store = await getStore(shop);
    if (!store) {
      return json({ error: 'Store not found' }, { status: 404 });
    }

    const settings = await getWismoSettings(shop);
    if (!settings?.enabled) {
      return json({ error: 'WISMO is disabled for this store' }, { status: 403 });
    }

    // Get or create conversation
    let convId = conversationId;
    let previousMessages: { role: string; content: string }[] = [];

    if (convId) {
      previousMessages = await getConversationMessages(convId);
    } else {
      convId = await createConversation(shop, customerEmail, customerName, customerLocale, message);
    }

    // Save customer message
    await saveMessage(convId, 'customer', message);

    // Smart intent detection
    const intent = await detectIntentAI(message);
    let orderInfo = undefined;

    // Order lookup for WISMO intent
    if (intent.intent === 'wismo') {
      orderInfo = await performOrderLookup(
        shop,
        store.accessToken,
        intent.orderNumber,
        intent.email || customerEmail,
      );

      // Demo mode fallback
      if (!orderInfo) {
        orderInfo = getDemoOrder(intent.orderNumber);
      }
    }

    // Generate response (fast path for order queries)
    const result = await generateResponse(message, {
      shop,
      accessToken: store.accessToken,
      conversationId: convId,
      customerEmail,
      customerName,
      customerLocale,
      previousMessages,
      settings,
    }, orderInfo);

    // Save assistant response
    await saveMessage(convId, 'assistant', result.reply, result.intent, orderInfo ? { orderLookup: true } : {});

    // Update analytics
    await incrementAnalytics(shop, intent.intent, result.intent);

    const responseHeaders = new Headers();
    addCorsHeaders(responseHeaders, request);

    return json({
      reply: result.reply,
      conversationId: convId,
      intent: result.intent,
      quickReplies: result.quickReplies || [],
    }, { headers: responseHeaders });

  } catch (error) {
    console.error('[WISMO API] Error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Order Lookup ────────────────────────────────────────────────────

async function performOrderLookup(
  shop: string,
  accessToken: string,
  orderNumber?: string,
  email?: string,
): Promise<any> {
  if (orderNumber) {
    const order = await lookupOrderByNumber(shop, accessToken, orderNumber);
    if (order) return order;
  }
  if (email) {
    const orders = await lookupOrdersByEmail(shop, accessToken, email);
    if (orders.length > 0) return orders;
  }
  return undefined;
}

// ─── Database Operations ─────────────────────────────────────────────

async function getWismoSettings(shop: string) {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('wismo_settings')
      .select('*')
      .eq('shop', shop)
      .single();
    return data || { enabled: true, greeting: 'Hi! 👋 How can I help you track your order?', brandName: '', autoReplyLanguage: 'auto', faqItems: [] };
  } catch {
    return { enabled: true, greeting: 'Hi! 👋 How can I help you track your order?', brandName: '', autoReplyLanguage: 'auto', faqItems: [] };
  }
}

async function createConversation(shop: string, customerEmail?: string, customerName?: string, customerLocale?: string, firstMessage?: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('wismo_conversations')
    .insert({ shop, customer_email: customerEmail, customer_name: customerName, customer_locale: customerLocale || 'en', first_message: firstMessage?.substring(0, 200) })
    .select('id')
    .single();
  if (error || !data) throw new Error('Failed to create conversation');
  return data.id;
}

async function getConversationMessages(conversationId: string): Promise<{ role: string; content: string }[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('wismo_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);
    return data || [];
  } catch {
    return [];
  }
}

async function saveMessage(conversationId: string, role: string, content: string, intent?: string, metadata?: Record<string, unknown>): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from('wismo_messages').insert({ conversation_id: conversationId, role, content, intent: intent || null, metadata: metadata || {} });
  await supabase.from('wismo_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId);
}

async function incrementAnalytics(shop: string, detectedIntent: string, replyIntent: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase.from('wismo_analytics').select('*').eq('shop', shop).eq('date', today).single();
    if (existing) {
      await supabase.from('wismo_analytics').update({
        total_conversations: existing.total_conversations + 1,
        total_messages: existing.total_messages + 2,
        wismo_queries: existing.wismo_queries + (detectedIntent === 'wismo' ? 1 : 0),
        auto_resolved: existing.auto_resolved + (replyIntent !== 'handoff' ? 1 : 0),
        handoffs: existing.handoffs + (replyIntent === 'handoff' ? 1 : 0),
      }).eq('id', existing.id);
    } else {
      await supabase.from('wismo_analytics').insert({
        shop, date: today,
        total_conversations: 1, total_messages: 2,
        wismo_queries: detectedIntent === 'wismo' ? 1 : 0,
        auto_resolved: replyIntent !== 'handoff' ? 1 : 0,
        handoffs: replyIntent === 'handoff' ? 1 : 0,
      });
    }
  } catch (error) {
    console.error('[WISMO] Analytics update failed:', error);
  }
}
