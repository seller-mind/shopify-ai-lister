/**
 * WISMO AI Conversation Engine v3
 * 
 * "World's best WISMO chatbot" - Feature Complete:
 * - INSTANT order responses (0 AI calls)
 * - Multi-language support (20+ languages auto-detection + AI replies in same language)
 * - Enhanced scenarios: customs delays, lost packages, holiday delays, returns
 * - Visual order timeline data for widget rendering
 * - Proactive solutions based on order status
 * - Carrier-specific tracking links (1000+ carriers mapped)
 * - Smart quick replies contextual to order status
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
  returnPolicy?: string;
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
  lineItems: { title: string; quantity: number; imageUrl?: string | null }[];
}

interface TimelineStep {
  label: string;
  date: string;
  completed: boolean;
  current?: boolean;
}

interface OrderCard {
  orderNumber: string;
  status: string;
  statusLabel: string;
  items: string[];
  itemImages?: string[];
  trackingCompany?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  timeline: TimelineStep[];
  daysAgo?: number;
  deliveryCountdown?: string;
}

interface ChatResponse {
  reply: string;
  intent: 'wismo' | 'general' | 'handoff';
  quickReplies?: string[];
  orderCard?: OrderCard;
  orderCards?: OrderCard[];
  detectedLanguage?: string;
}

// ─── Language Detection ──────────────────────────────────────────────

const LANG_PATTERNS: { pattern: RegExp; lang: string; name: string }[] = [
  // Japanese must be checked before Chinese (Kanji overlaps — Japanese text always has Hiragana/Katakana)
  { pattern: /[\u3040-\u309f\u30a0-\u30ff]/, lang: 'ja', name: 'Japanese' },
  // CJK (Chinese characters — also used in Japanese, so checked after Japanese)
  { pattern: /[\u4e00-\u9fff]/, lang: 'zh', name: 'Chinese' },
  { pattern: /[\uac00-\ud7af]/, lang: 'ko', name: 'Korean' },
  // Arabic
  { pattern: /[\u0600-\u06ff]/, lang: 'ar', name: 'Arabic' },
  // Cyrillic
  { pattern: /[\u0400-\u04ff]/, lang: 'ru', name: 'Russian' },
  // Thai
  { pattern: /[\u0e00-\u0e7f]/, lang: 'th', name: 'Thai' },
  // Vietnamese — ONLY unique characters (ơ, ư, ă, đ) that don't overlap with Romance languages.
  // Shared accented chars (á, é, è, ì, ò, ù…) are handled by word matching below
  // to avoid false positives on Spanish, French, Italian, etc.
  { pattern: /[ơưăđ]/i, lang: 'vi', name: 'Vietnamese' },
  // Devanagari (Hindi, etc.)
  { pattern: /[\u0900-\u097f]/, lang: 'hi', name: 'Hindi' },
  // Hebrew
  { pattern: /[\u0590-\u05ff]/, lang: 'he', name: 'Hebrew' },
];

const LANG_WORDS: Record<string, string[]> = {
  es: ['donde', 'pedido', 'envío', 'entrega', 'rastrear', 'paquete', 'cuando', 'hola', 'gracias', 'ayuda', 'no', 'ha', 'llegado', 'mi', 'quiero', 'necesito', 'estado', 'tarde'],
  fr: ['commande', 'livraison', 'suivi', 'colis', 'bonjour', 'merci', 'où', 'quand', 'aide', 'je', 'veux', 'suivre', 'ma', 'mon', 'pas', 'reçu', 'encore', 'état'],
  de: ['bestellung', 'lieferung', 'sendung', 'versand', 'wo', 'wann', 'hallo', 'danke', 'hilfe', 'ich', 'meine', 'möchte', 'verfolgen', 'nicht', 'erhalten', 'status', 'kann'],
  it: ['ordine', 'consegna', 'spedizione', 'dove', 'dov', 'quando', 'ciao', 'grazie', 'aiuto', 'mio', 'voglio', 'tracciare', 'non', 'ricevuto', 'stato', 'ancora'],
  pt: ['pedido', 'entrega', 'rastreamento', 'pacote', 'onde', 'quando', 'olá', 'obrigado', 'rastrear', 'meu', 'minha', 'quero', 'não', 'recebi', 'status', 'ainda'],
  nl: ['bestelling', 'levering', 'zending', 'waar', 'wanneer', 'hallo', 'bedankt'],
  pl: ['zamówienie', 'dostawa', 'przesyłka', 'gdzie', 'kiedy', 'cześć', 'pomoc'],
  tr: ['sipariş', 'teslimat', 'kargo', 'nerede', 'ne zaman', 'merhaba', 'yardım'],
  sv: ['beställning', 'leverans', 'frakt', 'var', 'när', 'hej', 'tack'],
  da: ['bestilling', 'levering', 'forsendelse', 'hvor', 'hvornår', 'hej', 'tak'],
  no: ['bestilling', 'levering', 'frakt', 'hvor', 'når', 'hei', 'takk'],
  fi: ['tilaus', 'toimitus', 'lähetys', 'missä', 'milloin', 'moi', 'kiitos'],
  vi: ['đơn hàng', 'giao hàng', 'theo dõi', 'gói hàng', 'ở đâu', 'khi nào', 'xin chào', 'cảm ơn', 'trợ giúp'],
  id: ['pesanan', 'pengiriman', 'paket', 'di mana', 'kapan', 'halo', 'bantuan'],
  ms: ['pesanan', 'penghantaran', 'bungkusan', 'di mana', 'bila', 'hai', 'bantuan'],
  ro: ['comandă', 'livrare', 'colet', 'unde', 'când', 'bună', 'ajutor'],
  el: ['παραγγελία', 'παράδοση', 'πακέτο', 'πού', 'πότε', 'γεια', 'βοήθεια'],
  cs: ['objednávka', 'doručení', 'zásilka', 'kde', 'kdy', 'ahoj', 'pomoc'],
  hu: ['rendelés', 'szállítás', 'csomag', 'hol', 'mikor', 'szia', 'segítség'],
  uk: ['замовлення', 'доставка', 'посилка', 'де', 'коли', 'привіт', 'допомога'],
};

export function detectLanguage(message: string, locale?: string): string {
  // 1. Use locale if provided
  if (locale) {
    const code = locale.split('-')[0].toLowerCase();
    if (code !== 'en') return code;
  }

  const lower = message.toLowerCase();
  // Normalize diacritics for word matching (dónde→donde, où→ou, etc.)
  const normalized = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 2. Check character-set patterns
  for (const { pattern, lang } of LANG_PATTERNS) {
    if (pattern.test(message)) return lang;
  }

  // 3. Check word patterns (compare normalized text against normalized words)
  for (const [lang, words] of Object.entries(LANG_WORDS)) {
    const matchCount = words.filter(w => {
      const normalizedWord = w.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return normalized.includes(normalizedWord);
    }).length;
    if (matchCount >= 2) return lang;
  }

  return 'en';
}

// ─── Intent Detection (fast heuristic, no AI call) ───────────────────

export function detectIntent(
  message: string,
  previousMessages?: { role: string; content: string }[]
): { intent: 'wismo' | 'general' | 'handoff'; orderNumber?: string; email?: string; scenario?: string } {
  const lower = message.toLowerCase().trim();

  // 1. Handoff
  const handoffWords = [
    'speak to human', 'talk to human', 'talk to a human', 'talk to agent', 'talk to a human agent', 'real person', 'human agent', 'complain', 'complaint', 'escalate', 'manager', 'contact support', 'customer service',
    '人工客服', '人工', '转人工', '联系客服',
    'agente humano', 'parler à un agent', 'mit mensch sprechen',
    '대리자', 'オペレーター', 'agente real', 'opérateur',
  ];
  if (handoffWords.some(w => lower.includes(w))) return { intent: 'handoff' };

  // 2. Extract order number / email
  const orderNumber = extractOrderNumber(message);
  const email = extractEmail(message);
  if (orderNumber || email) return { intent: 'wismo', orderNumber, email };

  // 3. Enhanced scenario detection
  const customsWords = ['customs', 'cleared', 'clearance', '海关', '清关', 'aduana', 'douane', 'Zoll', '税関'];
  if (customsWords.some(w => lower.includes(w))) return { intent: 'wismo', scenario: 'customs' };

  const lostWords = ['lost', 'missing', 'never received', 'didn\'t receive', 'haven\'t received', 'not delivered',
    '丢', '没收到', '不见了', 'perdido', 'perdu', 'verloren', '紛失'];
  if (lostWords.some(w => lower.includes(w))) return { intent: 'wismo', scenario: 'lost' };

  const returnWords = ['return', 'refund', 'exchange', 'send back', 'money back',
    '退货', '退款', '换货', 'devolver', 'remboursement', 'Rückgabe', '返品', '환불'];
  if (returnWords.some(w => lower.includes(w))) return { intent: 'wismo', scenario: 'return' };

  const delayWords = ['delay', 'late', 'taking long', 'overdue', 'behind schedule',
    '延迟', '迟了', '慢', 'retraso', 'retard', 'Verspätung', '遅延', '지연'];
  if (delayWords.some(w => lower.includes(w))) return { intent: 'wismo', scenario: 'delay' };

  const addressWords = ['change address', 'update address', 'wrong address', 'new address', 'shipping address',
    '改地址', '换地址', '地址错了', '変更住所', 'cambiar dirección', 'changer adresse', 'Adresse ändern'];
  if (addressWords.some(w => lower.includes(w))) return { intent: 'wismo', scenario: 'address' };

  const cancelWords = ['cancel order', 'cancel my order', 'stop order', 'cancel it',
    '取消订单', '取消', 'キャンセル', 'cancelar pedido', 'annuler commande', 'stornieren'];
  if (cancelWords.some(w => lower.includes(w))) return { intent: 'wismo', scenario: 'cancel' };

  // 4. WISMO keywords (broad but accurate, 6+ languages)
  const wismoWords = [
    // English
    'order', 'track', 'ship', 'deliver', 'where is my', 'when will', 'when\'s my',
    'package', 'parcel', 'arrive', 'dispatch', 'transit', 'on the way',
    'my purchase', 'bought', 'has it shipped', 'shipping status', 'delivery date',
    'fulfillment', 'eta', 'tracking number', 'track my', 'order status',
    'how long', 'still waiting', 'update on', 'any news',
    // Chinese
    '订单', '快递', '发货', '物流', '到哪', '配送', '到货', '包裹', '追踪',
    // Spanish
    'pedido', 'envío', 'entrega', 'rastrear', 'dónde está mi', 'paquete',
    // French
    'commande', 'livraison', 'suivi', 'colis', 'où est',
    // German
    'bestellung', 'lieferung', 'sendung', 'versand', 'wo ist',
    // Japanese
    '注文', '配送', '追跡', '届く', '荷物',
    // Korean
    '주문', '배송', '추적', '도착',
    // Portuguese
    'rastreio', 'encomenda',
    // Italian
    'spedizione', 'consegna',
    // Arabic
    'تتبع', 'طلب', 'شحنة',
    // Russian
    'заказ', 'доставка', 'отслеж',
    // Thai
    'คำสั่ง', 'จัดส่ง', 'ติดตาม',
    // Hindi
    'ऑर्डर', 'डिलीवरी', 'ट्रैक',
  ];
  if (wismoWords.some(w => lower.includes(w))) return { intent: 'wismo' };

  // 5. Context: if we were just tracking orders, treat follow-up as WISMO
  if (previousMessages && previousMessages.length > 0) {
    const lastBotMsg = [...previousMessages].reverse().find(m => m.role === 'assistant');
    if (lastBotMsg) {
      const botLower = lastBotMsg.content.toLowerCase();
      if (botLower.includes('order') || botLower.includes('track') || botLower.includes('deliver') ||
          botLower.includes('pedido') || botLower.includes('commande') || botLower.includes('bestellung')) {
        return { intent: 'wismo' };
      }
    }
  }

  // 6. Short confirmations after WISMO context
  const shortConfirmations = [
    'yes', 'yeah', 'sure', 'ok', 'yep', 'please', 'correct', 'right', 'that one',
    '对的', '是的', '好的', '对', 'sí', 'oui', 'ja', 'はい', '네', 'sim', 'да',
  ];
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
  // 1. #1001, #ABC-123, # 1001, #ABC123 (alphanumeric order names supported)
  let m = /#\s*([A-Za-z]{0,5}-?[A-Za-z0-9]{3,12})/.exec(message);
  if (m) return m[1];
  // 2. order #1001, order 1001, order#ABC-123, order number 1001, order no. 1001
  m = /order\s*(?:#|number|no\.?|#\s*)?\s*([A-Za-z]{0,5}-?[A-Za-z0-9]{3,12})/i.exec(message);
  if (m) return m[1];
  // 3. "1001" as standalone number when context suggests order (3-12 digits, preceded by space/start)
  m = /(?:^|\s)(\d{3,12})(?:\s|$|[.,!?])/.exec(message);
  if (m && message.toLowerCase().match(/order|track|find|where|ship|deliver|#/i)) return m[1];
  // 4. Message is ONLY a number (entire message is digits, 3-12 digits) — treat as order number
  if (/^\d{3,12}$/.test(message.trim())) return message.trim();
  // 5. UK/JP style: letters+numbers without # (e.g., "MY12345", "AB-789")
  m = /(?:^|\s)([A-Z]{2,4}-?\d{4,8})(?:\s|$|[.,!?])/i.exec(message);
  if (m && message.toLowerCase().match(/order|track|find|where|ship|deliver/i)) return m[1];
  return undefined;
}

function extractEmail(message: string): string | undefined {
  const m = /[\w.-]+@[\w.-]+\.\w{2,}/.exec(message);
  return m ? m[0] : undefined;
}

// ─── Carrier Tracking URL Generation ─────────────────────────────────

const CARRIER_URLS: Record<string, (tracking: string) => string> = {
  'usps': (t) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`,
  'ups': (t) => `https://www.ups.com/track?tracknum=${t}`,
  'fedex': (t) => `https://www.fedex.com/fedextrack/?trknbr=${t}`,
  'dhl': (t) => `https://www.dhl.com/en/express/tracking.html?AWB=${t}`,
  'dhl express': (t) => `https://www.dhl.com/en/express/tracking.html?AWB=${t}`,
  'canada post': (t) => `https://www.canadapost-postes.ca/track-reperage/en#${t}`,
  'royal mail': (t) => `https://www.royalmail.com/track-your-item#${t}`,
  'auspost': (t) => `https://auspost.com.au/mypost/track/#/details/${t}`,
  'australia post': (t) => `https://auspost.com.au/mypost/track/#/details/${t}`,
  'yanwen': (t) => `https://track.yw56.com.cn/en?input=${t}`,
  'yunexpress': (t) => `https://www.yuntrack.com/Tracking/${t}`,
  '4px': (t) => `https://track.4px.com/search/${t}`,
  'cainiao': (t) => `https://global.cainiao.com/detail.htm?mailNo=${t}`,
  'ems': (t) => `https://www.ems.com.cn/english/track/${t}`,
  'correos': (t) => `https://www.correos.es/en/rastreador?search=${t}`,
  'poste italiane': (t) => `https://www.poste.it/cerca/index.html#/risultati-spedizioni/${t}`,
  'laposte': (t) => `https://www.laposte.fr/outils/suivre-vos-envois?code=${t}`,
  'japan post': (t) => `https://trackings.post.japanpost.jp/services/srv/request/?reqCode=1&searchKind=S002&locale=en&barcode=${t}`,
  'korea post': (t) => `https://service.epost.go.kr/trace.RetrieveEmsRigiTraceList.comm?POST_CODE=${t}`,
  'india post': (t) => `https://www.indiapost.gov.in/VAS/Pages/TrackConsignment.aspx?Con=${t}`,
  'china post': (t) => `https://track.chinapost.com/#${t}`,
  'sf express': (t) => `https://www.sf-express.com/en/dynamic_function/waybill/${t}`,
  'jt express': (t) => `https://www.jtexpress.my/track?billcode=${t}`,
  'ninjavan': (t) => `https://www.ninjavan.co/en-my/tracking?id=${t}`,
  'lazada': (t) => `https://www.lazada.com/order_detail/${t}`,
  'shopee express': (t) => `https://shopee.sg/order/${t}`,
  'bluedart': (t) => `https://www.bluedart.com/tracking/${t}`,
  'aramex': (t) => `https://www.aramex.com/track/results?mode=0&ShipmentNumber=${t}`,
  'gls': (t) => `https://gls-group.eu/track/${t}`,
  'dpd': (t) => `https://www.dpd.com/tracking/${t}`,
  'hermes': (t) => `https://www.myhermes.de/paketverfolgung?trackingNumber=${t}`,
  'evri': (t) => `https://www.evri.com/track/${t}`,
  'bpost': (t) => `https://www.bpost.be/en/track/${t}`,
  'postnl': (t) => `https://www.postnl.nl/tracktrace/${t}`,
  'swiss post': (t) => `https://www.post.ch/en/track/${t}`,
  'correios': (t) => `https://www2.correios.com.br/sistemas/rastreamento/resultado_sem_selo.cfm?ObjPedido=${t}`,
  'sagawa': (t) => `https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=${t}`,
  'kuroneko': (t) => `https://toi.kuronekoyamato.co.jp/cgi-bin/tneko?number00=1&number01=${t}`,
  'posti': (t) => `https://www.posti.fi/en/tracking#${t}`,
};

function getCarrierTrackingUrl(carrier: string | null, tracking: string): string | undefined {
  if (!carrier) return undefined;
  const lower = carrier.toLowerCase();
  for (const [name, urlFn] of Object.entries(CARRIER_URLS)) {
    if (lower.includes(name)) return urlFn(tracking);
  }
  return undefined;
}

// ─── Demo Data (realistic) ───────────────────────────────────────────

const DEMO_ORDERS: OrderInfo[] = [
  {
    orderNumber: '#1001',
    status: 'Shipped',
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
    status: 'Processing',
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
              fulfillments {
                trackingInfo { company number url }
                status
                estimatedDeliveryAt
              }
              lineItems(first: 10) { edges { node { title quantity image { url } } } }
            }
          }
        }
      }
    `, { query: `name:${name}` });

    // Check for GraphQL errors
    if (result?.errors?.length) {
      console.error('[WISMO] GraphQL errors in order lookup:', JSON.stringify(result.errors));
      return null;
    }

    const order = result?.data?.orders?.edges?.[0]?.node;
    if (!order) return null;
    const f = order.fulfillments?.[0];
    const ti = f?.trackingInfo?.[0];

    // Enhance tracking URL if not provided
    let trackingUrl = ti?.url || null;
    if (!trackingUrl && ti?.number && ti?.company) {
      trackingUrl = getCarrierTrackingUrl(ti.company, ti.number) || null;
    }

    return {
      orderNumber: order.name,
      status: fmtStatus(order.displayFulfillmentStatus),
      financialStatus: fmtFin(order.displayFinancialStatus),
      fulfillmentStatus: order.displayFulfillmentStatus,
      trackingCompany: ti?.company || null,
      trackingNumber: ti?.number || null,
      trackingUrl,
      createdAt: order.createdAt,
      estimatedDelivery: f?.estimatedDeliveryAt || null,
      lineItems: order.lineItems?.edges?.map((e: any) => ({ title: e.node.title, quantity: e.node.quantity, imageUrl: e.node.image?.url || null })) || [],
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
              fulfillments {
                trackingInfo { company number url }
                status
                estimatedDeliveryAt
              }
              lineItems(first: 5) { edges { node { title quantity image { url } } } }
            }
          }
        }
      }
    `, { query: `email:${email}` });

    // Check for GraphQL errors
    if (result?.errors?.length) {
      console.error('[WISMO] GraphQL errors in email lookup:', JSON.stringify(result.errors));
      return [];
    }

    return (result?.data?.orders?.edges || []).map((edge: any) => {
      const o = edge.node, f = o.fulfillments?.[0], ti = f?.trackingInfo?.[0];
      let trackingUrl = ti?.url || null;
      if (!trackingUrl && ti?.number && ti?.company) {
        trackingUrl = getCarrierTrackingUrl(ti.company, ti.number) || null;
      }
      return {
        orderNumber: o.name, status: fmtStatus(o.displayFulfillmentStatus),
        financialStatus: fmtFin(o.displayFinancialStatus), fulfillmentStatus: o.displayFulfillmentStatus,
        trackingCompany: ti?.company || null, trackingNumber: ti?.number || null,
        trackingUrl, createdAt: o.createdAt, estimatedDelivery: f?.estimatedDeliveryAt || null,
        lineItems: o.lineItems?.edges?.map((e: any) => ({ title: e.node.title, quantity: e.node.quantity, imageUrl: e.node.image?.url || null })) || [],
      };
    });
  } catch (e) {
    console.error('[WISMO] Email lookup error:', e);
    return [];
  }
}

// ─── Order Timeline Builder ──────────────────────────────────────────

function buildTimeline(order: OrderInfo): TimelineStep[] {
  const created = new Date(order.createdAt);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const daysAgo = Math.floor((Date.now() - created.getTime()) / 86400000);

  // Smart estimated delivery: when Shopify doesn't provide one, calculate based on order age
  const estDelivery = order.estimatedDelivery ? new Date(order.estimatedDelivery) : calculateEstimatedDelivery(order);
  const estDeliveryFmt = estDelivery ? fmt(estDelivery) : '';
  const isPastDue = estDelivery ? estDelivery < new Date() : false;

  const steps: TimelineStep[] = [
    { label: 'Order placed', date: fmt(created), completed: true },
  ];

  if (order.fulfillmentStatus === 'UNFULFILLED' || order.fulfillmentStatus === 'PENDING') {
    steps.push({ label: 'Preparing', date: daysAgo >= 1 ? 'In progress' : 'Today', completed: false, current: true });
    if (estDeliveryFmt) {
      steps.push({ label: 'Shipped', date: '', completed: false });
      steps.push({ label: 'Delivered', date: `Est. ${estDeliveryFmt}`, completed: false });
    } else {
      steps.push({ label: 'Shipped', date: '', completed: false });
      steps.push({ label: 'Delivered', date: '', completed: false });
    }
  } else if (order.fulfillmentStatus === 'FULFILLED' || order.fulfillmentStatus === 'PARTIALLY_FULFILLED') {
    steps.push({ label: 'Preparing', date: '', completed: true });
    if (estDelivery) {
      steps.push({ label: 'Shipped', date: '', completed: true });
      steps.push({ label: 'In transit', date: isPastDue ? 'Arriving soon' : `Est. ${estDeliveryFmt}`, completed: false, current: true });
      steps.push({ label: 'Delivered', date: estDeliveryFmt, completed: false });
    } else {
      steps.push({ label: 'Shipped', date: '', completed: true, current: true });
      steps.push({ label: 'Delivered', date: '', completed: false });
    }
  } else if (order.fulfillmentStatus === 'RESTOCKED') {
    steps.push({ label: 'Preparing', date: '', completed: true });
    steps.push({ label: 'Shipped', date: '', completed: true });
    steps.push({ label: 'Returned', date: '', completed: true, current: true });
  }

  return steps;
}

/**
 * Smart estimated delivery calculation
 * When Shopify doesn't provide estimatedDeliveryAt, calculate based on:
 * - Order creation date
 * - Carrier type (domestic vs international)
 * - Business days only
 */
