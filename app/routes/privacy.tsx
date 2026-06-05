import { json } from '@remix-run/node';

export const meta = () => [
  { title: 'Privacy Policy - WISMO AI' },
  { description: 'Privacy Policy for WISMO AI Shopify App' },
];

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', lineHeight: '1.6', color: '#1a1a1a' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Privacy Policy for WISMO AI</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '32px' }}>Last updated: June 5, 2026</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Controller</h2>
      <p>Haimo Tech (&quot;we&quot;, &quot;our&quot;, or &quot;the App&quot;) operates WISMO AI, an AI-powered order tracking chatbot for Shopify stores. For questions about this policy, contact us at <a href="mailto:haimozhouqiu@outlook.com" style={{ color: '#2563eb' }}>haimozhouqiu@outlook.com</a>.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Age Restriction</h2>
      <p>Our services are not intended for individuals under the age of 16 (or the applicable age of consent in your jurisdiction). We do not knowingly collect personal information from children. If you believe we have collected information from a child under the applicable age, please contact us immediately at <a href="mailto:haimozhouqiu@outlook.com" style={{ color: '#2563eb' }}>haimozhouqiu@outlook.com</a>, and we will take steps to delete such information.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Who This Policy Covers</h2>
      <p>This Privacy Policy applies to two categories of users:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Merchants:</strong> Shopify store owners who install WISMO AI on their store.</li>
        <li style={{ marginBottom: '6px' }}><strong>End Customers:</strong> Customers of the merchant's store who interact with the WISMO AI chat widget to track their orders.</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>AI Transparency Statement</h2>
      <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #bfdbfe' }}>
        <p><strong>⚠️ AI-Powered Service:</strong> WISMO AI uses artificial intelligence (DeepSeek) to process order tracking inquiries and generate automated customer service responses. Users interacting with the chat widget are informed that they are communicating with an AI-powered assistant. AI-generated responses may contain inaccuracies — merchants are responsible for reviewing automated responses for accuracy and compliance with applicable laws.</p>
      </div>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Data We Collect</h2>

      <h3 style={{ fontSize: '18px', marginTop: '24px', marginBottom: '12px', color: '#1a1a1a' }}>From Merchants</h3>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Shop store domain:</strong> Collected during OAuth to identify your store and provide app functionality.</li>
        <li style={{ marginBottom: '6px' }}><strong>Shopify access token:</strong> Stored securely to make API calls on your behalf for order tracking and fulfillment lookup.</li>
        <li style={{ marginBottom: '6px' }}><strong>App settings:</strong> Widget color, position, greeting, brand name, language preference, FAQ items, and return policy URL — all configured by the merchant.</li>
      </ul>

      <h3 style={{ fontSize: '18px', marginTop: '24px', marginBottom: '12px', color: '#1a1a1a' }}>From End Customers (via Chat Widget)</h3>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Chat messages:</strong> Questions and order information (order numbers, email addresses) typed by the customer into the chat widget.</li>
        <li style={{ marginBottom: '6px' }}><strong>Customer email:</strong> Provided voluntarily by the customer to look up their orders.</li>
        <li style={{ marginBottom: '6px' }}><strong>Customer name:</strong> Provided voluntarily by the customer (optional).</li>
        <li style={{ marginBottom: '6px' }}><strong>Locale/language:</strong> Auto-detected from the customer's browser to respond in their preferred language.</li>
      </ul>

      <h3 style={{ fontSize: '18px', marginTop: '24px', marginBottom: '12px', color: '#1a1a1a' }}>From Shopify API (on behalf of Merchants)</h3>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Order data:</strong> Order number, status, financial status, fulfillment status, tracking number, tracking company, tracking URL, estimated delivery date, and line items (product title, quantity, image). This data is fetched in real-time from Shopify to answer customer tracking questions.</li>
        <li style={{ marginBottom: '6px' }}><strong>Fulfillment data:</strong> Tracking and shipment information associated with orders.</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>How We Use Data</h2>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Order tracking:</strong> To look up and display order status, tracking information, and estimated delivery to end customers.</li>
        <li style={{ marginBottom: '6px' }}><strong>AI response generation:</strong> Chat messages and order data are sent to our AI provider (DeepSeek) to generate contextual responses for non-WISMO queries (general questions, FAQ). For pure order tracking queries, no AI call is made — responses are generated instantly from order data.</li>
        <li style={{ marginBottom: '6px' }}><strong>Conversation continuity:</strong> Conversation IDs are stored locally in the customer's browser (localStorage) to maintain chat history across page loads within 24 hours.</li>
        <li style={{ marginBottom: '6px' }}><strong>Analytics:</strong> Aggregated, anonymized metrics (conversation count, WISMO query count, auto-resolved rate, feedback ratings) for merchants to understand chatbot performance.</li>
        <li style={{ marginBottom: '6px' }}><strong>Service improvement:</strong> Customer feedback (thumbs up/down) is stored to help merchants and us improve response quality.</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>What We Do NOT Do</h2>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>We do <strong>not</strong> sell, rent, or share personal information with third parties for marketing purposes</li>
        <li style={{ marginBottom: '6px' }}>We do <strong>not</strong> use customer data for advertising or profiling</li>
        <li style={{ marginBottom: '6px' }}>We do <strong>not</strong> store order data after responding — it is fetched in real-time from Shopify and discarded</li>
        <li style={{ marginBottom: '6px' }}>We do <strong>not</strong> use third-party analytics or tracking services</li>
        <li style={{ marginBottom: '6px' }}>We do <strong>not</strong> share chat conversations with anyone except the merchant who owns the store</li>
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
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>AI customer service response generation (for non-WISMO queries only)</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Chat messages only (no order data sent to AI; processed in real-time, not stored by DeepSeek)</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>China</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Shopify</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Store integration, order lookup</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Access token for API calls; no data sent to Shopify</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>United States / Canada</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Supabase</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Data storage (conversations, settings, analytics)</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Conversation data, settings, access tokens</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Tokyo, Japan</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Vercel</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>App hosting</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>HTTP request data (temporary, not persisted)</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>United States</td>
          </tr>
        </tbody>
      </table>

      <div style={{ background: '#fff7ed', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #fed7aa' }}>
        <p><strong>⚠️ Important Notice for EU/EEA Users:</strong> This App uses DeepSeek as its AI provider, whose servers are located in China. When customers ask general questions (not order tracking), their chat messages are transmitted to DeepSeek's servers for AI processing. <strong>Order data is NOT sent to DeepSeek</strong> — order tracking responses are generated locally without AI. DeepSeek processes chat data in real-time and does not retain it after generating the response. For international data transfers, we implement appropriate safeguards as described below.</p>
      </div>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>GDPR Safeguards for International Transfers</h2>
      <p>We take the following measures to protect personal data during international transfers, particularly to our AI provider (DeepSeek, China):</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Data minimization:</strong> Only chat messages are sent to DeepSeek. Order data (customer names, addresses, financial information) is <strong>never</strong> transmitted to the AI provider.</li>
        <li style={{ marginBottom: '6px' }}><strong>Encryption:</strong> All data transfers are encrypted in transit using TLS 1.2+.</li>
        <li style={{ marginBottom: '6px' }}><strong>No retention:</strong> DeepSeek processes data in real-time and does not retain your data after generating responses.</li>
        <li style={{ marginBottom: '6px' }}><strong>Pseudonymization:</strong> Customer emails and names are not included in AI prompts — only the chat message text is sent.</li>
        <li style={{ marginBottom: '6px' }}><strong>Standard Contractual Clauses:</strong> We rely on Standard Contractual Clauses (SCCs) as adopted by the European Commission for transfers to DeepSeek, in accordance with GDPR Article 46.</li>
        <li style={{ marginBottom: '6px' }}><strong>Transfer Impact Assessment:</strong> We have conducted an assessment of the legal framework in the recipient country and implemented supplementary measures where necessary.</li>
        <li style={{ marginBottom: '6px' }}><strong>Right to object:</strong> You may uninstall the App at any time to stop all data processing and transfers.</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Cookie & Local Storage Policy</h2>
      <p>We use limited cookies and local storage technologies:</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '16px 0' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #e5e7eb', padding: '10px 12px', textAlign: 'left', background: '#f9fafb' }}>Type</th>
            <th style={{ border: '1px solid #e5e7eb', padding: '10px 12px', textAlign: 'left', background: '#f9fafb' }}>Purpose</th>
            <th style={{ border: '1px solid #e5e7eb', padding: '10px 12px', textAlign: 'left', background: '#f9fafb' }}>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Essential Session Cookies</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Required for Shopify App authentication and session management</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Session</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>localStorage (Widget)</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Stores conversation ID for chat continuity across page loads (essential for service functionality)</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>24 hours</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Third-party Analytics</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>We do not use any third-party analytics or tracking cookies</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>N/A</td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Data Retention</h2>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Access tokens:</strong> Stored until you uninstall the App. Automatically deleted upon uninstallation via Shopify webhook.</li>
        <li style={{ marginBottom: '6px' }}><strong>Conversations:</strong> Stored in Supabase (Tokyo) for conversation continuity and analytics. Deleted when the App is uninstalled.</li>
        <li style={{ marginBottom: '6px' }}><strong>Order data:</strong> Fetched in real-time from Shopify API. <strong>Not stored</strong> by our App after the response is sent.</li>
        <li style={{ marginBottom: '6px' }}><strong>Chat messages sent to DeepSeek:</strong> Processed in real-time and <strong>not retained</strong> by DeepSeek after generating the response.</li>
        <li style={{ marginBottom: '6px' }}><strong>Widget localStorage:</strong> Conversation ID stored in the customer's browser for 24 hours only, then automatically expires.</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Your Rights</h2>

      <h3 style={{ fontSize: '18px', marginTop: '24px', marginBottom: '12px', color: '#1a1a1a' }}>For Merchants (Data Controllers)</h3>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Right to access:</strong> Request a copy of your store data.</li>
        <li style={{ marginBottom: '6px' }}><strong>Right to erasure:</strong> Uninstalling the App triggers automatic deletion of all your data.</li>
        <li style={{ marginBottom: '6px' }}><strong>Right to data portability:</strong> Request your data in a machine-readable format.</li>
        <li style={{ marginBottom: '6px' }}><strong>Right to object:</strong> Object to processing of your personal data.</li>
        <li style={{ marginBottom: '6px' }}><strong>Data Processing Agreement:</strong> Available upon request for EU merchants who require a DPA.</li>
      </ul>

      <h3 style={{ fontSize: '18px', marginTop: '24px', marginBottom: '12px', color: '#1a1a1a' }}>For End Customers (Data Subjects)</h3>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Right to access:</strong> Request information about any data we hold about you.</li>
        <li style={{ marginBottom: '6px' }}><strong>Right to erasure:</strong> Request deletion of your conversation data. You can also clear the chat widget's localStorage by clearing your browser data.</li>
        <li style={{ marginBottom: '6px' }}><strong>Right to rectification:</strong> Request correction of inaccurate data.</li>
        <li style={{ marginBottom: '6px' }}><strong>Right to restrict processing:</strong> Request that we limit how we use your data.</li>
      </ul>
      <p>To exercise these rights, contact us at <a href="mailto:haimozhouqiu@outlook.com" style={{ color: '#2563eb' }}>haimozhouqiu@outlook.com</a> or ask the merchant to submit a request on your behalf. We will respond within 30 days.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Shopify Data Compliance</h2>
      <p>This App complies with Shopify's mandatory privacy requirements:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>customers/data_request</strong> webhook: Handles customer data access requests</li>
        <li style={{ marginBottom: '6px' }}><strong>customers/redact</strong> webhook: Anonymizes and deletes customer PII from conversations</li>
        <li style={{ marginBottom: '6px' }}><strong>shop/redact</strong> webhook: Deletes ALL shop data (including conversations, messages, feedback, analytics, settings) upon uninstallation</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>EU Consumer Rights (14-Day Withdrawal)</h2>
      <p>If you are located in the European Union or European Economic Area, you have the following consumer rights under EU consumer protection laws:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Right of Withdrawal:</strong> You have the right to withdraw from your subscription contract within 14 days without giving any reason.</li>
        <li style={{ marginBottom: '6px' }}><strong>Exercise of Withdrawal:</strong> To exercise the right of withdrawal, send an email to <a href="mailto:haimozhouqiu@outlook.com" style={{ color: '#2563eb' }}>haimozhouqiu@outlook.com</a>.</li>
        <li style={{ marginBottom: '6px' }}><strong>Reimbursement:</strong> We will reimburse all payments within 14 days of receiving your withdrawal request.</li>
        <li style={{ marginBottom: '6px' }}><strong>Exceptions:</strong> The right of withdrawal does not apply to services fully performed before the end of the withdrawal period with your express consent.</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>CCPA Compliance (California Users)</h2>
      <p>If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA):</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Right to Know:</strong> Request information about the personal data we collect and how it is used</li>
        <li style={{ marginBottom: '6px' }}><strong>Right to Delete:</strong> Request deletion of your personal information</li>
        <li style={{ marginBottom: '6px' }}><strong>Right to Opt Out:</strong> We do not sell personal information. There is nothing to opt out of</li>
        <li style={{ marginBottom: '6px' }}><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your rights</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>EU AI Act Compliance</h2>
      <p>In accordance with the EU Artificial Intelligence Act (Regulation 2024/1689):</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Transparency (Art. 52):</strong> All users interacting with the WISMO AI chat widget are informed that they are communicating with an AI system. The widget header displays &quot;AI-powered&quot; and includes a disclaimer in the chat interface.</li>
        <li style={{ marginBottom: '6px' }}><strong>Human Oversight:</strong> Merchants can review all automated responses and configure the widget. Customers can request to speak with a human agent at any time.</li>
        <li style={{ marginBottom: '6px' }}><strong>No Automated Decisions with Legal Effects:</strong> The App does not make decisions that produce legal effects for users.</li>
        <li style={{ marginBottom: '6px' }}><strong>Accuracy:</strong> We implement quality measures, but cannot guarantee the accuracy of AI-generated content. Merchants are responsible for reviewing automated responses.</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Data Breach Notification</h2>
      <p>In the event of a data breach affecting personal information, we will:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>Notify affected users within 72 hours, as required by GDPR Article 33</li>
        <li style={{ marginBottom: '6px' }}>Notify the relevant supervisory authority if the breach poses a risk to individuals' rights</li>
        <li style={{ marginBottom: '6px' }}>Take immediate steps to contain the breach and prevent further data loss</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Geographic Restrictions</h2>
      <p>This App is not available to users in mainland China. By installing and using this App, you confirm that you are not a resident of or accessing the service from the People's Republic of China (excluding Hong Kong, Macau, and Taiwan). This App has not been registered with Chinese regulatory authorities under the Interim Measures for the Management of Generative Artificial Intelligence Services.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Disclaimer</h2>
      <div style={{ background: '#fff7ed', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #fed7aa' }}>
        <p><strong>Important:</strong> WISMO AI is an independent third-party application developed by Haimo Tech. It is not affiliated with, endorsed by, or sponsored by Shopify Inc. &quot;Shopify&quot; is a trademark of Shopify Inc. This App uses the Shopify API in accordance with Shopify's API Terms of Service.</p>
      </div>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Contact</h2>
      <p>Questions about this privacy policy? Contact us at: <a href="mailto:haimozhouqiu@outlook.com" style={{ color: '#2563eb' }}>haimozhouqiu@outlook.com</a></p>
      <p style={{ marginTop: '8px' }}>For Data Processing Agreement requests (EU merchants), please email the above address with &quot;DPA Request&quot; in the subject line.</p>
    </div>
  );
}
