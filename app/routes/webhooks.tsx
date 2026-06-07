import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { shopify } from '~/shopify.server';
import { getSupabaseAdmin, deleteStore } from '~/services/supabase.server';

/**
 * Unified webhook handler — all webhooks go through /webhooks
 * 
 * Topics handled:
 * - app/uninstalled: Merchant uninstalls the app → delete all shop data
 * - customers/data_request: GDPR — customer requests their data
 * - customers/redact: GDPR — delete customer PII
 * - shop/redact: GDPR — delete all shop data (48h after uninstall)
 */
export async function action({ request }: ActionFunctionArgs) {
  const body = await request.text();
  const hmac = request.headers.get('X-Shopify-Hmac-Sha256') || '';
  const topic = request.headers.get('X-Shopify-Topic') || '';
  const shopDomain = request.headers.get('X-Shopify-Shop-Domain') || '';

  // Verify webhook signature — MUST reject invalid HMAC per Shopify requirements
  const isValid = await shopify.verifyHmac(body, hmac);
  if (!isValid) {
    console.error(`[Webhook] ❌ Invalid HMAC for ${topic} from ${shopDomain} — REJECTED`);
    return json({ error: 'Invalid signature' }, { status: 401 });
  }

  console.log(`[Webhook] ✅ ${topic} from ${shopDomain}`);

  try {
    const payload = JSON.parse(body);

    switch (topic) {
      case 'app/uninstalled':
        await handleAppUninstalled(shopDomain);
        break;
      case 'app_subscriptions/update':
        await handlePurchasesUpdate(shopDomain, payload);
        break;
      case 'customers/data_request':
        await handleCustomersDataRequest(shopDomain, payload);
        break;
      case 'customers/redact':
        await handleCustomersRedact(shopDomain, payload);
        break;
      case 'shop/redact':
        await handleShopRedact(shopDomain);
        break;
      default:
        console.log(`[Webhook] Unhandled topic: ${topic}`);
    }
  } catch (e) {
    console.error(`[Webhook] Error processing ${topic}:`, e);
  }

  // Always return 200 to acknowledge receipt — Shopify requires this
  return json({ success: true });
}

export async function loader() {
  return json({ error: 'Method not allowed' }, { status: 405 });
}

// ─── Handlers ────────────────────────────────────────────────────────────

async function handlePurchasesUpdate(shopDomain: string, payload: any) {
  // app_subscriptions/update webhook payload format:
  // { "app_subscription": { "admin_graphql_api_id": "...", "name": "Pro", "status": "ACTIVE", ... } }
  const sub = payload?.app_subscription;
  const planName = sub?.name?.toUpperCase() || 'FREE';
  const status = sub?.status?.toUpperCase() || 'UNKNOWN';
  console.log(`[Webhook] Subscriptions update: shop=${shopDomain}, plan=${planName}, status=${status}`);

  if (!shopDomain) return;
  const supabase = getSupabaseAdmin();

  if (status === 'ACTIVE') {
    await supabase
      .from('stores')
      .update({ plan: planName, updated_at: new Date().toISOString() })
      .eq('shop', shopDomain);
    console.log(`[Webhook] Updated store ${shopDomain} plan to ${planName}`);
  } else if (status === 'CANCELLED' || status === 'EXPIRED' || status === 'DECLINED') {
    await supabase
      .from('stores')
      .update({ plan: 'FREE', updated_at: new Date().toISOString() })
      .eq('shop', shopDomain);
    console.log(`[Webhook] Downgraded store ${shopDomain} to FREE (status: ${status})`);
  }
}

async function handleAppUninstalled(shopDomain: string) {
  if (!shopDomain) return;
  const deleted = await deleteStore(shopDomain);
  if (deleted) {
    console.log(`[Webhook] ✅ All data deleted for ${shopDomain} (app/uninstalled)`);
  } else {
    console.error(`[Webhook] ❌ Failed to delete data for ${shopDomain}`);
  }
}

