/**
 * WISMO AI Conversation Engine
 * 
 * Core AI service that powers the WISMO chatbot.
 * Handles intent detection, order lookup, and response generation.
 */
import { shopifyGraphQL, shopifyREST } from '~/shopify.server';

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

interface IntentResult {
  intent: 'wismo' | 'faq' | 'general' | 'handoff';
  confidence: number;
  entities?: {
    orderNumber?: string;
    email?: string;
    trackingNumber?: string;
  };
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

// ─── Intent Detection ────────────────────────────────────────────────

const WISMO_KEYWORDS = [
  'where is my order', 'track my order', 'order status', 'tracking',
  'when will i receive', 'delivery status', 'shipping status', 'has my order shipped',
  'order update', 'where\'s my order', 'my order', 'check order',
  'when will it arrive', 'shipment status', 'delivery date',
  '我的订单', '订单状态', '物流', '快递', '发货', '到哪了',
  '¿dónde está mi pedido', 'estado del pedido', 'envío', 'seguimiento',
  'où est ma commande', 'état de la commande', 'livraison', 'suivi',
  'wo ist meine bestellung', 'bestellstatus', 'lieferung', 'sendungsverfolgung',
  '私の注文はどこ', '注文状況', '配送状況', '追跡',
];

const HANDOFF_KEYWORDS = [
  'speak to human', 'talk to agent', 'real person', 'customer service',
  'complaint', 'refund request', 'escalate', 'manager',
  '人工客服', '投诉', '退款', '经理',
];

export function detectIntent(message: string): IntentResult {
  const lowerMsg = message.toLowerCase().trim();
  
  // Check for handoff intent first
  for (const keyword of HANDOFF_KEYWORDS) {
    if (lowerMsg.includes(keyword)) {
      return { intent: 'handoff', confidence: 0.9 };
    }
  }
  
  // Check for WISMO intent
  for (const keyword of WISMO_KEYWORDS) {
    if (lowerMsg.includes(keyword)) {
      // Try to extract order number
      const orderNumber = extractOrderNumber(message);
      const email = extractEmail(message);
      return {
        intent: 'wismo',
        confidence: 0.85,
        entities: { orderNumber, email },
      };
    }
  }
  
  // Default to general - let DeepSeek handle it
  return { intent: 'general', confidence: 0.5 };
}

function extractOrderNumber(message: string): string | undefined {
  // Shopify order numbers: #1234, 1234, or full format
  const patterns = [
    /#?(\d{4,6})/g,           // #1234 or 1234
    /order\s*#?\s*(\d{4,6})/i, // order #1234
    /订单号[:：]?\s*#?(\d{4,6})/i, // Chinese
  ];
  
  for (const pattern of patterns) {
    const match = pattern.exec(message);
    if (match) return match[1];
  }
  return undefined;
}

function extractEmail(message: string): string | undefined {
  const emailPattern = /[\w.-]+@[\w.-]+\.\w+/;
  const match = emailPattern.exec(message);
  return match ? match[0] : undefined;
}

// ─── Order Lookup ────────────────────────────────────────────────────

export async function lookupOrderByNumber(
  shop: string,
  accessToken: string,
  orderNumber: string
): Promise<OrderInfo | null> {
  try {
    // Search by order name (the display number like #1001)
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
      lineItems: order.lineItems?.edges?.map((e: any) => ({
        title: e.node.title,
        quantity: e.node.quantity,
      })) || [],
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
        lineItems: order.lineItems?.edges?.map((e: any) => ({
          title: e.node.title,
          quantity: e.node.quantity,
        })) || [],
      };
    });
  } catch (error) {
    console.error('[WISMO] Order lookup by email failed:', error);
    return [];
  }
}

// ─── AI Response Generation ──────────────────────────────────────────

export async function generateResponse(
  userMessage: string,
  context: ChatContext,
  orderInfo?: OrderInfo | OrderInfo[]
): Promise<{ reply: string; intent: string }> {
  const intent = detectIntent(userMessage);
  
  // For WISMO intent with order info, generate structured response
  if (intent.intent === 'wismo' && orderInfo) {
    const reply = formatOrderResponse(orderInfo, context.settings, userMessage);
    return { reply, intent: 'wismo' };
  }
  
  // For WISMO intent without order info, ask for details
  if (intent.intent === 'wismo' && !orderInfo) {
    const reply = await askForOrderDetails(userMessage, context);
    return { reply, intent: 'wismo' };
  }
  
  // For handoff intent
  if (intent.intent === 'handoff') {
    return {
      reply: `I'll connect you with a human agent right away. Please hold on for a moment. ⏳`,
      intent: 'handoff',
    };
  }
  
  // For general/FAQ intent, use DeepSeek
  const reply = await generateAIResponse(userMessage, context);
  return { reply, intent: 'general' };
}