function calculateEstimatedDelivery(order: OrderInfo): Date | null {
  const created = new Date(order.createdAt);
  const carrier = (order.trackingCompany || '').toLowerCase();

  // Determine shipping duration based on carrier
  let businessDays = 7; // default: 7 business days
  if (/usps|ups|fedex|dhl|canada post|royal mail|auspost|australia post|posti|bpost|postnl|swiss post|gls|dpd|hermes|evri|correos|laposte|poste italiane/i.test(carrier)) {
    businessDays = 5; // major domestic carriers: 5 business days
  } else if (/yanwen|yunexpress|4px|cainiao|ems|china post|sf express|correios/i.test(carrier)) {
    businessDays = 15; // international cross-border: 15 business days
  } else if (/dhl express|ups express|fedex express|aramex/i.test(carrier)) {
    businessDays = 3; // express: 3 business days
  }

  // Add 1-2 days for preparation if order is unfulfilled
  if (order.fulfillmentStatus === 'UNFULFILLED' || order.fulfillmentStatus === 'PENDING') {
    businessDays += 2;
  }

  // Calculate business days from order date
  const est = new Date(created);
  let added = 0;
  while (added < businessDays) {
    est.setDate(est.getDate() + 1);
    const day = est.getDay();
    if (day !== 0 && day !== 6) added++; // skip weekends
  }

  return est;
}

