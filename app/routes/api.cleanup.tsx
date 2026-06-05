/**
 * POST /api/cleanup - Data retention cleanup
 * 
 * Purges data that exceeds our stated retention periods:
 * - Conversations & messages: 90 days from last_message_at
 * - Customer PII: anonymize after 90 days of inactivity
 * - Analytics: 12 months retention
 * 
 * Called periodically (e.g., daily cron) or manually.
 * Protected by a shared secret key.
 */
import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { getSupabaseAdmin } from '~/services/supabase.server';

const CLEANUP_KEY = process.env.CLEANUP_SECRET || 'wismo-cleanup-2026';

export async function action({ request }: ActionFunctionArgs) {
  // Verify authorization
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (key !== CLEANUP_KEY) {
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
      const { count: piiAnonymized } = await supabase
        .from('wismo_conversations')
        .update({ customer_email: '[REDACTED]', customer_name: '[REDACTED]' })
        .in('id', oldConvIds);
      results.pii_anonymized = oldConvIds.length;
    }

    // 2. Delete conversations and messages older than 90 days (already anonymized)
    const { count: deletedConvs } = await supabase
      .from('wismo_conversations')
      .delete({ count: 'exact' })
      .lt('last_message_at', ninetyDaysAgo.toISOString());
    results.conversations_deleted = deletedConvs || 0;

    // 3. Delete analytics older than 12 months
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

export async function loader() {
  return json({ error: 'Method not allowed' }, { status: 405 });
}