function formatOrderResponse(
  orderInfo: OrderInfo | OrderInfo[],
  settings: WismoSettings,
  userMessage: string
): string {
  if (Array.isArray(orderInfo)) {
    if (orderInfo.length === 0) {
      return "I couldn't find any orders matching that information. Could you please double-check your order number or email address?";
    }
    
    if (orderInfo.length === 1) {
      return formatSingleOrder(orderInfo[0], settings);
    }
    
    // Multiple orders
    const brandName = settings.brandName || 'our store';
    let reply = `I found ${orderInfo.length} recent orders from ${brandName}:\n\n`;
    orderInfo.forEach((order, i) => {
      reply += formatSingleOrder(order, settings, i + 1);
      reply += '\n';
    });
    return reply;
  }
  
  return formatSingleOrder(orderInfo, settings);
}

function formatSingleOrder(order: OrderInfo, settings: WismoSettings, index?: number): string {
  const brandName = settings.brandName || 'our store';
  const prefix = index ? `**Order ${index}:** ` : '';
  
  let reply = `${prefix}📦 **${order.orderNumber}**\n`;
  reply += `   Status: **${order.status}**\n`;
  
  if (order.trackingCompany && order.trackingNumber) {
    reply += `   Carrier: ${order.trackingCompany}\n`;
    reply += `   Tracking: ${order.trackingNumber}\n`;
    if (order.trackingUrl) {
      reply += `   [Track your package](${order.trackingUrl})\n`;
    }
  }
  
  if (order.estimatedDelivery) {
    const date = new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
    reply += `   Estimated delivery: ${date}\n`;
  }
  
  if (order.fulfillmentStatus === 'UNFULFILLED') {
    reply += `   Your order is being prepared and hasn't shipped yet. We'll notify you once it's on the way! 📤\n`;
  }
  
  return reply;
}

async function askForOrderDetails(userMessage: string, context: ChatContext): Promise<string> {
  const brandName = context.settings.brandName || 'our store';
  
  // Use DeepSeek for natural language response
  const systemPrompt = `You are a friendly customer service chatbot for ${brandName}. The customer is asking about their order status but hasn't provided enough information to look it up. Ask them for their order number or the email address used for the order. Be concise and warm. Keep it under 2 sentences.`;
  
  try {
    return await callDeepSeek(systemPrompt, userMessage, context.previousMessages);
  } catch {
    return `I'd be happy to help you track your order! Could you please share your order number (e.g., #1001) or the email address you used when placing the order?`;
  }
}

async function generateAIResponse(userMessage: string, context: ChatContext): Promise<string> {
  const brandName = context.settings.brandName || 'our store';
  const faqContext = context.settings.faqItems?.length
    ? `\n\nStore FAQ (use this to answer if relevant):\n${context.settings.faqItems.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}`
    : '';
  
  const systemPrompt = `You are a friendly, helpful customer service chatbot for ${brandName}, an online store on Shopify. 

Your primary job is to help customers with order tracking (WISMO - "Where Is My Order?"). You can also answer general questions about the store, products, shipping policies, and returns.

Rules:
- Be warm, concise, and helpful
- If asked about order status, ask for their order number or email
- Use the store's FAQ when available to answer questions
- If you can't help, offer to connect them with a human agent
- Keep responses under 3 sentences unless giving order details
- Never make up information about orders, products, or policies${faqContext}`;

  try {
    return await callDeepSeek(systemPrompt, userMessage, context.previousMessages);
  } catch {
    return `I'm sorry, I'm having trouble processing your request right now. Would you like me to connect you with a human agent?`;
  }
}

// ─── DeepSeek API Call ───────────────────────────────────────────────

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
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[WISMO] DeepSeek API error:', error);
    throw new Error('AI service error');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'Sorry, I couldn\'t generate a response.';
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