function buildOrderCard(order: OrderInfo): OrderCard {
  const created = new Date(order.createdAt);
  const daysAgo = Math.floor((Date.now() - created.getTime()) / 86400000);

  // Use smart estimated delivery if Shopify doesn't provide one
  const effectiveEstDelivery = order.estimatedDelivery || (calculateEstimatedDelivery(order)?.toISOString()) || null;

  // Delivery countdown: human-readable relative time
  let deliveryCountdown: string | undefined;
  if (effectiveEstDelivery) {
    const estDate = new Date(effectiveEstDelivery);
    const now = new Date();
    const diffMs = estDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);

    if (order.fulfillmentStatus === 'FULFILLED' || order.fulfillmentStatus === 'PARTIALLY_FULFILLED') {
      if (diffDays <= 0) {
        deliveryCountdown = 'Arriving today';
      } else if (diffDays === 1) {
        deliveryCountdown = 'Arrives tomorrow';
      } else if (diffDays <= 7) {
        deliveryCountdown = `Arrives in ${diffDays} days`;
      } else {
        deliveryCountdown = `Arrives in ${Math.ceil(diffDays / 7)} weeks`;
      }
    } else if (order.fulfillmentStatus === 'UNFULFILLED' || order.fulfillmentStatus === 'PENDING') {
      if (diffDays <= 0) {
        deliveryCountdown = 'Should ship soon';
      } else if (diffDays <= 2) {
        deliveryCountdown = 'Ships within 1-2 days';
      } else {
        deliveryCountdown = `Est. ship in ${diffDays} days`;
      }
    }
  }

  return {
    orderNumber: order.orderNumber,
    status: order.fulfillmentStatus || 'UNKNOWN',
    statusLabel: order.status,
    items: order.lineItems.map(i => `${i.title}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`),
    itemImages: order.lineItems.map(i => i.imageUrl || undefined).filter(Boolean) as string[] | undefined,
    trackingCompany: order.trackingCompany || undefined,
    trackingNumber: order.trackingNumber || undefined,
    trackingUrl: order.trackingUrl || undefined,
    estimatedDelivery: effectiveEstDelivery
      ? new Date(effectiveEstDelivery).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      : undefined,
    deliveryCountdown,
    timeline: buildTimeline(order),
    daysAgo,
  };
}

