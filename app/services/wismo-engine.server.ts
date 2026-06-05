/**
 * WISMO AI Conversation Engine v2.1
 * 
 * Speed-optimized for "world's best WISMO chatbot":
 * - Order status responses are INSTANT (0 AI calls)
 * - Smart heuristic intent detection (no extra AI round-trip)
 * - AI only for general conversational queries
 * - Quick reply buttons for guided interaction
 */
import { shopifyGraphQL } from '~/shopify.server';

// ─── Types ───────────────────────────────────────────────────────────

interface ChatContext {
  shop: string;
  accessToken: string;
  conversationId: string;
  customerEmail?: string;
  customerName?: string;
  customerLocale?: string;
  previousMessages: { role: string; content: string }[];
  settings: WismoSettings;
}

interface WismoSettings {
  greeting?: string;
  brandName?: string;
  autoReplyLanguage?: string;
  faqItems?: { question: string; answer: string }[];
}

interface OrderInfo {
  orderNumber: string;
  status: string;
  financialStatus: string;
  fulfillmentStatus: string | null;
  trackingCompany: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  createdAt: string;
  estimatedDelivery: string | null;
  lineItems: { title: string; quantity: number }[];
}

interface ChatResponse {
  reply: string;
  intent: 'wismo' | 'general' | 'handoff';
  quickReplies?: string[];
}

// ─── Intent Detection (fast heuristic, no AI call) ───────────────────

/**
 * Multi-layer intent detection — fast and smart:
 * 1. Handoff keywords → instant
 * 2. Order number / email detected → WISMO
 * 3. WISMO keywords → WISMO  
 * 4. Context from previous messages → WISMO (if we were just tracking orders)
 * 5. Otherwise → general (AI handles)
 */
export function detectIntent(
  message: string,
  previousMessages?: { role: string; content: string }[]
): { intent: 'wismo' | 'general' | 'handoff'; orderNumber?: string; email?: string } {
  const lower = message.toLowerCase().trim();
  
  // 1. Handoff
  const handoffWords = ['speak to human', 'talk to agent', 'real person', 'human agent', 'complaint', 'escalate', 'manager', '人工客服', '人工'];
  if (handoffWords.some(w => lower.includes(w))) return { intent: 'handoff' };

  // 2. Extract order number / email
  const orderNumber = extractOrderNumber(message);
  const email = extractEmail(message);
  if (orderNumber || email) return { intent: 'wismo', orderNumber, email };

  // 3. WISMO keywords (broad but accurate)
  const wismoWords = [
    // English
    'order', 'track', 'ship', 'deliver', 'where is my', 'when will', 'when\'s my',
    'package', 'parcel', 'arrive', 'dispatch', 'transit', 'on the way',
    'my purchase', 'bought', 'has it shipped', 'shipping status', 'delivery date',
    'fulfillment', 'eta', 'tracking number', 'track my', 'order status',
    // Chinese
    '订单', '快递', '发货', '物流', '到哪', '配送', '到货', '包裹', '追踪',
    // Spanish
    'pedido', 'envío', 'entrega', 'rastrear', 'dónde está mi',
    // French
    'commande', 'livraison', 'suivi', 'colis',
    // German
    'bestellung', 'lieferung', 'sendung', 'versand',
    // Japanese
    '注文', '配送', '追跡', '届く',
  ];
  if (wismoWords.some(w => lower.includes(w))) return { intent: 'wismo' };

  // 4. Context: if we were just tracking orders, treat follow-up as WISMO
  if (previousMessages && previousMessages.length > 0) {
    const lastBotMsg = [...previousMessages].reverse().find(m => m.role === 'assistant');
    if (lastBotMsg) {
      const botLower = lastBotMsg.content.toLowerCase();
      if (botLower.includes('order') || botLower.includes('track') || botLower.includes('📦')) {
        return { intent: 'wismo' };
      }
    }
  }

  // 5. Short messages like "yes", "sure", "ok" after a WISMO context
  const shortConfirmations = ['yes', 'yeah', 'sure', 'ok', 'yep', 'please', '对的', '是的', '好的'];
  if (lower.length < 15 && shortConfirmations.some(w => lower === w)) {
    if (previousMessages && previousMessages.length > 0) {
      const lastBotMsg = [...previousMessages].reverse().find(m => m.role === 'assistant');
      if (lastBotMsg && (lastBotMsg.content.toLowerCase().includes('order') || lastBotMsg.content.toLowerCase().includes('track'))) {
        return { intent: 'wismo' };
      }
    }
  }

  return { intent: 'general' };
}

function extractOrderNumber(message: string): string | undefined {
  // #1234 or plain 4-6 digit number
  const m = /#(\d{3,6})/.exec(message) || /order\s*#?\s*(\d{3,6})/i.exec(message);
  return m ? m[1] : undefined;
}

