import { json } from '@shopify/remix-oxygen';
import { Link } from '@remix-run/react';

export const meta = () => [
  { title: 'Privacy Policy - Haimo AI Lister' },
  { description: 'Privacy Policy for Haimo AI Lister Shopify App' },
];

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', lineHeight: '1.6', color: '#1a1a1a' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Privacy Policy for Haimo AI Lister</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '32px' }}>Last updated: June 3, 2026</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Overview</h2>
      <p>Haimo AI Lister (&quot;we&quot;, &quot;our&quot;, or &quot;the App&quot;) is committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Data We Collect</h2>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Shop store domain</strong>: Collected during OAuth to identify your store and provide app functionality.</li>
        <li style={{ marginBottom: '6px' }}><strong>Access token</strong>: Shopify access token stored securely to make API calls on your behalf for product listing generation.</li>
        <li style={{ marginBottom: '6px' }}><strong>Product data you submit</strong>: Product titles, descriptions, and attributes that you submit for AI-powered description generation. Processed in real-time and not stored after generation.</li>
        <li style={{ marginBottom: '6px' }}><strong>Generated descriptions</strong>: AI-generated product descriptions returned to your Shopify store.</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>What We Do NOT Collect</h2>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>Personal customer data from your store</li>
        <li style={{ marginBottom: '6px' }}>Order or payment information</li>
        <li style={{ marginBottom: '6px' }}>Analytics or tracking data</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Third-Party Services</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '16px 0' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #e5e7eb', padding: '10px 12px', textAlign: 'left', background: '#f9fafb' }}>Service</th>
            <th style={{ border: '1px solid #e5e7eb', padding: '10px 12px', textAlign: 'left', background: '#f9fafb' }}>Purpose</th>
            <th style={{ border: '1px solid #e5e7eb', padding: '10px 12px', textAlign: 'left', background: '#f9fafb' }}>Data Shared</th>
            <th style={{ border: '1px solid #e5e7eb', padding: '10px 12px', textAlign: 'left', background: '#f9fafb' }}>Server Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>DeepSeek</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>AI text generation</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Product data only (not stored)</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>China</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Shopify</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Store integration</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Access token, product data</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>United States / Canada</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Supabase</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Data storage</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Session data, access tokens</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Singapore</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Vercel</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>App hosting</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>HTTP request data</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>United States</td>
          </tr>
        </tbody>
      </table>

      <div style={{ background: '#fff7ed', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #fed7aa' }}>
        <p><strong>⚠️ Important Notice for EU/EEA Users:</strong> This App uses DeepSeek as its AI provider, whose servers are located in China. When you generate product descriptions, your product data is transmitted to DeepSeek&apos;s servers for AI processing. DeepSeek processes the data in real-time and does not retain it after generating the response.</p>
      </div>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>GDPR Safeguards for International Transfers</h2>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>All data transfers are encrypted in transit using TLS 1.2+</li>
        <li style={{ marginBottom: '6px' }}>DeepSeek processes data in real-time and does not retain your product data after generating responses</li>
        <li style={{ marginBottom: '6px' }}>We minimize the data sent to AI providers — only product titles and attributes, no personal data</li>
        <li style={{ marginBottom: '6px' }}>You may uninstall the App at any time to stop all data processing</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Data Retention</h2>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Access tokens</strong>: Stored until you uninstall the App. Automatically deleted upon uninstallation via Shopify webhook.</li>
        <li style={{ marginBottom: '6px' }}><strong>Product data</strong>: Not stored by our App. Sent directly to AI provider for processing and discarded.</li>
        <li style={{ marginBottom: '6px' }}><strong>Session data</strong>: Stored in Supabase. Deleted when App is uninstalled.</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Your Rights</h2>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Right to access</strong>: Request a copy of your personal data.</li>
        <li style={{ marginBottom: '6px' }}><strong>Right to erasure</strong>: Request deletion of your data. Uninstalling the App triggers automatic data deletion.</li>
        <li style={{ marginBottom: '6px' }}><strong>Right to data portability</strong>: Request your data in a machine-readable format.</li>
        <li style={{ marginBottom: '6px' }}><strong>Right to object</strong>: Object to processing of your personal data.</li>
      </ul>
      <p>To exercise these rights, contact us at <a href="mailto:haimozhouqiu@outlook.com" style={{ color: '#2563eb' }}>haimozhouqiu@outlook.com</a>. We will respond within 30 days.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Shopify Data Compliance</h2>
      <p>This App complies with Shopify&apos;s mandatory privacy requirements:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>We implement <strong>customers/data_request</strong> webhook to handle data access requests</li>
        <li style={{ marginBottom: '6px' }}>We implement <strong>customers/redact</strong> webhook to handle data deletion requests</li>
        <li style={{ marginBottom: '6px' }}>We implement <strong>shop/redact</strong> webhook to delete all shop data upon uninstallation</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Contact</h2>
      <p>Questions about this privacy policy? Contact us at: <a href="mailto:haimozhouqiu@outlook.com" style={{ color: '#2563eb' }}>haimozhouqiu@outlook.com</a></p>
    </div>
  );
}