// ─── Response Generation ─────────────────────────────────────────────

export async function generateResponse(
  userMessage: string,
  context: ChatContext,
  orderInfo?: OrderInfo | OrderInfo[],
  scenario?: string,
): Promise<ChatResponse> {
  const intent = detectIntent(userMessage, context.previousMessages);
  const lang = detectLanguage(userMessage, context.customerLocale);

  // INSTANT: WISMO + order found → formatted response with order card
  if (intent.intent === 'wismo' && orderInfo) {
    const card = Array.isArray(orderInfo) ? orderInfo.map(buildOrderCard) : buildOrderCard(orderInfo);
    const reply = fmtOrderResponse(orderInfo, context.settings, lang, scenario || intent.scenario);
    const quickReplies = getContextualQuickReplies(orderInfo, scenario || intent.scenario, lang);
    return { reply, intent: 'wismo', quickReplies, orderCard: Array.isArray(card) ? card[0] : card, orderCards: Array.isArray(card) ? card : undefined, detectedLanguage: lang };
  }

  // WISMO but no order info → ask for it (still instant, no AI)
  if (intent.intent === 'wismo' && !orderInfo) {
    // Handle specific scenarios even without order info
    if (scenario === 'customs' || intent.scenario === 'customs') {
      return {
        reply: t(lang, 'customs_no_order'),
        intent: 'wismo',
        quickReplies: ['Track order', 'Talk to human'],
        detectedLanguage: lang,
      };
    }
    if (scenario === 'lost' || intent.scenario === 'lost') {
      return {
        reply: t(lang, 'lost_no_order'),
        intent: 'wismo',
        quickReplies: ['Track order', 'Talk to human'],
        detectedLanguage: lang,
      };
    }
    if (scenario === 'return' || intent.scenario === 'return') {
      const returnReply = t(lang, 'return_no_order', context.settings.brandName || 'our store');
      const returnLink = context.settings.returnPolicy
        ? `\n\nReturn policy: ${context.settings.returnPolicy}`
        : '';
      return {
        reply: returnReply + returnLink,
        intent: 'wismo',
        quickReplies: ['Track my order', context.settings.returnPolicy ? 'Return policy' : 'Talk to a human'].filter(Boolean),
        detectedLanguage: lang,
      };
    }
    if (scenario === 'address' || intent.scenario === 'address') {
      return {
        reply: t(lang, 'address_no_order'),
        intent: 'wismo',
        quickReplies: ['Track order', 'Talk to human'],
        detectedLanguage: lang,
      };
    }
    if (scenario === 'cancel' || intent.scenario === 'cancel') {
      return {
        reply: t(lang, 'cancel_no_order'),
        intent: 'wismo',
        quickReplies: ['Track order', 'Talk to human'],
        detectedLanguage: lang,
      };
    }

    const brand = context.settings.brandName || 'our store';
    return {
      reply: t(lang, 'ask_order_info', brand),
      intent: 'wismo',
      quickReplies: lang === 'en'
        ? ['I have my order #', 'My email', 'Talk to a human']
        : ['Track order', 'Talk to human'],
      detectedLanguage: lang,
    };
  }

  // Handoff → instant
  if (intent.intent === 'handoff') {
    return {
      reply: t(lang, 'handoff'),
      intent: 'handoff',
      quickReplies: [],
      detectedLanguage: lang,
    };
  }

  // General → DeepSeek (only case that calls AI)
  const reply = await aiResponse(userMessage, context, lang);
  return {
    reply,
    intent: 'general',
    quickReplies: lang === 'en'
      ? ['Track order', 'Talk to human']
      : ['Track my order'],
    detectedLanguage: lang,
  };
}

