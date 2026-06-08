/**
 * GET /api/chat/history - Returns message history for a conversation
 * Called by the storefront widget when restoring a previous session
 */
import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { getSupabaseAdmin } from '~/services/supabase.server';
import { addCorsHeaders, handleCorsPreflightRequest } from '~/utils/cors';

export async function loader({ request }: LoaderFunctionArgs) {
  const preflight = handleCorsPreflightRequest(request);
  if (preflight) return preflight;

  const url = new URL(request.url);
  const conversationId = url.searchParams.get('conversationId');
  const shop = url.searchParams.get('shop');

  if (!conversationId) {
    const h = new Headers(); addCorsHeaders(h, request);
    return json({ error: 'Missing conversationId' }, { status: 400, headers: h });
  }

  // Validate conversationId format (UUID)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId)) {
    const h = new Headers(); addCorsHeaders(h, request);
    return json({ error: 'Invalid conversationId' }, { status: 400, headers: h });
  }

  try {
    const db = getSupabaseAdmin();

    // Verify the conversation belongs to the shop (if shop provided)
    if (shop && /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop)) {
      const { data: conv } = await db.from('wismo_conversations')
        .select('shop')
        .eq('id', conversationId)
        .single();

      if (!conv || conv.shop !== shop) {
        const h = new Headers(); addCorsHeaders(h, request);
        return json({ error: 'Conversation not found' }, { status: 404, headers: h });
      }
    }

    // Fetch messages (last 50)
    const { data: messages, error } = await db.from('wismo_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('[WISMO] History fetch error:', error);
      const h = new Headers(); addCorsHeaders(h, request);
      return json({ messages: [] }, { headers: h });
    }

    const h = new Headers();
    addCorsHeaders(h, request);
    // Cache for 60 seconds to reduce repeated lookups
    h.set('Cache-Control', 'public, max-age=60');
    return json({
      conversationId,
      messages: (messages || []).map(m => ({
        role: m.role,
        content: m.content,
      })),
    }, { headers: h });
  } catch (e) {
    console.error('[WISMO] History error:', e);
    const h = new Headers(); addCorsHeaders(h, request);
    return json({ messages: [] }, { headers: h });
  }
}
