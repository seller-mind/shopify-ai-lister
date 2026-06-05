/**
 * POST /api/chat - WISMO Chat API v2.1
 * 
 * Speed-optimized: sync intent detection, instant order responses
 */
import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { getSupabaseAdmin, getStore } from '~/services/supabase.server';
import { detectIntent, lookupOrderByNumber, lookupOrdersByEmail, generateResponse, getDemoOrder } from '~/services/wismo-engine.server';
import { addCorsHeaders, handleCorsPreflightRequest } from '~/utils/cors';

export async function action({ request }: ActionFunctionArgs) {
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  try {
    const body = await request.json();
    const { shop, message, conversationId, customerEmail, customerName, customerLocale } = body;

    if (!shop || !message) return json({ error: 'Missing shop or message' }, { status: 400 });

    const store = await getStore(shop);
    if (!store) return json({ error: 'Store not found' }, { status: 404 });

    const settings = await getSettings(shop);
    if (!settings?.enabled) return json({ error: 'WISMO disabled' }, { status: 403 });

    // Get/create conversation
    let convId = conversationId;
    let prev: { role: string; content: string }[] = [];
    if (convId) {
      prev = await getMessages(convId);
    } else {
      convId = await createConv(shop, customerEmail, customerName, customerLocale, message);
    }

    await saveMsg(convId, 'customer', message);

    // Sync intent detection (no AI call)
    const intent = detectIntent(message, prev);
    let orderInfo;

    if (intent.intent === 'wismo') {
      orderInfo = await lookup(
        shop, store.accessToken,
        intent.orderNumber,
        intent.email || customerEmail,
      );
      if (!orderInfo) orderInfo = getDemoOrder(intent.orderNumber);
    }

    // Generate response
    const result = await generateResponse(message, {
      shop, accessToken: store.accessToken, conversationId: convId,
      customerEmail, customerName, customerLocale, previousMessages: prev, settings,
    }, orderInfo);

    await saveMsg(convId, 'assistant', result.reply, result.intent, orderInfo ? { orderLookup: true } : {});
    await bumpAnalytics(shop, intent.intent, result.intent);

    const h = new Headers();
    addCorsHeaders(h, request);
    return json({ reply: result.reply, conversationId: convId, intent: result.intent, quickReplies: result.quickReplies || [] }, { headers: h });

  } catch (e) {
    console.error('[WISMO] Error:', e);
    return json({ error: 'Internal error' }, { status: 500 });
  }
}

async function lookup(shop: string, token: string, orderNumber?: string, email?: string) {
  if (orderNumber) { const o = await lookupOrderByNumber(shop, token, orderNumber); if (o) return o; }
  if (email) { const o = await lookupOrdersByEmail(shop, token, email); if (o.length) return o; }
  return undefined;
}

async function getSettings(shop: string) {
  try {
    const { data } = await getSupabaseAdmin().from('wismo_settings').select('*').eq('shop', shop).single();
    return data || { enabled: true, greeting: 'Track your order in seconds', brandName: '', autoReplyLanguage: 'auto', faqItems: [] };
  } catch { return { enabled: true, greeting: 'Track your order in seconds', brandName: '', autoReplyLanguage: 'auto', faqItems: [] }; }
}

async function createConv(shop: string, email?: string, name?: string, locale?: string, msg?: string) {
  const { data, error } = await getSupabaseAdmin().from('wismo_conversations')
    .insert({ shop, customer_email: email, customer_name: name, customer_locale: locale || 'en', first_message: msg?.substring(0, 200) })
    .select('id').single();
  if (error || !data) throw new Error('Conv creation failed');
  return data.id;
}

async function getMessages(id: string) {
  try { const { data } = await getSupabaseAdmin().from('wismo_messages').select('role, content').eq('conversation_id', id).order('created_at', { ascending: true }).limit(20); return data || []; } catch { return []; }
}

async function saveMsg(id: string, role: string, content: string, intent?: string, meta?: any) {
  const db = getSupabaseAdmin();
  await db.from('wismo_messages').insert({ conversation_id: id, role, content, intent: intent || null, metadata: meta || {} });
  await db.from('wismo_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', id);
}

async function bumpAnalytics(shop: string, detected: string, replied: string) {
  try {
    const db = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];
    const { data: ex } = await db.from('wismo_analytics').select('*').eq('shop', shop).eq('date', today).single();
    if (ex) {
      await db.from('wismo_analytics').update({
        total_conversations: ex.total_conversations + 1, total_messages: ex.total_messages + 2,
        wismo_queries: ex.wismo_queries + (detected === 'wismo' ? 1 : 0),
        auto_resolved: ex.auto_resolved + (replied !== 'handoff' ? 1 : 0),
        handoffs: ex.handoffs + (replied === 'handoff' ? 1 : 0),
      }).eq('id', ex.id);
    } else {
      await db.from('wismo_analytics').insert({
        shop, date: today, total_conversations: 1, total_messages: 2,
        wismo_queries: detected === 'wismo' ? 1 : 0,
        auto_resolved: replied !== 'handoff' ? 1 : 0,
        handoffs: replied === 'handoff' ? 1 : 0,
      });
    }
  } catch (e) { console.error('[WISMO] Analytics error:', e); }
}
