import { json } from '@remix-run/node';
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

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Age Restriction</h2>
      <p>Our services are not intended for individuals under the age of 16 (or the applicable age of consent in your jurisdiction). We do not knowingly collect personal information from children. If you believe we have collected information from a child under the applicable age, please contact us immediately at <a href="mailto:haimozhouqiu@outlook.com" style={{ color: '#2563eb' }}>haimozhouqiu@outlook.com</a>, and we will take steps to delete such information.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>AI Transparency Statement</h2>
      <p>This service uses artificial intelligence (DeepSeek) to generate product descriptions. Users should be aware that AI-generated outputs may contain inaccuracies and should verify content independently before publishing. While we implement quality measures, we cannot guarantee the accuracy, completeness, or suitability of AI-generated content.</p>
      <p style={{ marginTop: '8px' }}>AI-generated content is considered transformative in nature as it creates new, original text based on user-provided product information. Users remain responsible for reviewing and editing all generated content and ensuring its compliance with applicable laws and regulations.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Cookie Policy</h2>
      <p>We use limited cookies and similar technologies to provide and improve our service:</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '16px 0' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #e5e7eb', padding: '10px 12px', textAlign: 'left', background: '#f9fafb' }}>Cookie Type</th>
            <th style={{ border: '1px solid #e5e7eb', padding: '10px 12px', textAlign: 'left', background: '#f9fafb' }}>Purpose</th>
            <th style={{ border: '1px solid #e5e7eb', padding: '10px 12px', textAlign: 'left', background: '#f9fafb' }}>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Essential Cookies</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Required for authentication and session management</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Session</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Functional Cookies</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Store user preferences and settings</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>30 days</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Analytics Cookies</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>We do not use third-party analytics cookies</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>N/A</td>
          </tr>
        </tbody>
      </table>
      <p>You can control cookie preferences through your browser settings. Disabling essential cookies may affect the functionality of the App.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>EU Consumer Rights (14-Day Withdrawal)</h2>
      <p>If you are located in the European Union or European Economic Area, you have the following consumer rights under EU consumer protection laws:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Right of Withdrawal:</strong> You have the right to withdraw from your subscription contract within 14 days without giving any reason. The withdrawal period expires 14 days after the day on which you subscribed.</li>
        <li style={{ marginBottom: '6px' }}><strong>Exercise of Withdrawal:</strong> To exercise the right of withdrawal, you must inform us (Haimo Tech) of your decision to withdraw by an unequivocal statement (e.g., a letter sent by email to <a href="mailto:haimozhouqiu@outlook.com" style={{ color: '#2563eb' }}>haimozhouqiu@outlook.com</a>).</li>
        <li style={{ marginBottom: '6px' }}><strong>Reimbursement:</strong> We will reimburse all payments received from you, including the cost of delivery (if any), without undue delay and not later than 14 days from the day on which we are informed about your decision to withdraw.</li>
        <li style={{ marginBottom: '6px' }}><strong>Exceptions:</strong> The right of withdrawal does not apply to services fully performed before the end of the withdrawal period with your express consent, or to digital content that is supplied in a limited manner (e.g., credits used).</li>
      </ul>

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
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Tokyo, Japan</td>
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

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Disclaimer</h2>
      <div style={{ background: '#fff7ed', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #fed7aa' }}>
        <p><strong>Important:</strong> Haimo AI Lister is an independent third-party application developed by Haimo Tech. It is not affiliated with, endorsed by, or sponsored by Shopify Inc. &quot;Shopify&quot; is a trademark of Shopify Inc. This App uses the Shopify API in accordance with Shopify&apos;s API Terms of Service.</p>
      </div>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Geographic Restrictions</h2>
      <p>This App is not available to users in mainland China. By installing and using this App, you confirm that you are not a resident of or accessing the service from the People&apos;s Republic of China (excluding Hong Kong, Macau, and Taiwan).</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>CCPA Compliance (California Users)</h2>
      <p>If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA):</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Right to Know:</strong> Request information about the personal data we collect and how it is used</li>
        <li style={{ marginBottom: '6px' }}><strong>Right to Delete:</strong> Request deletion of your personal information</li>
        <li style={{ marginBottom: '6px' }}><strong>Right to Opt Out:</strong> We do not sell personal information. There is nothing to opt out of</li>
        <li style={{ marginBottom: '6px' }}><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your rights</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>EU AI Act Compliance</h2>
      <p>This App uses artificial intelligence to generate product descriptions. In accordance with the EU Artificial Intelligence Act:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Transparency:</strong> All AI-generated content is clearly labeled and includes a disclaimer about potential inaccuracies</li>
        <li style={{ marginBottom: '6px' }}><strong>Human Oversight:</strong> Users can review, verify, and edit all AI-generated content before publishing</li>
        <li style={{ marginBottom: '6px' }}><strong>No Automated Decisions:</strong> The App does not make decisions that produce legal effects for users</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Data Breach Notification</h2>
      <p>In the event of a data breach affecting your personal information, we will:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>Notify affected users within 72 hours, as required by GDPR Article 33</li>
        <li style={{ marginBottom: '6px' }}>Notify the relevant supervisory authority if the breach poses a risk to individuals&apos; rights</li>
        <li style={{ marginBottom: '6px' }}>Take immediate steps to contain the breach and prevent further data loss</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Contact</h2>
      <p>Questions about this privacy policy? Contact us at: <a href="mailto:haimozhouqiu@outlook.com" style={{ color: '#2563eb' }}>haimozhouqiu@outlook.com</a></p>
    </div>
  );
}
