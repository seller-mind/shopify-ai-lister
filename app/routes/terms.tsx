import { json } from '@shopify/remix-oxygen';
import { Link } from '@remix-run/react';

export const meta = () => [
  { title: 'Terms of Service - Haimo AI Lister' },
  { description: 'Terms of Service for Haimo AI Lister Shopify App' },
];

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', lineHeight: '1.6', color: '#1a1a1a' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Terms of Service</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '32px' }}>Effective: June 4, 2026</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>1. Acceptance of Terms</h2>
      <p>By installing and using Haimo AI Lister (&quot;the App&quot;), you agree to these Terms of Service. If you do not agree, please uninstall the App immediately.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>2. Description of Service</h2>
      <p>Haimo AI Lister provides AI-powered product listing generation for Shopify stores. The App:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>Generates product descriptions using artificial intelligence</li>
        <li style={{ marginBottom: '6px' }}>Supports multi-language input with English output optimization</li>
        <li style={{ marginBottom: '6px' }}>Integrates with your Shopify store via the Shopify API</li>
        <li style={{ marginBottom: '6px' }}>AI-generated content may contain inaccuracies and should be reviewed before publishing</li>
        <li style={{ marginBottom: '6px' }}>Is not affiliated with, endorsed by, or connected to Shopify Inc.</li>
      </ul>

      <div style={{ background: '#fff7ed', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #fed7aa' }}>
        <p><strong>Disclaimer:</strong> Haimo AI Lister is an independent third-party application developed by Haimo Tech. &quot;Shopify&quot; is a trademark of Shopify Inc. This App uses the Shopify API in accordance with Shopify&apos;s API Terms of Service.</p>
      </div>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>3. AI-Generated Content Disclaimer</h2>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>All AI-generated content is for reference only</li>
        <li style={{ marginBottom: '6px' }}>You are responsible for reviewing and editing all generated content before publishing</li>
        <li style={{ marginBottom: '6px' }}>We do not guarantee the accuracy, completeness, or suitability of AI-generated content</li>
        <li style={{ marginBottom: '6px' }}>You are responsible for ensuring your use of generated content complies with Shopify&apos;s policies and applicable laws</li>
        <li style={{ marginBottom: '6px' }}>We are not responsible for any outcomes resulting from the use of AI-generated content</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>4. Usage Restrictions</h2>
      <p>You agree NOT to:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>Use the App for any unlawful purpose</li>
        <li style={{ marginBottom: '6px' }}>Generate content that violates any law or regulation</li>
        <li style={{ marginBottom: '6px' }}>Use the App to infringe on any intellectual property rights</li>
        <li style={{ marginBottom: '6px' }}>Attempt to reverse engineer, decompile, or disassemble the App</li>
        <li style={{ marginBottom: '6px' }}>Circumvent usage limits or billing requirements</li>
        <li style={{ marginBottom: '6px' }}>Resell or redistribute the App without written permission</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>5. Geographic Restrictions</h2>
      <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #fecaca' }}>
        <p><strong>Important:</strong> This App is not available to users in mainland China, the Hong Kong Special Administrative Region, the Macau Special Administrative Region, or Taiwan. By installing and using this App, you represent and warrant that you are not located in, and do not reside in, any of these regions.</p>
        <p style={{ marginTop: '8px' }}>This App has not been registered or filed with Chinese regulatory authorities under the Interim Measures for the Management of Generative Artificial Intelligence Services and is not intended for use within mainland China.</p>
      </div>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>6. Billing, Refunds, and EU Consumer Rights</h2>
      <p>Usage of the App beyond the free tier is billed through Shopify&apos;s billing system. By subscribing:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>You agree to Shopify&apos;s billing terms and payment processing policies</li>
        <li style={{ marginBottom: '6px' }}>Charges will appear on your Shopify invoice</li>
        <li style={{ marginBottom: '6px' }}>Subscriptions renew automatically at the end of each billing period</li>
        <li style={{ marginBottom: '6px' }}>You may cancel at any time through your Shopify admin panel</li>
      </ul>

      <h3 style={{ fontSize: '18px', marginTop: '24px', marginBottom: '12px', color: '#1a1a1a' }}>Refund Policy</h3>
      <p>We offer a <strong>7-day money-back guarantee</strong> for all paid subscriptions. If you are not satisfied with the service, contact us within 7 days of your purchase date at <a href="mailto:haimozhouqiu@outlook.com" style={{ color: '#2563eb' }}>haimozhouqiu@outlook.com</a> for a full refund.</p>

      <h3 style={{ fontSize: '18px', marginTop: '24px', marginBottom: '12px', color: '#1a1a1a' }}>EU Consumer Rights (14-Day Withdrawal)</h3>
      <p>If you are located in the European Union or European Economic Area, you have additional consumer rights under EU consumer protection laws:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Right of Withdrawal:</strong> You have the right to withdraw from your subscription contract within 14 days without giving any reason.</li>
        <li style={{ marginBottom: '6px' }}><strong>How to Withdraw:</strong> Send an email to <a href="mailto:haimozhouqiu@outlook.com" style={{ color: '#2563eb' }}>haimozhouqiu@outlook.com</a> with your withdrawal request.</li>
        <li style={{ marginBottom: '6px' }}><strong>Reimbursement:</strong> We will refund all payments within 14 days of receiving your withdrawal request.</li>
      </ul>

      <h3 style={{ fontSize: '18px', marginTop: '24px', marginBottom: '12px', color: '#1a1a1a' }}>Online Dispute Resolution (ODR)</h3>
      <p>If you are an EU consumer and have a complaint, you may also use the European Commission&apos;s Online Dispute Resolution (ODR) platform: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>https://ec.europa.eu/consumers/odr</a>. The ODR platform provides a single point of entry for consumers and traders seeking to resolve disputes out of court.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>7. Data and Privacy</h2>
      <p>Your use of the App is also governed by our <a href="/privacy" style={{ color: '#2563eb' }}>Privacy Policy</a>, which is incorporated herein by reference.</p>
      <p style={{ marginTop: '8px' }}>Key points:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>We collect only the minimum data necessary to provide the service</li>
        <li style={{ marginBottom: '6px' }}>Product data is processed in real-time and not stored after generation</li>
        <li style={{ marginBottom: '6px' }}>All data is deleted when you uninstall the App</li>
        <li style={{ marginBottom: '6px' }}>We comply with Shopify&apos;s GDPR webhook requirements</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>8. Intellectual Property</h2>
      <p>The App and its original content are owned by Haimo Tech and protected by international intellectual property laws. You retain ownership of all content you input into the App. AI-generated descriptions are provided for your use in your Shopify store.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>9. Limitation of Liability</h2>
      <p>To the fullest extent permitted by law:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>Haimo Tech shall not be liable for any indirect, incidental, special, consequential, or punitive damages</li>
        <li style={{ marginBottom: '6px' }}>We shall not be liable for any outcomes resulting from the use of AI-generated content</li>
        <li style={{ marginBottom: '6px' }}>We shall not be liable for any actions taken by Shopify against your store</li>
        <li style={{ marginBottom: '6px' }}>Our total liability shall not exceed $100 USD</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>10. Indemnification</h2>
      <p>You agree to indemnify and hold harmless Haimo Tech from any claims, damages, or expenses arising from your use of the App or violation of these Terms.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>11. Termination</h2>
      <p>We reserve the right to terminate or suspend access to the App at any time. You may terminate by uninstalling the App from your Shopify store. Upon uninstallation, all your data will be deleted in accordance with our Privacy Policy.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>12. Modifications</h2>
      <p>We may update these Terms from time to time. Continued use of the App after changes constitutes acceptance of the modified Terms.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>13. Governing Law</h2>
      <p>These Terms shall be governed by applicable laws. Any disputes shall be resolved through good-faith negotiation, and if unresolved, through binding arbitration.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>14. Contact</h2>
      <p>Questions about these Terms? Contact: <a href="mailto:haimozhouqiu@outlook.com" style={{ color: '#2563eb' }}>haimozhouqiu@outlook.com</a></p>
    </div>
  );
}