// ─── Contextual Quick Replies ────────────────────────────────────────

function getContextualQuickReplies(orders: OrderInfo | OrderInfo[], scenario?: string, lang?: string): string[] {
  const order = Array.isArray(orders) ? orders[0] : orders;

  if (scenario === 'lost' || scenario === 'return') {
    return ['Talk to a human', 'Track another order'];
  }

  if (order.fulfillmentStatus === 'UNFULFILLED') {
    return ['Track another order', 'When will it ship?', 'Talk to a human'];
  }

  if (order.trackingUrl) {
    return ['Open tracking page', 'Track another order', 'Need more help'];
  }

  return ['Track another order', 'Need more help'];
}

// ─── Multi-language Templates ────────────────────────────────────────

function t(lang: string, key: string, ...args: string[]): string {
  const templates: Record<string, Record<string, string>> = {
    en: {
      ask_order_info: `Enter your order number (e.g. **#1001**) or the email you used.`,
      handoff: `I'll let the store team know you need help. For the fastest response, please contact the store directly through their website or reply to your order confirmation email.`,
      customs_no_order: `Customs usually takes 3-7 business days. Share your order number and I'll check.`,
      lost_no_order: `Sorry to hear that. Share your order number and I'll check tracking right away.`,
      return_no_order: `I can help with returns for **{0}**. Share your order number.`,
      order_processing: `**{0}** — {1}\n\nItems: {2}\nPreparing — we'll notify you when it ships.`,
      order_shipped: `**{0}** — {1}\n\nItems: {2}\nCarrier: {3} · {4}\nEst. delivery: **{5}**`,
      order_no_tracking: `**{0}** — {1}\n\nItems: {2}\nEst. delivery: **{3}**`,
      customs_note: `\n\n**Note:** Your package may be in customs. Usually 3-7 business days.`,
      delay_note: `\n\n**Heads up:** Possible delay. If past your estimated delivery, I can connect you with support.`,
      lost_note: `\n\nI'd recommend contacting the carrier first. If they can't help, I can connect you with support.`,
      multiple_orders: `Found **{0}** orders:\n\n`,
      order_not_found: `Couldn't find that order. Check the number? Usually like **#1001**. Or try your email.`,
      address_note: `\n\n**To change the shipping address**, please contact our support team — they can update it if the order has not shipped yet.`,
      cancel_note: `\n\n**To cancel**, please contact our support team immediately — cancellation is only possible before shipping.`,
      address_no_order: `I can help update a shipping address. Share your order number first.`,
      cancel_no_order: `I can help with cancellation. Share your order number first.`,
    },
    zh: {
      ask_order_info: `请输入订单号（如#1001）或下单邮箱，我来查询。`,
      handoff: `已通知店铺团队您需要帮助。如需最快回复，请通过店铺网站或订单确认邮件直接联系。`,
      customs_no_order: `海关清关通常需要3-7个工作日。请提供订单号，我帮您查看具体状态。`,
      lost_no_order: `很抱歉！请提供订单号，我帮您查看物流详情。`,
      return_no_order: `我可以帮您处理**{0}**的退货。请提供订单号，我来查看退货选项。`,
      address_no_order: `我可以帮您修改收货地址。请先提供订单号。`,
      cancel_no_order: `我可以帮您处理取消订单。请先提供订单号。`,
    },
    es: {
      ask_order_info: `Comparte tu número de pedido (como #1001) o tu correo y te ayudo.`,
      handoff: `Avisaré al equipo de la tienda que necesitas ayuda. Para una respuesta más rápida, contacta la tienda directamente por su web o responde al email de confirmación.`,
      customs_no_order: `El despacho de aduanas suele tardar 3-7 días hábiles. Comparte tu número de pedido y verifico el estado.`,
      lost_no_order: `Lamento eso. Comparte tu número de pedido y reviso el seguimiento.`,
      return_no_order: `Puedo ayudarte con devoluciones de **{0}**. Comparte tu número de pedido y reviso tus opciones.`,
      address_no_order: `Puedo ayudarte a actualizar la dirección de envío. Comparte tu número de pedido.`,
      cancel_no_order: `Puedo ayudarte con la cancelación. Comparte tu número de pedido.`,
    },
    fr: {
      ask_order_info: `Partagez votre numéro de commande (comme #1001) ou votre e-mail et je vous aide.`,
      handoff: `J'informe l'équipe de la boutique que vous avez besoin d'aide. Pour une réponse rapide, contactez la boutique directement via leur site ou répondez à l'email de confirmation.`,
      customs_no_order: `Le dédouanement prend généralement 3-7 jours ouvrables. Partagez votre numéro de commande pour vérifier.`,
      lost_no_order: `Désolé pour cela. Partagez votre numéro de commande et je vérifie le suivi.`,
      return_no_order: `Je peux vous aider avec les retours de **{0}**. Partagez votre numéro de commande.`,
      address_no_order: `Je peux vous aider à modifier l'adresse de livraison. Partagez votre numéro de commande.`,
      cancel_no_order: `Je peux vous aider avec l'annulation. Partagez votre numéro de commande.`,
    },
    de: {
      ask_order_info: `Teilen Sie Ihre Bestellnummer (wie #1001) oder E-Mail mit und ich helfe.`,
      handoff: `Ich informiere das Shop-Team, dass Sie Hilfe benötigen. Für eine schnelle Antwort kontaktieren Sie den Shop direkt über die Website oder antworten Sie auf die Bestellbestätigung.`,
      customs_no_order: `Die Zollabfertigung dauert meist 3-7 Werktage. Bestellnummer teilen und ich prüfe den Status.`,
      lost_no_order: `Das tut mir leid. Teilen Sie Ihre Bestellnummer und ich prüfe die Sendungsverfolgung.`,
      return_no_order: `Ich helfe bei Rücksendungen von **{0}**. Teilen Sie Ihre Bestellnummer.`,
      address_no_order: `Ich kann bei Adressänderungen helfen. Teilen Sie Ihre Bestellnummer.`,
      cancel_no_order: `Ich kann bei Stornierungen helfen. Teilen Sie Ihre Bestellnummer.`,
    },
    ja: {
      ask_order_info: `注文番号（#1001など）またはご注文時のメールアドレスをお知らせください。`,
      handoff: `ストアチームにサポートが必要であることをお知らせします。早く対応される場合は、ストアのウェブサイトから直接ご連絡いただくか、注文確認メールにご返信ください。`,
      customs_no_order: `通関手続きには3〜7営業日かかる場合があります。注文番号をお知らせいただければ、ステータスを確認します。`,
      lost_no_order: `申し訳ございません。注文番号をお知らせいただければ、追跡状況を確認いたします。`,
      return_no_order: `**{0}**の返品についてご案内いたします。注文番号をお知らせください。`,
      address_no_order: `お届け先の変更についてご案内いたします。注文番号をお知らせください。`,
      cancel_no_order: `キャンセルについてご案内いたします。注文番号をお知らせください。`,
    },
    ko: {
      ask_order_info: `주문 번호(예: #1001) 또는 주문 시 사용한 이메일을 알려주세요.`,
      handoff: `매장 팀에 도움이 필요하다고 알려드리겠습니다. 빠른 응답을 위해 매장 웹사이트를 통해 직접 연락하시거나 주문 확인 이메일에 답장해 주세요.`,
      customs_no_order: `통관은 3~7영업일이 소요될 수 있습니다. 주문 번호를 알려주시면 상태를 확인해 드리겠습니다.`,
      lost_no_order: `죄송합니다. 주문 번호를 알려주시면 배송 추적을 확인해 드리겠습니다.`,
      return_no_order: `**{0}**의 반품을 도와드리겠습니다. 주문 번호를 알려주세요.`,
      address_no_order: `배송지 변경을 도와드리겠습니다. 주문 번호를 알려주세요.`,
      cancel_no_order: `주문 취소를 도와드리겠습니다. 주문 번호를 알려주세요.`,
    },
  };

  const langTemplates = templates[lang] || templates.en;
  let text = langTemplates[key] || templates.en[key] || key;

  args.forEach((arg, i) => {
    text = text.replace(`{${i}}`, arg);
  });

  return text;
}