function extractEmail(message: string): string | undefined {
  const m = /[\w.-]+@[\w.-]+\.\w{2,}/.exec(message);
  return m ? m[0] : undefined;
}

// ─── Demo Data (realistic) ───────────────────────────────────────────

const DEMO_ORDERS: OrderInfo[] = [
  {
    orderNumber: '#1001',
    status: 'Shipped ✅',
    financialStatus: 'Paid',
    fulfillmentStatus: 'FULFILLED',
    trackingCompany: 'USPS',
    trackingNumber: '9400111899223100001',
    trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223100001',
    createdAt: '2026-06-03T10:30:00Z',
    estimatedDelivery: '2026-06-07T17:00:00Z',
    lineItems: [{ title: 'Wireless Earbuds Pro', quantity: 1 }],
  },
  {
    orderNumber: '#1002',
    status: 'Processing 📤',
    financialStatus: 'Paid',
    fulfillmentStatus: 'UNFULFILLED',
    trackingCompany: null,
    trackingNumber: null,
    trackingUrl: null,
    createdAt: '2026-06-05T08:15:00Z',
    estimatedDelivery: null,
    lineItems: [{ title: 'Premium Phone Case', quantity: 2 }],
  },
];

export function getDemoOrder(orderNumber?: string): OrderInfo | OrderInfo[] | undefined {
  if (orderNumber) {
    const num = orderNumber.replace('#', '');
    return DEMO_ORDERS.find(o => o.orderNumber === `#${num}`) || undefined;
  }
  return DEMO_ORDERS;
}

// ─── Order Lookup ────────────────────────────────────────────────────

export async function lookupOrderByNumber(
  shop: string,
  accessToken: string,
  orderNumber: string
): Promise<OrderInfo | null> {
  try {
    const name = orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`;
    const result = await shopifyGraphQL(shop, accessToken, `
      query GetOrder($query: String!) {
        orders(first: 1, query: $query) {
          edges {
            node {
              id name displayFulfillmentStatus displayFinancialStatus createdAt
              fulfillments(first: 5) {
                edges { node { trackingCompany trackingNumber trackingUrl status estimatedDeliveryAt } }
              }
              lineItems(first: 10) { edges { node { title quantity } } }
            }
          }
        }
      }
    `, { query: `name:${name}` });

    const order = result?.data?.orders?.edges?.[0]?.node;
    if (!order) return null;
    const f = order.fulfillments?.edges?.[0]?.node;

    return {
      orderNumber: order.name,
      status: fmtStatus(order.displayFulfillmentStatus),
      financialStatus: fmtFin(order.displayFinancialStatus),
      fulfillmentStatus: order.displayFulfillmentStatus,
      trackingCompany: f?.trackingCompany || null,
      trackingNumber: f?.trackingNumber || null,
      trackingUrl: f?.trackingUrl || null,
      createdAt: order.createdAt,
      estimatedDelivery: f?.estimatedDeliveryAt || null,
      lineItems: order.lineItems?.edges?.map((e: any) => ({ title: e.node.title, quantity: e.node.quantity })) || [],
    };
  } catch (e) {
    console.error('[WISMO] Order lookup error:', e);
    return null;
  }
}

export async function lookupOrdersByEmail(
  shop: string,
  accessToken: string,
  email: string
): Promise<OrderInfo[]> {
  try {
    const result = await shopifyGraphQL(shop, accessToken, `
      query GetOrders($query: String!) {
        orders(first: 5, query: $query) {
          edges {
            node {
              name displayFulfillmentStatus displayFinancialStatus createdAt
              fulfillments(first: 1) { edges { node { trackingCompany trackingNumber trackingUrl estimatedDeliveryAt } } }
              lineItems(first: 5) { edges { node { title quantity } } }
            }
          }
        }
      }
    `, { query: `email:${email}` });

    return (result?.data?.orders?.edges || []).map((edge: any) => {
      const o = edge.node, f = o.fulfillments?.edges?.[0]?.node;
      return {
        orderNumber: o.name, status: fmtStatus(o.displayFulfillmentStatus),
        financialStatus: fmtFin(o.displayFinancialStatus), fulfillmentStatus: o.displayFulfillmentStatus,
        trackingCompany: f?.trackingCompany || null, trackingNumber: f?.trackingNumber || null,
        trackingUrl: f?.trackingUrl || null, createdAt: o.createdAt, estimatedDelivery: f?.estimatedDeliveryAt || null,
        lineItems: o.lineItems?.edges?.map((e: any) => ({ title: e.node.title, quantity: e.node.quantity })) || [],
      };
    });
  } catch (e) {
    console.error('[WISMO] Email lookup error:', e);
    return [];
  }
}

// ─── Response Generation ─────────────────────────────────────────────

export async function generateResponse(
  userMessage: string,
  context: ChatContext,
  orderInfo?: OrderInfo | OrderInfo[]
): Promise<ChatResponse> {
  const intent = detectIntent(userMessage, context.previousMessages);

  // ⚡ INSTANT: WISMO + order found → formatted response, zero AI calls
  if (intent.intent === 'wismo' && orderInfo) {
    return {
      reply: fmtOrderResponse(orderInfo, context.settings),
      intent: 'wismo',
      quickReplies: ['Track another order', 'Need more help'],
    };
  }

  // WISMO but no order info → ask for it (still instant, no AI)
  if (intent.intent === 'wismo' && !orderInfo) {
    const brand = context.settings.brandName || 'our store';
    return {
      reply: `I'd love to help you track your order from **${brand}**! Just share your order number (like #1001) or the email you used when ordering. 📦`,
      intent: 'wismo',
      quickReplies: ['I have my order number', 'I used my email to order'],
    };
  }

  // Handoff → instant
  if (intent.intent === 'handoff') {
    return {
      reply: 'I\'ll connect you with a human agent right away. Please hold on for a moment. ⏳',
      intent: 'handoff',
    };
  }

  // General → DeepSeek (only case that calls AI)
  const reply = await aiResponse(userMessage, context);
  return {
    reply,
    intent: 'general',
    quickReplies: ['📦 Track my order', '💬 Talk to a human'],
  };
}

