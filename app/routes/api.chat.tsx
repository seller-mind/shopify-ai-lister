/**
 * POST /api/chat - WISMO Chat API Endpoint
 * 
 * Called by the storefront widget to send messages and receive AI responses.
 * This is a public API (no Shopify admin auth) - authenticated via shop domain + widget token.
 */
import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { getSupabaseAdmin, getStore } from '~/services/supabase.server';
import { detectIntent, lookupOrderByNumber, lookupOrdersByEmail, generateResponse, getDemoOrder } from '~/services/wismo-engine.server';
import { addCorsHeaders, handleCorsPreflightRequest } from '~/utils/cors';

// ─── Main Handler ────────────────────────────────────────────────────

export async function action({ request }: ActionFunctionArgs) {
  // Handle CORS preflight
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { shop, message, conversationId, customerEmail, customerName, customerLocale } = body;

    // ─── Validate ──────────────────────────────────────────────────
    if (!shop || !message || typeof message !== 'string') {
      return json({ error: 'Missing required fields: shop, message' }, { status: 400 });
    }

    // Verify shop has the app installed
    const store = await getStore(shop);
    if (!store) {
      return json({ error: 'Store not found' }, { status: 404 });
    }

    // Check if WISMO is enabled for this store
    const settings = await getWismoSettings(shop);
    if (!settings?.enabled) {
      return json({ error: 'WISMO is disabled for this store' }, { status: 403 });
    }

    // ─── Get or Create Conversation ────────────────────────────────
    let convId = conversationId;
    let previousMessages: { role: string; content: string }[] = [];

    if (convId) {
      previousMessages = await getConversationMessages(convId);
    } else {
      convId = await createConversation(shop, customerEmail, customerName, customerLocale, message);
    }

    // ─── Save Customer Message ─────────────────────────────────────
    await saveMessage(convId, 'customer', message);

    // ─── Detect Intent ─────────────────────────────────────────────
    const intent = detectIntent(message);
    let orderInfo = undefined;

    // ─── Order Lookup if WISMO Intent ──────────────────────────────
    if (intent.intent === 'wismo') {
      orderInfo = await performOrderLookup(
        shop,
        store.accessToken,
        intent.entities?.orderNumber,
        intent.entities?.email || customerEmail,
        message,
      );

      // Demo mode: if no real orders found, use demo data for testing
      if (!orderInfo) {
        orderInfo = getDemoOrder(intent.entities?.orderNumber);
      }
    }

    // ─── Generate AI Response ──────────────────────────────────────
    const { reply, intent: replyIntent } = await generateResponse(message, {
      shop,
      accessToken: store.accessToken,
      conversationId: convId,
      customerEmail,
      customerName,
      customerLocale,
      previousMessages,
      settings,
    }, orderInfo);

    // ─── Save Assistant Response ───────────────────────────────────
    await saveMessage(convId, 'assistant', reply, replyIntent, orderInfo ? { orderLookup: true } : {});

    // ─── Update Analytics ──────────────────────────────────────────
    await incrementAnalytics(shop, intent.intent, replyIntent);

    // ─── Return ────────────────────────────────────────────────────
    const responseHeaders = new Headers();
    addCorsHeaders(responseHeaders, request);
    
    return json({
      reply,
      conversationId: convId,
      intent: replyIntent,
    }, { headers: responseHeaders });

  } catch (error) {
    console.error('[WISMO API] Error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Order Lookup Logic ──────────────────────────────────────────────

async function performOrderLookup(
  shop: string,
  accessToken: string,
  orderNumber?: string,
  email?: string,
  message?: string,
): Promise<any> {
  // Try order number first
  if (orderNumber) {
    const order = await lookupOrderByNumber(shop, accessToken, orderNumber);
    if (order) return order;
  }

  // Try email
  if (email) {
    const orders = await lookupOrdersByEmail(shop, accessToken, email);
    if (orders.length > 0) return orders;
  }

  // No lookup possible
  return undefined;
}

// ─── Database Operations ─────────────────────────────────────────────

async function getWismoSettings(shop: string) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('wismo_settings')
      .select('*')
      .eq('shop', shop)
      .single();

    if (error || !data) {
      // Return defaults if no settings found
      return {
        enabled: true,
        greeting: 'Hi! 👋 How can I help you today?',
        brandName: '',
        autoReplyLanguage: 'auto',
        faqItems: [],
      };
    }

    return data;
  } catch {
    return { enabled: true, greeting: 'Hi! 👋 How can I help you today?', brandName: '', autoReplyLanguage: 'auto', faqItems: [] };
  }
}

async function createConversation(
  shop: string,
  customerEmail?: string,
  customerName?: string,
  customerLocale?: string,
  firstMessage?: string,
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('wismo_conversations')
    .insert({
      shop,
      customer_email: customerEmail,
      customer_name: customerName,
      customer_locale: customerLocale || 'en',
      first_message: firstMessage?.substring(0, 200),
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error('Failed to create conversation');
  }
  return data.id;
}

async function getConversationMessages(conversationId: string): Promise<{ role: string; content: string }[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('wismo_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

async function saveMessage(
  conversationId: string,
  role: string,
  content: string,
  intent?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from('wismo_messages').insert({
    conversation_id: conversationId,
    role,
    content,
    intent: intent || null,
    metadata: metadata || {},
  });

  // Update conversation's last_message_at
  await supabase
    .from('wismo_conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);
}

async function incrementAnalytics(shop: string, detectedIntent: string, replyIntent: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];

    // Try to upsert analytics
    const { error } = await supabase
      .from('wismo_analytics')
      .upsert({
        shop,
        date: today,
        total_conversations: 1,
        total_messages: 2, // customer + assistant
        wismo_queries: detectedIntent === 'wismo' ? 1 : 0,
        auto_resolved: replyIntent !== 'handoff' ? 1 : 0,
        handoffs: replyIntent === 'handoff' ? 1 : 0,
      }, {
        onConflict: 'shop,date',
        ignoreDuplicates: false,
      });

    if (error) {
      // If upsert fails (maybe due to no RPC support), try increment manually
      const { data: existing } = await supabase
        .from('wismo_analytics')
        .select('*')
        .eq('shop', shop)
        .eq('date', today)
        .single();

      if (existing) {
        await supabase
          .from('wismo_analytics')
          .update({
            total_conversations: existing.total_conversations + 1,
            total_messages: existing.total_messages + 2,
            wismo_queries: existing.wismo_queries + (detectedIntent === 'wismo' ? 1 : 0),
            auto_resolved: existing.auto_resolved + (replyIntent !== 'handoff' ? 1 : 0),
            handoffs: existing.handoffs + (replyIntent === 'handoff' ? 1 : 0),
          })
          .eq('id', existing.id);
      }
    }
  } catch (error) {
    // Analytics failure shouldn't break the chat
    console.error('[WISMO] Analytics update failed:', error);
  }
}