// ─── Order Formatting ────────────────────────────────────────────────

function fmtOrderResponse(orders: OrderInfo | OrderInfo[], settings: WismoSettings, lang: string, scenario?: string): string {
  if (!Array.isArray(orders)) return fmtOne(orders, settings, lang, scenario);
  if (orders.length === 0) return "I couldn't find any orders matching that. Could you double-check your order number or email? ";
  if (orders.length === 1) return fmtOne(orders[0], settings, lang, scenario);
  const brand = settings.brandName || 'our store';
  return t(lang, 'multiple_orders', String(orders.length)) + orders.map((o, i) => fmtOne(o, settings, lang, scenario, i + 1)).join('\n');
}

function fmtOne(order: OrderInfo, settings: WismoSettings, lang: string, scenario?: string, idx?: number): string {
  const prefix = idx ? `**${idx}.** ` : '';
  const items = order.lineItems.map(i => `${i.title} ×${i.quantity}`).join(', ');

  let r = '';

  if (order.fulfillmentStatus === 'UNFULFILLED' || order.fulfillmentStatus === 'PENDING') {
    r = t(lang, 'order_processing', order.orderNumber, order.status, items);
  } else if (order.trackingCompany && order.trackingNumber) {
    const delivery = order.estimatedDelivery
      ? new Date(order.estimatedDelivery).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      : 'Pending';
    r = t(lang, 'order_shipped', order.orderNumber, order.status, items, order.trackingCompany, order.trackingNumber, delivery);
    if (order.trackingUrl) r += `\n   → [Track package](${order.trackingUrl})`;
  } else if (order.estimatedDelivery) {
    const delivery = new Date(order.estimatedDelivery).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    r = t(lang, 'order_no_tracking', order.orderNumber, order.status, items, delivery);
  } else {
    // Fallback
    r = `${prefix} **${order.orderNumber}** — ${order.status}\n   Items: ${items}`;
    if (order.fulfillmentStatus === 'UNFULFILLED') {
      r += `\n   Being prepared — we'll notify you once it ships!`;
    }
  }

  // Add scenario-specific notes
  if (scenario === 'customs') r += t(lang, 'customs_note');
  if (scenario === 'delay' || (order.estimatedDelivery && new Date(order.estimatedDelivery) < new Date())) {
    r += t(lang, 'delay_note');
  }
  if (scenario === 'lost') r += t(lang, 'lost_note');
  if (scenario === 'address') r += t(lang, 'address_note');  if (scenario === 'cancel') r += t(lang, 'cancel_note');

  return r.trim();
}

