/**
 * /app - WISMO AI Dashboard v3
 * Premium SaaS dashboard with guided empty state
 */
import { json } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { authenticateAdmin, getAuthUrl, SCOPES } from '~/shopify.server';
import { getSupabaseAdmin, getStore } from '~/services/supabase.server';
import { useEffect, useRef, useState } from 'react';

// Required scopes — must match shopify.app.toml
const REQUIRED_SCOPES = SCOPES.split(',').map(s => s.trim()).sort();

// Unified loader return type
type DashboardData = {
  shop: string | null;
  status: 'ok' | 'need_reauth' | 'need_auth' | 'unauthenticated';
  missingScopes?: string[];
  oauthUrl?: string;
  shopDomain?: string;
  settings: { enabled: boolean; widget_color: string; widget_position: string; greeting: string };
  analytics: { totalConversations: number; totalWismo: number; totalAutoResolved: number; totalHandoffs: number; resolutionRate: number; timeSavedMin: number; daily: any[] };
  recentConversations: any[];
  hasData: boolean;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');

  try {
    const { session } = await authenticateAdmin(request);

    // Check if session has all required scopes — if not, redirect to re-auth
    const supabase = getSupabaseAdmin();
    const { data: sessionData } = await supabase
      .from('shopify_sessions')
      .select('scope')
      .eq('shop', session.shop)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionData?.scope) {
      const currentScopes = sessionData.scope.split(',').map((s: string) => s.trim()).sort();
      const missingScopes = REQUIRED_SCOPES.filter((s: string) => !currentScopes.includes(s));
      if (missingScopes.length > 0) {
        console.log(`[Dashboard] Missing scopes: ${missingScopes.join(', ')} — redirecting to re-auth`);
        const state = crypto.randomUUID();
        const oauthUrl = getAuthUrl(session.shop, state);
        return json<DashboardData>({
          shop: session.shop,
          status: 'need_reauth',
          missingScopes,
          oauthUrl,
          settings: { enabled: true, widget_color: '#008060', widget_position: 'bottom-right', greeting: 'Track your order in seconds' },
          analytics: { totalConversations: 0, totalWismo: 0, totalAutoResolved: 0, totalHandoffs: 0, resolutionRate: 0, timeSavedMin: 0, daily: [] },
          recentConversations: [],
          hasData: false,
        });
      }
    }
    
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

    return json<DashboardData>({
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
      return json<DashboardData>({ shop: null, status: 'need_auth' as const, shopDomain, oauthUrl, settings: { enabled: true, widget_color: '#008060', widget_position: 'bottom-right', greeting: '' }, analytics: { totalConversations: 0, totalWismo: 0, totalAutoResolved: 0, totalHandoffs: 0, resolutionRate: 0, timeSavedMin: 0, daily: [] }, recentConversations: [], hasData: false });
    }
    return json<DashboardData>({ shop: null, status: 'unauthenticated' as const, settings: { enabled: true, widget_color: '#008060', widget_position: 'bottom-right', greeting: '' }, analytics: { totalConversations: 0, totalWismo: 0, totalAutoResolved: 0, totalHandoffs: 0, resolutionRate: 0, timeSavedMin: 0, daily: [] }, recentConversations: [], hasData: false });
  }
}

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 1500, delay: number = 0) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    const timeout = setTimeout(() => {
      const startTime = Date.now();
      const step = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    }, delay);

    return () => clearTimeout(timeout);
  }, [started, target, duration, delay]);

  return { value, ref };
}

// Format time saved
function formatTimeSaved(minutes: number): string {
  if (minutes >= 60) return `${Math.round(minutes / 60)}h`;
  return `${minutes}m`;
}

// Get welcome message based on time
function getWelcomeMessage(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();

  if (data.status === 'need_reauth') {
    return (
      <div className="onboarding">
        <div className="onboarding-card">
          <div className="onboarding-icon" style={{ background: '#fef3c7' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round"><path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
          </div>
          <h1>Update Required</h1>
          <p>WISMO AI needs additional permissions to work properly. Missing scopes: <strong>{data.missingScopes?.join(', ')}</strong></p>
          <a href={data.oauthUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
            Re-authorize App
          </a>
          <p className="onboarding-hint">After authorization, refresh this page.</p>
        </div>
      </div>
    );
  }

  if (data.status === 'need_auth') {
    return (
      <div className="onboarding">
        <div className="onboarding-card">
          <div className="onboarding-icon">
            <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
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
  const convCounter = useAnimatedCounter(stats.totalConversations, 1200, 100);
  const wismoCounter = useAnimatedCounter(stats.totalWismo, 1400, 200);
  const resolvedCounter = useAnimatedCounter(stats.resolutionRate, 1000, 300);
  const timeCounter = useAnimatedCounter(stats.timeSavedMin, 1600, 400);

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

      {/* Welcome message */}
      <div className="welcome-msg">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        <span>{getWelcomeMessage()}</span> — Here's your chatbot performance
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
            <svg width="52" height="52" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="16" fill="#e3f0ea"/>
              <path d="M16 40V28C16 21.3726 21.3726 16 28 16H36C42.6274 16 48 21.3726 48 28V40" stroke="#008060" strokeWidth="3.5" strokeLinecap="round"/>
              <circle cx="22" cy="44" r="4" fill="#008060"/>
              <circle cx="42" cy="44" r="4" fill="#008060"/>
            </svg>
          </div>
          <h2>Your chatbot is ready!</h2>
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
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div className="stat-value" ref={convCounter.ref}>{convCounter.value}</div>
              <div className="stat-label">Conversations (7d)</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e8f0fe', color: '#2563eb' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </div>
              <div className="stat-value" ref={wismoCounter.ref}>{wismoCounter.value}</div>
              <div className="stat-label">Order Queries</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dcfce7', color: '#059669' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div className="stat-value highlight" ref={resolvedCounter.ref}>{resolvedCounter.value}%</div>
              <div className="stat-label">Auto-resolved</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div className="stat-value" ref={timeCounter.ref}>{formatTimeSaved(timeCounter.value)}</div>
              <div className="stat-label">Time Saved</div>
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="card">
            <h2>Recent Conversations</h2>
            {recentConversations.length === 0 ? (
              <div className="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <p>No conversations yet this week. Customers will appear here once they start chatting!</p>
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
                      <td style={{ fontWeight: 600 }}>{conv.customer_name || 'Guest'}</td>
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

      {/* How it Works — professional SVG icons with connecting line */}
      <div className="card how-it-works">
        <h2>How WISMO AI Works</h2>
        <div className="hiw-steps">
          <div className="hiw-step">
            <div className="hiw-step-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div className="hiw-step-label">Customer asks</div>
            <div className="hiw-step-sub">"Where's my order?"</div>
          </div>
          <div className="hiw-connector"></div>
          <div className="hiw-step">
            <div className="hiw-step-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            </div>
            <div className="hiw-step-label">AI finds order</div>
            <div className="hiw-step-sub">Real-time lookup</div>
          </div>
          <div className="hiw-connector"></div>
          <div className="hiw-step">
            <div className="hiw-step-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div className="hiw-step-label">Instant reply</div>
            <div className="hiw-step-sub">Status & tracking</div>
          </div>
          <div className="hiw-connector"></div>
          <div className="hiw-step">
            <div className="hiw-step-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div className="hiw-step-label">Ticket resolved</div>
            <div className="hiw-step-sub">No human needed</div>
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
