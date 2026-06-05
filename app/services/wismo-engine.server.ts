/**
 * WISMO AI Conversation Engine v2
 * 
 * Redesigned for speed and simplicity:
 * - Order status responses are instant (no AI call needed)
 * - AI only used for general/complex queries
 * - Better intent detection via AI
 * - Quick action buttons for common tasks
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
  orderData?: any;
}

// ─── Smart Intent Detection (AI-powered) ─────────────────────────────

export async function detectIntentAI(message: string): Promise<{ intent: 'wismo' | 'general' | 'handoff'; orderNumber?: string; email?: string }> {
  const lowerMsg = message.toLowerCase().trim();
  
  // Fast path: obvious handoff keywords
  const handoffKeywords = ['speak to human', 'talk to agent', 'real person', 'complaint', 'escalate', 'manager', '人工客服', '人工'];
  for (const kw of handoffKeywords) {
    if (lowerMsg.includes(kw)) return { intent: 'handoff' };
  }

  // Fast path: extract order number if present
  const orderNumber = extractOrderNumber(message);
  const email = extractEmail(message);

  // Quick keyword check for obvious WISMO intent
  const wismoKeywords = ['order', 'track', 'ship', 'deliver', 'where is my', 'when will', 'package', '物流', '订单', '快递', '发货', '到哪'];
  const isWismoLike = wismoKeywords.some(kw => lowerMsg.includes(kw));

  if (isWismoLike || orderNumber || email) {
    return { intent: 'wismo', orderNumber, email };
  }

  // For ambiguous messages, use AI to classify (but keep it fast)
  // Only for short messages that could be WISMO but aren't obvious
  if (message.length < 100) {
    try {
      const classification = await classifyWithAI(message);
      if (classification.intent === 'wismo') {
        return { intent: 'wismo', orderNumber: classification.orderNumber, email: classification.email };
      }
      return classification;
    } catch {
      // If AI classification fails, default to general
      return { intent: 'general' };
    }
  }

  return { intent: 'general' };
}

async function classifyWithAI(message: string): Promise<{ intent: 'wismo' | 'general' | 'handoff'; orderNumber?: string; email?: string }> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return { intent: 'general' };

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `Classify this customer message for an e-commerce chatbot. Reply with ONLY a JSON object:
- If about order status/tracking/shipping/delivery: {"intent":"wismo","orderNumber":"#1234 or null","email":"email or null"}
- If asking to speak with human: {"intent":"handoff"}
- Otherwise: {"intent":"general"}
Extract order number (like #1001) or email if present. Be aggressive about WISMO - if there's ANY mention of purchases, orders, or deliveries, classify as wismo.`
        },
        { role: 'user', content: message }
      ],
      max_tokens: 80,
      temperature: 0,
    }),
  });

  if (!response.ok) return { intent: 'general' };
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() || '';
  
  try {
    // Parse JSON from response
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        intent: parsed.intent === 'handoff' ? 'handoff' : parsed.intent === 'wismo' ? 'wismo' : 'general',
        orderNumber: parsed.orderNumber || undefined,
        email: parsed.email || undefined,
      };
    }
  } catch { /* parse failed */ }

  return { intent: 'general' };
}

// Legacy sync detection for backward compat
export function detectIntent(message: string) {
  const lowerMsg = message.toLowerCase().trim();
  const handoffKeywords = ['speak to human', 'talk to agent', 'real person', 'complaint', 'escalate', 'manager', '人工客服'];
  for (const kw of handoffKeywords) {
    if (lowerMsg.includes(kw)) return { intent: 'handoff' as const, confidence: 0.9 };
  }
  const wismoKeywords = ['order', 'track', 'ship', 'deliver', 'where is my', 'when will', 'package', '物流', '订单', '快递', '发货'];
  const isWismo = wismoKeywords.some(kw => lowerMsg.includes(kw));
  if (isWismo) {
    return { intent: 'wismo' as const, confidence: 0.85, entities: { orderNumber: extractOrderNumber(message), email: extractEmail(message) } };
  }
  return { intent: 'general' as const, confidence: 0.5 };
}

function extractOrderNumber(message: string): string | undefined {
  const patterns = [
    /#?(\d{4,6})/g,
    /order\s*#?\s*(\d{4,6})/i,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(message);
    if (match) return match[1];
  }
  return undefined;
}

function extractEmail(message: string): string | undefined {
  const match = /[\w.-]+@[\w.-]+\.\w+/.exec(message);
  return match ? match[0] : undefined;
}

