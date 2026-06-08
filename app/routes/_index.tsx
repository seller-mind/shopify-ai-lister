/**
 * / - WISMO AI Landing Page
 * Product introduction page for App Store review and SEO
 */
import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');
  
  // If shop param present, redirect to app dashboard (embedded Shopify admin)
  if (shop) {
    return new Response(null, {
      status: 302,
      headers: { Location: `/app?shop=${encodeURIComponent(shop)}` },
    });
  }
  
  return json({ appUrl: process.env.SHOPIFY_APP_URL || 'https://shopify-ai-lister-tau.vercel.app' });
}

export default function LandingPage() {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1a1a1a', lineHeight: 1.6 }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #008060 0%, #00664d 100%)', color: '#fff', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '44px', fontWeight: 800, marginBottom: '16px', lineHeight: 1.15 }}>
            AI-Powered Order Tracking for Shopify
          </h1>
          <p style={{ fontSize: '20px', opacity: 0.92, marginBottom: '32px', maxWidth: '560px', margin: '0 auto 32px' }}>
            Stop answering &quot;Where is my order?&quot; — WISMO AI tracks orders instantly, in any language, 24/7.
          </p>
          <a href="https://apps.shopify.com/wismo-ai" style={{ display: 'inline-block', padding: '16px 40px', background: '#fff', color: '#008060', borderRadius: '12px', fontWeight: 700, fontSize: '17px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,0,0,.15)' }}>
            Install Free on Shopify
          </a>
          <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '16px' }}>Free plan available · No credit card required · Setup in 2 minutes</p>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 700, marginBottom: '48px' }}>
          Why Merchants Love WISMO AI
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
          {[
            { icon: '⚡', title: 'Instant Order Tracking', desc: 'Customers enter their order number and get real-time status, tracking info, and delivery estimates — zero wait time.' },
            { icon: '🌍', title: '20+ Languages', desc: 'Auto-detects customer language and responds accordingly. English, Chinese, Spanish, French, Japanese, and 20+ more.' },
            { icon: '🤖', title: 'Smart AI Responses', desc: 'WISMO queries are answered instantly with zero AI calls. General questions use AI with your brand voice and FAQ items.' },
            { icon: '🎨', title: 'Customizable Widget', desc: 'Match your brand with custom colors, greeting messages, and position. Live preview in settings.' },
            { icon: '🔒', title: 'Privacy First', desc: 'GDPR compliant with data request and deletion support. 90-day data retention. SOC 2 aligned infrastructure.' },
            { icon: '📊', title: 'Analytics Dashboard', desc: 'Track conversations, resolution rates, and time saved. See what customers ask and how WISMO handles it.' },
          ].map((f, i) => (
            <div key={i} style={{ padding: '24px', background: '#f8fafb', borderRadius: '16px', border: '1px solid #f1f3f5' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '14px', color: '#6d7175', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div style={{ background: '#f8fafb', padding: '64px 24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '48px' }}>Simple, Transparent Pricing</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {[
              { name: 'Free', price: '$0', period: '', features: ['10 conversations/month', 'Order tracking', 'Multi-language', '1 store'], cta: 'Get Started' },
              { name: 'Starter', price: '$15', period: '/mo', features: ['50 conversations/month', 'FAQ auto-reply', '7-day free trial', '1 store'], cta: 'Start Free Trial', featured: true },
              { name: 'Pro', price: '$49', period: '/mo', features: ['500 conversations/month', 'Custom brand voice', 'Analytics dashboard', 'Priority support'], cta: 'Start Free Trial' },
            ].map((p, i) => (
              <div key={i} style={{ padding: '32px 24px', background: p.featured ? '#fff' : '#fff', borderRadius: '16px', border: p.featured ? '2px solid #008060' : '1px solid #e1e3e5', boxShadow: p.featured ? '0 8px 32px rgba(0,128,96,.12)' : 'none' }}>
                {p.featured && <div style={{ background: '#008060', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, display: 'inline-block', marginBottom: '12px' }}>Most Popular</div>}
                <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>{p.name}</h3>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#008060', marginBottom: '20px' }}>{p.price}<span style={{ fontSize: '14px', fontWeight: 400, color: '#6d7175' }}>{p.period}</span></div>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '24px', textAlign: 'left' }}>
                  {p.features.map((f, j) => (
                    <li key={j} style={{ padding: '6px 0', fontSize: '14px', color: '#1a1a1a' }}>✓ {f}</li>
                  ))}
                </ul>
                <a href="https://apps.shopify.com/wismo-ai" style={{ display: 'block', padding: '12px', background: p.featured ? '#008060' : '#f1f3f5', color: p.featured ? '#fff' : '#1a1a1a', borderRadius: '10px', fontWeight: 600, fontSize: '14px', textDecoration: 'none', textAlign: 'center' }}>{p.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#1a1a2e', color: '#999', padding: '32px 24px', textAlign: 'center', fontSize: '13px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <p style={{ marginBottom: '8px' }}>WISMO AI — AI-powered order tracking for Shopify stores</p>
          <p>
            <a href="/privacy" style={{ color: '#999', textDecoration: 'none' }}>Privacy</a> · 
            <a href="/terms" style={{ color: '#999', textDecoration: 'none' }}>Terms</a> · 
            <a href="/dpa" style={{ color: '#999', textDecoration: 'none' }}>DPA</a> · 
            <a href="/dmca" style={{ color: '#999', textDecoration: 'none' }}>DMCA</a>
          </p>
          <p style={{ marginTop: '16px', fontSize: '12px' }}>© 2026 Haimo Tech. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