// ─── Order Formatting ────────────────────────────────────────────────

function fmtOrderResponse(orders: OrderInfo | OrderInfo[], settings: WismoSettings): string {
  if (!Array.isArray(orders)) return fmtOne(orders);
  if (orders.length === 0) return "I couldn't find any orders matching that. Could you double-check your order number or email? 🔍";
  if (orders.length === 1) return fmtOne(orders[0]);
  const brand = settings.brandName || 'our store';
  return `I found **${orders.length} orders** from ${brand}:\n\n` + orders.map((o, i) => fmtOne(o, i + 1)).join('\n');
}

function fmtOne(order: OrderInfo, idx?: number): string {
  const prefix = idx ? `**${idx}.** ` : '';
  let r = `${prefix}📦 **${order.orderNumber}** — ${order.status}\n`;

  if (order.lineItems?.length) {
    r += `   Items: ${order.lineItems.map(i => `${i.title} ×${i.quantity}`).join(', ')}\n`;
  }
  if (order.trackingCompany && order.trackingNumber) {
    r += `   🚚 ${order.trackingCompany}: ${order.trackingNumber}\n`;
    if (order.trackingUrl) r += `   → [Track package](${order.trackingUrl})\n`;
  }
  if (order.estimatedDelivery) {
    const d = new Date(order.estimatedDelivery).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    r += `   📅 Est. delivery: **${d}**\n`;
  }
  if (order.fulfillmentStatus === 'UNFULFILLED') {
    r += `   ⏳ Being prepared — we'll notify you once it ships!\n`;
  }
  return r.trim();
}

// ─── AI Response (only for general queries) ──────────────────────────

async function aiResponse(message: string, ctx: ChatContext): Promise<string> {
  const brand = ctx.settings.brandName || 'our store';
  const faq = ctx.settings.faqItems?.length
    ? `\n\nStore FAQ (answer from this if relevant):\n${ctx.settings.faqItems.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}`
    : '';

  try {
    return await callDeepSeek(
      `You are a friendly, concise customer service bot for ${brand}, a Shopify store. Your main job is order tracking. Rules: be warm but brief (2-3 sentences max). If asked about orders, ask for order number or email. Use store FAQ if available. If you can't help, offer to connect with a human. Never make up order or product details. Use emojis sparingly.${faq}`,
      message,
      ctx.previousMessages,
    );
  } catch {
    return "I'm having trouble right now. Would you like me to connect you with a human agent? 😊";
  }
}

// ─── DeepSeek API ────────────────────────────────────────────────────

async function callDeepSeek(system: string, message: string, history: { role: string; content: string }[]): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error('No API key');

  const messages = [
    { role: 'system', content: system },
    ...history.slice(-6).map(m => ({ role: m.role === 'customer' ? 'user' : 'assistant' as const, content: m.content })),
    { role: 'user' as const, content: message },
  ];

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages, max_tokens: 200, temperature: 0.7 }),
  });

  if (!res.ok) throw new Error('API error');
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't process that.";
}

// ─── Helpers ─────────────────────────────────────────────────────────

function fmtStatus(s: string): string {
  return ({ FULFILLED: 'Shipped ✅', UNFULFILLED: 'Processing 📤', PARTIALLY_FULFILLED: 'Partially Shipped 📦', RESTOCKED: 'Returned ↩️', PENDING: 'Pending ⏳' })[s] || s;
}
function fmtFin(s: string): string {
  return ({ PAID: 'Paid', PENDING: 'Payment Pending', REFUNDED: 'Refunded', PARTIALLY_REFUNDED: 'Partially Refunded', VOIDED: 'Cancelled' })[s] || s;
}