// ─── Demo Data ──────────────────────────────────────────────────────

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
    lineItems: [{ title: 'Wireless Earbuds', quantity: 1 }],
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
    lineItems: [{ title: 'Phone Case', quantity: 2 }],
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
              id
              name
              displayFulfillmentStatus
              displayFinancialStatus
              createdAt
              fulfillments(first: 5) {
                edges {
                  node {
                    trackingCompany
                    trackingNumber
                    trackingUrl
                    status
                    estimatedDeliveryAt
                    fulfillmentLineItems(first: 10) {
                      edges {
                        node {
                          lineItem {
                            title
                            quantity
                          }
                        }
                      }
                    }
                  }
                }
              }
              lineItems(first: 10) {
                edges {
                  node {
                    title
                    quantity
                  }
                }
              }
            }
          }
        }
      }
    `, { query: `name:${name}` });

    const edges = result?.data?.orders?.edges;
    if (!edges || edges.length === 0) return null;

    const order = edges[0].node;
    const firstFulfillment = order.fulfillments?.edges?.[0]?.node;

    return {
      orderNumber: order.name,
      status: formatOrderStatus(order.displayFulfillmentStatus),
      financialStatus: formatFinancialStatus(order.displayFinancialStatus),
      fulfillmentStatus: order.displayFulfillmentStatus,
      trackingCompany: firstFulfillment?.trackingCompany || null,
      trackingNumber: firstFulfillment?.trackingNumber || null,
      trackingUrl: firstFulfillment?.trackingUrl || null,
      createdAt: order.createdAt,
      estimatedDelivery: firstFulfillment?.estimatedDeliveryAt || null,
      lineItems: order.lineItems?.edges?.map((e: any) => ({ title: e.node.title, quantity: e.node.quantity })) || [],
    };
  } catch (error) {
    console.error('[WISMO] Order lookup failed:', error);
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
              name
              displayFulfillmentStatus
              displayFinancialStatus
              createdAt
              fulfillments(first: 1) {
                edges {
                  node {
                    trackingCompany
                    trackingNumber
                    trackingUrl
                    estimatedDeliveryAt
                  }
                }
              }
              lineItems(first: 5) {
                edges {
                  node {
                    title
                    quantity
                  }
                }
              }
            }
          }
        }
      }
    `, { query: `email:${email}` });

    const edges = result?.data?.orders?.edges || [];
    return edges.map((edge: any) => {
      const order = edge.node;
      const fulfillment = order.fulfillments?.edges?.[0]?.node;
      return {
        orderNumber: order.name,
        status: formatOrderStatus(order.displayFulfillmentStatus),
        financialStatus: formatFinancialStatus(order.displayFinancialStatus),
        fulfillmentStatus: order.displayFulfillmentStatus,
        trackingCompany: fulfillment?.trackingCompany || null,
        trackingNumber: fulfillment?.trackingNumber || null,
        trackingUrl: fulfillment?.trackingUrl || null,
        createdAt: order.createdAt,
        estimatedDelivery: fulfillment?.estimatedDeliveryAt || null,
        lineItems: order.lineItems?.edges?.map((e: any) => ({ title: e.node.title, quantity: e.node.quantity })) || [],
      };
    });
  } catch (error) {
    console.error('[WISMO] Order lookup by email failed:', error);
    return [];
  }
}

// ─── Response Generation (Speed-Optimized) ───────────────────────────

export async function generateResponse(
  userMessage: string,
  context: ChatContext,
  orderInfo?: OrderInfo | OrderInfo[]
): Promise<ChatResponse> {
  const intent = await detectIntentAI(userMessage);
  
  // FAST PATH: WISMO with order info → instant formatted response (no AI call)
  if (intent.intent === 'wismo' && orderInfo) {
    const reply = formatOrderResponse(orderInfo, context.settings);
    return {
      reply,
      intent: 'wismo',
      quickReplies: ['Track another order', 'Need more help'],
    };
  }
  
  // WISMO without order info → ask for details (still fast, no AI for simple ask)
  if (intent.intent === 'wismo' && !orderInfo) {
    const brandName = context.settings.brandName || 'our store';
    return {
      reply: `I'd love to help you track your order from ${brandName}! Could you share your order number (like #1001) or the email you used? 📦`,
      intent: 'wismo',
      quickReplies: ['I have my order number', 'I used my email'],
    };
  }
  
  // Handoff → instant response
  if (intent.intent === 'handoff') {
    return {
      reply: `I'll connect you with a human agent right away. Please hold on for a moment. ⏳`,
      intent: 'handoff',
    };
  }
  
  // General → use DeepSeek for conversational responses
  const reply = await generateAIResponse(userMessage, context);
  return {
    reply,
    intent: 'general',
    quickReplies: ['Track my order', 'Shipping policy', 'Talk to a human'],
  };
}

