/**
 * /api/cleanup - Data retention cleanup
 *
 * Purges data that exceeds our stated retention periods:
 * - Conversations & messages: 90 days from last_message_at
 * - Customer PII: anonymize after 90 days of inactivity
 * - GDPR data-request metadata: scrub data_package after 30 days (Art.15)
 * - Analytics: 12 months retention
 *
 * Auth: ?key={CLEANUP_SECRET} OR Authorization: Bearer {CLEANUP_SECRET}.
 *
 * Methods: BOTH GET and POST are accepted, because:
 *   - Vercel Cron triggers ONLY GET requests
 *     (https://vercel.com/docs/cron-jobs)
 *     — if loader returned 405, cron would silently fail forever.
 *   - Manual triggers / external schedulers may use POST with key in query.
 * Both methods invoke the same handler.
 */
import { json } from '@remix-run/node';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { getSupabaseAdmin } from '~/services/supabase.server';

const CLEANUP_KEY = process.env.CLEANUP_SECRET;
if (!CLEANUP_KEY) console.warn('[Cleanup] CLEANUP_SECRET env var not set — endpoint disabled');

/** Verify the caller is authorized via ?key= or Authorization: Bearer. */
function isAuthorized(request: Request): boolean {
  if (!CLEANUP_KEY) return false;
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('key');
  if (queryKey === CLEANUP_KEY) return true;
  const auth = request.headers.get('authorization') || '';
  if (auth === `Bearer ${CLEANUP_KEY}`) return true;
  return false;
}

async function runCleanup(request: Request) {
  if (!isAuthorized(request)) {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const now = new Date();
  const results: Record<string, number> = {};

  try {
    // 1. Anonymize PII in conversations inactive for 90+ days
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: oldConvs } = await supabase
      .from('wismo_conversations')
      .select('id')
      .lt('last_message_at', ninetyDaysAgo.toISOString())
      .not('customer_email', 'eq', '[REDACTED]');

    if (oldConvs && oldConvs.length > 0) {
      const oldConvIds = oldConvs.map((c: { id: string }) => c.id);

      // Anonymize PII
      await supabase
        .from('wismo_conversations')
        .update({ customer_email: '[REDACTED]', customer_name: '[REDACTED]' })
        .in('id', oldConvIds);
      results.pii_anonymized = oldConvIds.length;
    } else {
      results.pii_anonymized = 0;
    }

    // 2. Scrub PII from GDPR data request metadata in messages
    // GDPR Art.15 requires data request fulfillment within 30 days.
    // After 30 days, the data_package in metadata is no longer needed and must be scrubbed.
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: gdprMessages } = await supabase
      .from('wismo_messages')
      .select('id, metadata')
      .eq('intent', 'gdpr_data_request')
      .lt('created_at', thirtyDaysAgo.toISOString());

    let metadataScrubbed = 0;
    if (gdprMessages && gdprMessages.length > 0) {
      for (const msg of gdprMessages) {
        const meta = msg.metadata;
        if (meta && meta.data_package) {
          meta.data_package = { redacted: true, reason: 'GDPR data request fulfilled - 30 day PII cleanup' };
          await supabase
            .from('wismo_messages')
            .update({ metadata: meta })
            .eq('id', msg.id);
          metadataScrubbed++;
        }
      }
    }
    results.metadata_scrubbed = metadataScrubbed;

    // 3. Delete conversations and messages older than 90 days (already anonymized)
    const { count: deletedConvs } = await supabase
      .from('wismo_conversations')
      .delete({ count: 'exact' })
      .lt('last_message_at', ninetyDaysAgo.toISOString());
    results.conversations_deleted = deletedConvs || 0;

    // 4. Delete analytics older than 12 months
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const { count: deletedAnalytics } = await supabase
      .from('wismo_analytics')
      .delete({ count: 'exact' })
      .lt('date', twelveMonthsAgo.toISOString().split('T')[0]);
    results.analytics_deleted = deletedAnalytics || 0;

    console.log(`[Cleanup] ✅ Data retention cleanup completed:`, results);
    return json({ success: true, results, timestamp: now.toISOString() });
  } catch (e) {
    console.error('[Cleanup] Error:', e);
    return json({ error: 'Cleanup failed', results }, { status: 500 });
  }
}

// Both Vercel Cron (GET) and manual triggers (POST) call the same handler.
export const loader = ({ request }: LoaderFunctionArgs) => runCleanup(request);
export const action = ({ request }: ActionFunctionArgs) => runCleanup(request);