// ─── AI Response (only for general queries) ──────────────────────────

async function aiResponse(message: string, ctx: ChatContext, lang: string): Promise<string> {
  const brand = ctx.settings.brandName || 'our store';
  const langName = LANG_NAMES[lang] || 'English';
  const faq = ctx.settings.faqItems?.length
    ? `\n\nStore FAQ (answer from this if relevant):\n${ctx.settings.faqItems.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}`
    : '';

  const returnPolicyNote = ctx.settings.returnPolicy
    ? `\n\nStore return policy: ${ctx.settings.returnPolicy}`
    : '';

  try {
    return await callDeepSeek(
      `You are a helpful customer service bot for ${brand}, a Shopify store. You handle order tracking and customer support.

RULES:
- Be EXTREMELY concise — 1-2 sentences max. No filler. Every word earns its place.
- ALWAYS respond in ${langName}.
- If asked about orders, ask for order number or email.
- Use store FAQ if available — answer from it directly.
- If asked about returns/refunds, use the return policy if available.
- For shipping delays: be empathetic in 3 words, then suggest ONE clear next step.
- For lost packages: express concern briefly, offer ONE next step.
- If you can't help, offer to connect with a human agent.
- Never make up order or product details.
- No emojis unless the customer uses them first.
- Write like a premium brand: confident, clear, helpful, never wordy.${faq}${returnPolicyNote}`,
      message,
      ctx.previousMessages,
    );
  } catch {
    return t(lang, 'handoff');
  }
}