function formatOrderResponse(orderInfo: OrderInfo | OrderInfo[], settings: WismoSettings): string {
  if (Array.isArray(orderInfo)) {
    if (orderInfo.length === 0) {
      return "I couldn't find any orders matching that information. Could you double-check your order number or email? 🔍";
    }
    if (orderInfo.length === 1) return formatSingleOrder(orderInfo[0], settings);
    
    const brandName = settings.brandName || 'our store';
    let reply = `I found **${orderInfo.length} orders** from ${brandName}:\n\n`;
    orderInfo.forEach((order, i) => {
      reply += formatSingleOrder(order, settings, i + 1) + '\n';
    });
    return reply;
  }
  return formatSingleOrder(orderInfo, settings);
}

function formatSingleOrder(order: OrderInfo, settings: WismoSettings, index?: number): string {
  const prefix = index ? `**Order ${index}:** ` : '';
  
  let reply = `${prefix}📦 **${order.orderNumber}** — ${order.status}\n`;
  
  // Items
  if (order.lineItems?.length) {
    const items = order.lineItems.map(i => `${i.title} × ${i.quantity}`).join(', ');
    reply += `   Items: ${items}\n`;
  }
  
  // Tracking info
  if (order.trackingCompany && order.trackingNumber) {
    reply += `   🚚 ${order.trackingCompany}: ${order.trackingNumber}\n`;
    if (order.trackingUrl) {
      reply += `   → [Track package](${order.trackingUrl})\n`;
    }
  }
  
  // Estimated delivery
  if (order.estimatedDelivery) {
    const date = new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
    reply += `   📅 Estimated: **${date}**\n`;
  }
  
  // Unfulfilled note
  if (order.fulfillmentStatus === 'UNFULFILLED') {
    reply += `   ⏳ Your order is being prepared and will ship soon!\n`;
  }
  
  return reply.trim();
}

async function generateAIResponse(userMessage: string, context: ChatContext): Promise<string> {
  const brandName = context.settings.brandName || 'our store';
  const faqContext = context.settings.faqItems?.length
    ? `\n\nStore FAQ (use when relevant):\n${context.settings.faqItems.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}`
    : '';
  
  const systemPrompt = `You are a friendly, concise customer service chatbot for ${brandName}. 

Your main job: help customers track orders (WISMO). You can also answer general questions.

Rules:
- Be warm but BRIEF — 2-3 sentences max
- If asked about orders, ask for order number or email
- Use store FAQ when available
- If you can't help, offer to connect with a human
- Never make up order details, product info, or policies
- Use emojis sparingly for warmth${faqContext}`;

  try {
    return await callDeepSeek(systemPrompt, userMessage, context.previousMessages);
  } catch {
    return `I'm having trouble right now. Would you like me to connect you with a human agent? 😊`;
  }
}

// ─── DeepSeek API ────────────────────────────────────────────────────

async function callDeepSeek(
  systemPrompt: string,
  userMessage: string,
  previousMessages: { role: string; content: string }[],
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('Missing DEEPSEEK_API_KEY');

  const messages = [
    { role: 'system', content: systemPrompt },
    ...previousMessages.slice(-6).map(m => ({
      role: m.role === 'customer' ? 'user' : 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      max_tokens: 250,
      temperature: 0.7,
    }),
  });

  if (!response.ok) throw new Error('AI service error');

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'Sorry, I couldn\'t process that.';
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatOrderStatus(status: string): string {
  const map: Record<string, string> = {
    'FULFILLED': 'Shipped ✅',
    'UNFULFILLED': 'Processing 📤',
    'PARTIALLY_FULFILLED': 'Partially Shipped 📦',
    'RESTOCKED': 'Returned ↩️',
    'PENDING': 'Pending ⏳',
  };
  return map[status] || status;
}

function formatFinancialStatus(status: string): string {
  const map: Record<string, string> = {
    'PAID': 'Paid',
    'PENDING': 'Payment Pending',
    'REFUNDED': 'Refunded',
    'PARTIALLY_REFUNDED': 'Partially Refunded',
    'VOIDED': 'Cancelled',
  };
  return map[status] || status;
}
