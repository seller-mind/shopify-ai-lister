/**
 * /app - WISMO AI Dashboard
 * Main admin page shown inside Shopify admin iframe
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
    const { session, admin } = await authenticateAdmin(request);
    
    // Get WISMO settings
    let settings = null;
    let analytics = null;
    
    try {
      const supabase = getSupabaseAdmin();
      const { data: s } = await supabase
        .from('wismo_settings')
        .select('*')
        .eq('shop', session.shop)
        .single();
      settings = s;
    } catch { /* defaults */ }

    try {
      const supabase = getSupabaseAdmin();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: a } = await supabase
        .from('wismo_analytics')
        .select('*')
        .eq('shop', session.shop)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });
      analytics = a || [];
    } catch { /* empty */ }

    // Get recent conversations
    let recentConversations: any[] = [];
    try {
      const supabase = getSupabaseAdmin();
      const { data: convs } = await supabase
        .from('wismo_conversations')
        .select('id, customer_name, first_message, status, last_message_at, created_at')
        .eq('shop', session.shop)
        .order('last_message_at', { ascending: false })
        .limit(10);
      recentConversations = convs || [];
    } catch { /* empty */ }

    // Calculate summary stats
    const totalConversations = analytics?.reduce((sum: number, a: any) => sum + (a.total_conversations || 0), 0) || 0;
    const totalWismo = analytics?.reduce((sum: number, a: any) => sum + (a.wismo_queries || 0), 0) || 0;
    const totalAutoResolved = analytics?.reduce((sum: number, a: any) => sum + (a.auto_resolved || 0), 0) || 0;
    const totalHandoffs = analytics?.reduce((sum: number, a: any) => sum + (a.handoffs || 0), 0) || 0;
    const resolutionRate = totalConversations > 0 ? Math.round((totalAutoResolved / totalConversations) * 100) : 0;

    return json({
      shop: session.shop,
      status: 'ok',
      settings: settings || { enabled: true, widget_color: '#008060', widget_position: 'bottom-right', greeting: 'Hi! 👋 How can I help you today?' },
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '40px', fontFamily: 'system-ui, -apple-system, sans-serif', textAlign: 'center' }}>
        <div style={{ maxWidth: '460px', padding: '48px 40px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', background: '#fff' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: '#1a1a1a' }}>
            Welcome to WISMO AI
          </h1>
          <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.6, marginBottom: '32px' }}>
            AI-powered order tracking chatbot for your Shopify store. Authorize to get started.
          </p>
          <a href={data.oauthUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '14px 36px', fontSize: '16px', fontWeight: 600, color: '#fff', background: '#008060', borderRadius: '8px', textDecoration: 'none' }}>
            Authorize App
          </a>
          <p style={{ fontSize: '13px', color: '#999', marginTop: '24px', lineHeight: 1.5 }}>
            After authorization, come back to this page and refresh.
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
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>💬 WISMO AI</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>AI-powered order tracking & customer support</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/app/settings" className="btn" style={{ background: '#f6f6f7', color: '#1a1a1a' }}>⚙️ Settings</Link>
          <Link to="/app/billing" className="btn btn-primary">Upgrade Plan</Link>
        </div>
      </div>

      {/* Status Banner */}
      <div style={{ background: settings.enabled ? '#e3f1e8' : '#fef3cd', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
        <span style={{ fontSize: '18px' }}>{settings.enabled ? '✅' : '⏸️'}</span>
        <span>Widget is <strong>{settings.enabled ? 'active' : 'paused'}</strong> on your store</span>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Conversations (7d)" value={stats.totalConversations} icon="💬" />
        <StatCard label="Order Queries" value={stats.totalWismo} icon="📦" />
        <StatCard label="Auto-resolved" value={stats.resolutionRate + '%'} icon="🤖" highlight />
        <StatCard label="Handoffs" value={stats.totalHandoffs} icon="👤" />
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Recent Conversations */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Recent Conversations</h2>
          {recentConversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <p style={{ fontSize: '32px', marginBottom: '8px' }}>💬</p>
              <p>No conversations yet. Install the widget on your store to get started!</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#666', fontWeight: 500 }}>Customer</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#666', fontWeight: 500 }}>Message</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#666', fontWeight: 500 }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#666', fontWeight: 500 }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentConversations.map((conv: any) => (
                  <tr key={conv.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 8px' }}>{conv.customer_name || 'Guest'}</td>
                    <td style={{ padding: '10px 8px', color: '#666', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.first_message}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ background: conv.status === 'active' ? '#e3f1e8' : conv.status === 'handoff' ? '#fef3cd' : '#f0f0f0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                        {conv.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', color: '#999' }}>{formatTime(conv.last_message_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, highlight }: { label: string; value: string | number; icon: string; highlight?: boolean }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{icon}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: highlight ? '#008060' : '#1a1a1a' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{label}</div>
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