async function handleCustomersDataRequest(shopDomain: string, payload: any) {
  const customerEmail = payload.customer?.email;
  const customerId = payload.customer?.id;
  console.log(`[GDPR] Customer data request: shop_id=${payload.shop_id}, customer_id=${customerId}`);

  if (shopDomain && customerEmail) {
    const supabase = getSupabaseAdmin();

    // Find conversations for this customer at this shop
    const { data: convs } = await supabase
      .from('wismo_conversations')
      .select('id, customer_email, customer_name, customer_locale, first_message, status, created_at, last_message_at')
      .eq('shop', shopDomain)
      .eq('customer_email', customerEmail);

    if (convs && convs.length > 0) {
      const convIds = convs.map((c: { id: string }) => c.id);
      const { data: messages } = await supabase
        .from('wismo_messages')
        .select('role, content, intent, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: true });

      const { data: feedback } = await supabase
        .from('wismo_feedback')
        .select('rating, comment, created_at')
        .in('conversation_id', convIds);

      // SECURITY: Do NOT store the full data package (containing PII) in the database.
      // Only log summary stats. The merchant must contact support to receive the data.
      const convCount = convs.length;
      const msgCount = (messages || []).length;
      const fbCount = (feedback || []).length;

      console.log(`[GDPR] 📦 Customer data package prepared for ${shopDomain}: ${convCount} conversations, ${msgCount} messages, ${fbCount} feedback`);

      // Log the request with metadata summary only (no PII in metadata)
      await supabase.from('wismo_messages').insert({
        conversation_id: convIds[0],
        role: 'system',
        content: `GDPR data request received for customer at ${shopDomain}. Data package contains ${convCount} conversations, ${msgCount} messages, ${fbCount} feedback items. Will be provided within 30 days. Contact haimozhouqiu@outlook.com to request the data package.`,
        intent: 'gdpr_data_request',
        metadata: {
          data_request: true,
          conv_count: convCount,
          msg_count: msgCount,
          fb_count: fbCount,
          requested_at: new Date().toISOString(),
          // Full data package NOT stored in DB for security — only in logs
        },
      }).then(() => {
        console.log('[GDPR] Data request logged as system message');
      }).catch(() => {
        console.log('[GDPR] Data request logged (could not insert system message)');
      });
    } else {
      console.log(`[GDPR] No data found for requested customer at ${shopDomain}`);
    }
  }
}

async function handleCustomersRedact(shopDomain: string, payload: any) {
  const customerEmail = payload.customer?.email;
  const customerId = payload.customer?.id;
  console.log(`[GDPR] Customer redact: shop_id=${payload.shop_id}, customer_id=${customerId}`);

  if (shopDomain && customerEmail) {
    const supabase = getSupabaseAdmin();

    const { data: convs } = await supabase
      .from('wismo_conversations')
      .select('id')
      .eq('shop', shopDomain)
      .eq('customer_email', customerEmail);

    if (convs && convs.length > 0) {
      const convIds = convs.map((c: { id: string }) => c.id);
      await supabase.from('wismo_messages').delete().in('conversation_id', convIds);
      await supabase.from('wismo_feedback').delete().in('conversation_id', convIds);
      await supabase
        .from('wismo_conversations')
        .update({ customer_email: '[REDACTED]', customer_name: '[REDACTED]' })
        .in('id', convIds);
      console.log(`[GDPR] ✅ Redacted ${convIds.length} conversations for customer ${customerId}`);
    }
  }
}

async function handleShopRedact(shopDomain: string) {
  if (!shopDomain) return;
  console.log(`[GDPR] Shop redact: deleting all data for ${shopDomain}`);
  const deleted = await deleteStore(shopDomain);
  if (deleted) {
    console.log(`[GDPR] ✅ All data deleted for ${shopDomain} (shop/redact)`);
  } else {
    console.error(`[GDPR] ❌ Failed to delete data for ${shopDomain}`);
  }
}
