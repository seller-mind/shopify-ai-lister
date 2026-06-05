import { json } from '@remix-run/node';

export const meta = () => [
  { title: 'Terms of Service - WISMO AI' },
  { description: 'Terms of Service for WISMO AI Shopify App' },
];

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', lineHeight: '1.6', color: '#1a1a1a' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Terms of Service</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '32px' }}>Effective: June 5, 2026</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>1. Acceptance of Terms</h2>
      <p>By installing and using WISMO AI (&quot;the App&quot;), you agree to these Terms of Service. If you do not agree, please uninstall the App immediately.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>2. Eligibility and Age Requirements</h2>
      <p>You must be at least 16 years of age to use this Service. If you are between 16 and 18, you represent that your parent or legal guardian has agreed to these Terms on your behalf.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>3. Description of Service</h2>
      <p>WISMO AI provides an AI-powered order tracking chatbot for Shopify stores. The App:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>Processes order tracking inquiries from your customers and generates automated responses</li>
        <li style={{ marginBottom: '6px' }}>Supports multi-language input with AI replies in the customer's language (20+ languages)</li>
        <li style={{ marginBottom: '6px' }}>Provides real-time order status, tracking information, and visual order timeline</li>
        <li style={{ marginBottom: '6px' }}>Handles enhanced scenarios: customs delays, lost packages, delayed shipments, returns</li>
        <li style={{ marginBottom: '6px' }}>Integrates with your Shopify store via the Shopify API</li>
        <li style={{ marginBottom: '6px' }}>AI-generated content may contain inaccuracies and should be reviewed</li>
      </ul>

      <div style={{ background: '#fff7ed', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #fed7aa' }}>
        <p><strong>Disclaimer:</strong> WISMO AI is an independent third-party application developed by Haimo Tech. &quot;Shopify&quot; is a trademark of Shopify Inc. This App uses the Shopify API in accordance with Shopify's API Terms of Service.</p>
      </div>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>4. AI-Generated Content Disclaimer</h2>
      <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #bfdbfe' }}>
        <p><strong>⚠️ AI Transparency Notice:</strong> This service uses artificial intelligence (DeepSeek, deepseek-chat model) to generate responses for general customer queries. For order tracking queries, responses are generated instantly from Shopify order data without AI processing. Chat messages for general queries are sent to DeepSeek's servers in China for AI processing.</p>
      </div>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>All AI-generated content is for reference only</li>
        <li style={{ marginBottom: '6px' }}>You (the merchant) are responsible for reviewing and monitoring automated responses for accuracy and legal compliance</li>
        <li style={{ marginBottom: '6px' }}>We do not guarantee the accuracy, completeness, or suitability of AI-generated content</li>
        <li style={{ marginBottom: '6px' }}>You are responsible for ensuring your use of the App complies with applicable consumer protection and data protection laws</li>
        <li style={{ marginBottom: '6px' }}>We are not responsible for any outcomes resulting from the use of AI-generated content</li>
        <li style={{ marginBottom: '6px' }}>Your customers are informed that they are interacting with an AI system, in compliance with the EU AI Act</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>5. Data Processing Responsibilities</h2>
      <p>As a merchant using WISMO AI, you acknowledge that:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>You are the Data Controller</strong> for your customers' personal data processed through the chat widget</li>
        <li style={{ marginBottom: '6px' }}><strong>We are the Data Processor</strong> on your behalf, processing customer data only to provide the order tracking service</li>
        <li style={{ marginBottom: '6px' }}>You must have a lawful basis for processing your customers' data (e.g., legitimate interest for order tracking, consent for marketing)</li>
        <li style={{ marginBottom: '6px' }}>You must inform your customers about the AI chatbot's data processing through your own privacy policy</li>
        <li style={{ marginBottom: '6px' }}>We process data in accordance with our Privacy Policy and these Terms</li>
        <li style={{ marginBottom: '6px' }}>A Data Processing Agreement (DPA) is available upon request for EU merchants</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>6. Usage Restrictions</h2>
      <p>You agree NOT to:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>Use the App for any unlawful purpose</li>
        <li style={{ marginBottom: '6px' }}>Use the App to process sensitive personal data (health, biometric, racial/ethnic origin, etc.)</li>
        <li style={{ marginBottom: '6px' }}>Misrepresent the AI chatbot as a human agent</li>
        <li style={{ marginBottom: '6px' }}>Attempt to reverse engineer, decompile, or disassemble the App</li>
        <li style={{ marginBottom: '6px' }}>Circumvent usage limits or billing requirements</li>
        <li style={{ marginBottom: '6px' }}>Resell or redistribute the App without written permission</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>7. Geographic Restrictions</h2>
      <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #fecaca' }}>
        <p><strong>Important:</strong> This App is not available to users in mainland China, the Hong Kong Special Administrative Region, the Macau Special Administrative Region, or Taiwan. By installing and using this App, you represent and warrant that you are not located in, and do not reside in, any of these regions.</p>
        <p style={{ marginTop: '8px' }}>This App has not been registered or filed with Chinese regulatory authorities under the Interim Measures for the Management of Generative Artificial Intelligence Services and is not intended for use within mainland China.</p>
      </div>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>8. Billing, Refunds, and EU Consumer Rights</h2>
      <p>Usage of the App beyond the free tier is billed through Shopify's billing system. By subscribing:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>You agree to Shopify's billing terms and payment processing policies</li>
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
      <p>If you are an EU consumer and have a complaint, you may also use the European Commission's Online Dispute Resolution (ODR) platform: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>https://ec.europa.eu/consumers/odr</a>.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>9. Data and Privacy</h2>
      <p>Your use of the App is also governed by our <a href="/privacy" style={{ color: '#2563eb' }}>Privacy Policy</a>, which is incorporated herein by reference.</p>
      <p style={{ marginTop: '8px' }}>Key points:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>We collect only the minimum data necessary to provide the service</li>
        <li style={{ marginBottom: '6px' }}>Order data is fetched in real-time from Shopify and not stored after responding</li>
        <li style={{ marginBottom: '6px' }}>Chat messages for general queries are sent to DeepSeek (China) for AI processing, but not retained</li>
        <li style={{ marginBottom: '6px' }}>All data is deleted when you uninstall the App (including conversations, messages, feedback, analytics)</li>
        <li style={{ marginBottom: '6px' }}>We comply with Shopify's GDPR webhook requirements (customers/data_request, customers/redact, shop/redact)</li>
        <li style={{ marginBottom: '6px' }}>We do not sell, rent, or share personal information with third parties for marketing purposes</li>
        <li style={{ marginBottom: '6px' }}>International data transfers are protected by encryption, data minimization, pseudonymization, and Standard Contractual Clauses</li>
        <li style={{ marginBottom: '6px' }}>In the event of a data breach, we will notify affected users within 72 hours as required by GDPR Article 33</li>
      </ul>
      <p style={{ marginTop: '8px' }}><strong>California Residents (CCPA):</strong> We do not sell your personal information. See our <a href="/privacy" style={{ color: '#2563eb' }}>Privacy Policy</a> for full CCPA rights.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>10. Intellectual Property</h2>
      <p>The App and its original content are owned by Haimo Tech and protected by international intellectual property laws. You retain ownership of all content you input into the App. AI-generated responses are provided for your use in your Shopify store.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>11. Limitation of Liability</h2>
      <p>To the fullest extent permitted by applicable law:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>Haimo Tech shall not be liable for any indirect, incidental, special, consequential, or punitive damages</li>
        <li style={{ marginBottom: '6px' }}>We shall not be liable for any outcomes resulting from the use of AI-generated content</li>
        <li style={{ marginBottom: '6px' }}>We shall not be liable for any actions taken by Shopify against your store</li>
        <li style={{ marginBottom: '6px' }}>Our total aggregate liability shall not exceed the total fees paid by you in the 12 months preceding the claim, or $100 USD, whichever is greater</li>
      </ul>
      <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #bbf7d0' }}>
        <p><strong>EU Consumers:</strong> Nothing in these Terms excludes or limits liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded or limited under applicable law.</p>
      </div>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>12. Indemnification</h2>
      <p>You agree to indemnify and hold harmless Haimo Tech from any claims, damages, or expenses arising from your use of the App, your violation of these Terms, or your violation of any applicable data protection laws.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>13. Termination</h2>
      <p>We reserve the right to terminate or suspend access to the App at any time for violations of these Terms. You may terminate by uninstalling the App from your Shopify store. Upon uninstallation, all your data will be deleted in accordance with our Privacy Policy and Shopify's GDPR webhooks.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>14. Modifications</h2>
      <p>We may update these Terms from time to time. For material changes, we will notify you via email or through the Shopify App Store. Continued use of the App after changes constitutes acceptance of the modified Terms.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>15. Governing Law</h2>
      <p>These Terms shall be governed by applicable laws. For EU consumers, the laws of your country of residence shall apply to the extent required by EU consumer protection law. Any disputes shall first be resolved through good-faith negotiation, and if unresolved, through binding arbitration.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>16. Contact</h2>
      <p>Questions about these Terms? Contact: <a href="mailto:haimozhouqiu@outlook.com" style={{ color: '#2563eb' }}>haimozhouqiu@outlook.com</a></p>
      <p style={{ marginTop: '8px' }}>For Data Processing Agreement requests, please email with &quot;DPA Request&quot; in the subject line.</p>
    </div>
  );
}
