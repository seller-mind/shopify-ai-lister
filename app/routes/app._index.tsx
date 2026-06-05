/**
 * /app - WISMO AI Dashboard
 * Clean, professional admin page with Polaris-inspired design
 */
import { json } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { authenticateAdmin, getAuthUrl } from '~/shopify.server';
import { getSupabaseAdmin, getStore } from '~/services/supabase.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');

  try {
    const { session } = await authenticateAdmin(request);
    
    let settings = null;
    let analytics = null;
    
    try {
      const supabase = getSupabaseAdmin();
      const { data: s } = await supabase.from('wismo_settings').select('*').eq('shop', session.shop).single();
      settings = s;
    } catch { /* defaults */ }

    try {
      const supabase = getSupabaseAdmin();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: a } = await supabase.from('wismo_analytics').select('*').eq('shop', session.shop).gte('date', sevenDaysAgo.toISOString().split('T')[0]).order('date', { ascending: false });
      analytics = a || [];
    } catch { /* empty */ }

    let recentConversations: any[] = [];
    try {
      const supabase = getSupabaseAdmin();
      const { data: convs } = await supabase.from('wismo_conversations').select('id, customer_name, first_message, status, last_message_at, created_at').eq('shop', session.shop).order('last_message_at', { ascending: false }).limit(10);
      recentConversations = convs || [];
    } catch { /* empty */ }

    const totalConversations = analytics?.reduce((sum: number, a: any) => sum + (a.total_conversations || 0), 0) || 0;
    const totalWismo = analytics?.reduce((sum: number, a: any) => sum + (a.wismo_queries || 0), 0) || 0;
    const totalAutoResolved = analytics?.reduce((sum: number, a: any) => sum + (a.auto_resolved || 0), 0) || 0;
    const totalHandoffs = analytics?.reduce((sum: number, a: any) => sum + (a.handoffs || 0), 0) || 0;
    const resolutionRate = totalConversations > 0 ? Math.round((totalAutoResolved / totalConversations) * 100) : 0;

    return json({
      shop: session.shop,
      status: 'ok',
      settings: settings || { enabled: true, widget_color: '#008060', widget_position: 'bottom-right', greeting: 'Track your order in seconds' },
      analytics: { totalConversations, totalWismo, totalAutoResolved, totalHandoffs, resolutionRate, daily: analytics || [] },
      recentConversations,
    });
  } catch {
    if (shop) {
      const shopDomain = shop.replace(/https?:\/\//, '').split('/')[0];
      const state = crypto.randomUUID();
      const oauthUrl = getAuthUrl(shopDomain, state);
      return json({ shop: null, status: 'need_auth', shopDomain, oauthUrl });
    }
    return json({ shop: null, status: 'unauthenticated' });
  }
}

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();

  if (data.status === 'need_auth') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '40px' }}>
        <div style={{ maxWidth: '440px', padding: '48px 40px', borderRadius: '14px', border: '1px solid #e1e3e5', background: '#fff', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#e3f0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#008060"/>
              <path d="M8 20V14C8 10.6863 10.6863 8 14 8H18C21.3137 8 24 10.6863 24 14V20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="10" cy="22" r="2" fill="white"/>
              <circle cx="22" cy="22" r="2" fill="white"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#1c1c1e' }}>Welcome to WISMO AI</h1>
          <p style={{ fontSize: '14px', color: '#6d7175', lineHeight: 1.6, marginBottom: '28px' }}>
            AI-powered order tracking chatbot for your Shopify store. Authorize to get started.
          </p>
          <a href={data.oauthUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 32px', fontSize: '15px', fontWeight: 600, color: '#fff', background: '#008060', borderRadius: '8px', textDecoration: 'none' }}>
            Authorize App
          </a>
          <p style={{ fontSize: '12px', color: '#8c9196', marginTop: '20px', lineHeight: 1.5 }}>
            After authorization, come back and refresh this page.
          </p>
        </div>
      </div>
    );
  }

  const { settings, analytics: stats, recentConversations } = data;

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>Dashboard</h1>
          <p className="sub" style={{ marginBottom: 0 }}>Monitor your AI chatbot performance</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/app/settings" className="btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Settings
          </Link>
          <Link to="/app/billing" className="btn btn-primary">Upgrade</Link>
        </div>
      </div>

      {/* Status */}
      <div className={`banner ${settings.enabled ? 'banner-success' : 'banner-warning'}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          {settings.enabled
            ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
            : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
        </svg>
        <span>Widget is <strong>{settings.enabled ? 'active' : 'paused'}</strong> on your store</span>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalConversations}</div>
          <div className="stat-label">Conversations (7d)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalWismo}</div>
          <div className="stat-label">Order Queries</div>
        </div>
        <div className="stat-card">
          <div className="stat-value highlight">{stats.resolutionRate}%</div>
          <div className="stat-label">Auto-resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalHandoffs}</div>
          <div className="stat-label">Handoffs</div>
        </div>
      </div>

      {/* Conversations */}
      <div className="card">
        <h2>Recent Conversations</h2>
        {recentConversations.length === 0 ? (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <p>No conversations yet. Once customers start chatting, you'll see them here.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Message</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentConversations.map((conv: any) => (
                <tr key={conv.id}>
                  <td style={{ fontWeight: 500 }}>{conv.customer_name || 'Guest'}</td>
                  <td style={{ color: '#6d7175', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.first_message}</td>
                  <td>
                    <span className={`badge ${conv.status === 'active' ? 'badge-green' : conv.status === 'handoff' ? 'badge-yellow' : 'badge-gray'}`}>
                      {conv.status || 'new'}
                    </span>
                  </td>
                  <td style={{ color: '#8c9196', fontSize: '12px' }}>{formatTime(conv.last_message_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString();
}