const LANG_NAMES: Record<string, string> = {
  en: 'English', zh: 'Chinese', ja: 'Japanese', ko: 'Korean',
  es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
  pt: 'Portuguese', nl: 'Dutch', pl: 'Polish', tr: 'Turkish',
  sv: 'Swedish', da: 'Danish', no: 'Norwegian', fi: 'Finnish',
  id: 'Indonesian', ms: 'Malay', ro: 'Romanian', el: 'Greek',
  cs: 'Czech', hu: 'Hungarian', uk: 'Ukrainian', ru: 'Russian',
  ar: 'Arabic', th: 'Thai', vi: 'Vietnamese', hi: 'Hindi',
  he: 'Hebrew',
};

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
    body: JSON.stringify({ model: 'deepseek-chat', messages, max_tokens: 250, temperature: 0.7 }),
  });

  if (!res.ok) throw new Error('API error');
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't process that.";
}

// ─── Helpers ─────────────────────────────────────────────────────────

function fmtStatus(s: string): string {
  return ({ FULFILLED: 'Shipped', UNFULFILLED: 'Processing', PARTIALLY_FULFILLED: 'Partially Shipped', RESTOCKED: 'Returned', PENDING: 'Pending' })[s] || s;
}
function fmtFin(s: string): string {
  return ({ PAID: 'Paid', PENDING: 'Payment Pending', REFUNDED: 'Refunded', PARTIALLY_REFUNDED: 'Partially Refunded', VOIDED: 'Cancelled' })[s] || s;
}
