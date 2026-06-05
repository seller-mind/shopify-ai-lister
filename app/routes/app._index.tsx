/**
 * /app - WISMO AI Dashboard v3
 * Premium SaaS dashboard with guided empty state
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

    // Calculate time saved: avg 3 min per auto-resolved conversation
    const timeSavedMin = totalAutoResolved * 3;

    return json({
      shop: session.shop,
      status: 'ok',
      settings: settings || { enabled: true, widget_color: '#008060', widget_position: 'bottom-right', greeting: 'Track your order in seconds' },
      analytics: { totalConversations, totalWismo, totalAutoResolved, totalHandoffs, resolutionRate, timeSavedMin, daily: analytics || [] },
      recentConversations,
      hasData: totalConversations > 0,
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
      <div className="onboarding">
        <div className="onboarding-card">
          <div className="onboarding-icon">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#008060"/>
              <path d="M8 20V14C8 10.6863 10.6863 8 14 8H18C21.3137 8 24 10.6863 24 14V20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="10" cy="22" r="2" fill="white"/>
              <circle cx="22" cy="22" r="2" fill="white"/>
            </svg>
          </div>
          <h1>Welcome to WISMO AI</h1>
          <p>AI-powered order tracking that answers "Where is my order?" instantly — so you don't have to.</p>
          <a href={data.oauthUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
            Authorize App
          </a>
          <p className="onboarding-hint">After authorization, refresh this page.</p>
        </div>
      </div>
    );
  }

  const { settings, analytics: stats, recentConversations, hasData } = data;

  return (
    <div className="page">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1>Dashboard</h1>
          <p className="sub">Your AI chatbot at a glance</p>
        </div>
        <div className="dash-actions">
          <Link to="/app/settings" className="btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Settings
          </Link>
          <Link to="/app/billing" className="btn btn-primary">Upgrade</Link>
        </div>
      </div>

      {/* Status Pill */}
      <div className={`status-pill ${settings.enabled ? 'status-active' : 'status-paused'}`}>
        <span className="status-dot" />
        <span>Widget {settings.enabled ? 'Active' : 'Paused'}</span>
      </div>

      {!hasData ? (
        /* ─── Guided Empty State ────────────────────────────── */
        <div className="empty-hero">
          <div className="empty-hero-icon">
            <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="16" fill="#e3f0ea"/>
              <path d="M16 40V28C16 21.3726 21.3726 16 28 16H36C42.6274 16 48 21.3726 48 28V40" stroke="#008060" strokeWidth="3.5" strokeLinecap="round"/>
              <circle cx="22" cy="44" r="4" fill="#008060"/>
              <circle cx="42" cy="44" r="4" fill="#008060"/>
            </svg>
          </div>
          <h2>Your chatbot is ready! 🎉</h2>
          <p>Customers on your store can now track orders instantly. Here's what happens next:</p>
          <div className="empty-steps">
            <div className="empty-step">
              <div className="empty-step-num">1</div>
              <div>
                <div className="empty-step-title">Customers visit your store</div>
                <div className="empty-step-desc">They see the green chat bubble in the corner</div>
              </div>
            </div>
            <div className="empty-step">
              <div className="empty-step-num">2</div>
              <div>
                <div className="empty-step-title">They type their order number</div>
                <div className="empty-step-desc">WISMO AI responds instantly with order status</div>
              </div>
            </div>
            <div className="empty-step">
              <div className="empty-step-num">3</div>
              <div>
                <div className="empty-step-title">You save time & support costs</div>
                <div className="empty-step-desc">35-50% of support tickets are "where's my order?" — now answered automatically</div>
              </div>
            </div>
          </div>
          <div className="empty-cta">
            <Link to="/app/settings" className="btn btn-primary">Customize Your Widget</Link>
            <span className="empty-cta-or">or</span>
            <Link to="/app/billing" className="btn">View Plans</Link>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e3f0ea', color: '#008060' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div className="stat-value">{stats.totalConversations}</div>
              <div className="stat-label">Conversations (7d)</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e8f0fe', color: '#1967d2' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </div>
              <div className="stat-value">{stats.totalWismo}</div>
              <div className="stat-label">Order Queries</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dcfce7', color: '#166534' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div className="stat-value highlight">{stats.resolutionRate}%</div>
              <div className="stat-label">Auto-resolved</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef3cd', color: '#856404' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div className="stat-value">{stats.timeSavedMin >= 60 ? `${Math.round(stats.timeSavedMin / 60)}h` : `${stats.timeSavedMin}m`}</div>
              <div className="stat-label">Time Saved</div>
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="card">
            <h2>Recent Conversations</h2>
            {recentConversations.length === 0 ? (
              <div className="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <p>No conversations yet this week.</p>
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
        </>
      )}

      {/* How it Works — always visible */}
      <div className="card how-it-works">
        <h2>How WISMO AI Works</h2>
        <div className="hiw-grid">
          <div className="hiw-item">
            <div className="hiw-icon">💬</div>
            <div className="hiw-title">Customer asks</div>
            <div className="hiw-desc">"Where is my order?"</div>
          </div>
          <div className="hiw-arrow">→</div>
          <div className="hiw-item">
            <div className="hiw-icon">🤖</div>
            <div className="hiw-title">AI finds order</div>
            <div className="hiw-desc">Queries Shopify in real-time</div>
          </div>
          <div className="hiw-arrow">→</div>
          <div className="hiw-item">
            <div className="hiw-icon">📦</div>
            <div className="hiw-title">Instant reply</div>
            <div className="hiw-desc">Status, tracking & ETA</div>
          </div>
          <div className="hiw-arrow">→</div>
          <div className="hiw-item">
            <div className="hiw-icon">✅</div>
            <div className="hiw-title">Ticket resolved</div>
            <div className="hiw-desc">No human needed</div>
          </div>
        </div>
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
