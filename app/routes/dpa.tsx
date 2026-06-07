import { json } from '@remix-run/node';

export const meta = () => [
  { title: 'Data Processing Agreement - WISMO AI' },
  { description: 'Data Processing Agreement (DPA) for WISMO AI Shopify App' },
];

export default function DpaPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', lineHeight: '1.6', color: '#1a1a1a' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Data Processing Agreement (DPA)</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '32px' }}>Effective: June 7, 2026</p>

      <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #bfdbfe' }}>
        <p><strong>EU Merchants:</strong> This DPA is automatically incorporated into your use of WISMO AI. No separate signature is required — installing the App constitutes acceptance. To receive a signed copy, email <a href="mailto:haimozhouqiu@outlook.com" style={{ color: '#2563eb' }}>haimozhouqiu@outlook.com</a> with &quot;DPA Request&quot; in the subject line.</p>
      </div>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Between:</h2>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Merchant</strong> (the &quot;Data Controller&quot;): The Shopify store owner who has installed WISMO AI</li>
        <li style={{ marginBottom: '6px' }}><strong>Haimo Tech</strong> (the &quot;Data Processor&quot;): The developer and operator of WISMO AI</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>1. Scope and Purpose</h2>
      <p>This DPA applies to the processing of personal data by Haimo Tech on behalf of the Merchant in connection with the WISMO AI Shopify App (&quot;the Service&quot;). The subject matter, duration, nature, and purpose of the processing, the types of personal data processed, and the categories of data subjects are described in Annex A.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>2. Roles and Responsibilities</h2>
      <h3 style={{ fontSize: '18px', marginTop: '24px', marginBottom: '12px' }}>2.1 Data Controller</h3>
      <p>The Merchant is the Data Controller of end-customer personal data processed through the WISMO AI chat widget on their Shopify store.</p>
      <h3 style={{ fontSize: '18px', marginTop: '24px', marginBottom: '12px' }}>2.2 Data Processor</h3>
      <p>Haimo Tech acts as a Data Processor on behalf of the Merchant, processing personal data only to provide the Service as described in the Terms of Service and Privacy Policy.</p>
      <h3 style={{ fontSize: '18px', marginTop: '24px', marginBottom: '12px' }}>2.3 Sub-processors</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '16px 0' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #e5e7eb', padding: '10px 12px', textAlign: 'left', background: '#f9fafb' }}>Provider</th>
            <th style={{ border: '1px solid #e5e7eb', padding: '10px 12px', textAlign: 'left', background: '#f9fafb' }}>Purpose</th>
            <th style={{ border: '1px solid #e5e7eb', padding: '10px 12px', textAlign: 'left', background: '#f9fafb' }}>Location</th>
            <th style={{ border: '1px solid #e5e7eb', padding: '10px 12px', textAlign: 'left', background: '#f9fafb' }}>Transfer Basis</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Supabase Inc.</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Database hosting</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Tokyo, Japan</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>EU adequacy decision</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>DeepSeek (High-Flyer AI)</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>AI response generation (non-WISMO queries only)</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>China</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>SCCs Module 3 + supplementary measures</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Vercel Inc.</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Application hosting</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>USA</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>EU-US DPF</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Shopify Inc.</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>OAuth, API, billing</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>USA/Canada</td>
            <td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>DPF certification</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: '14px', color: '#666' }}>Haimo Tech will notify the Merchant of any changes to sub-processors at least 30 days in advance, providing the Merchant the opportunity to object.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>3. Processor Obligations</h2>
      <p>Haimo Tech shall:</p>
      <ol style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>Process personal data only on documented instructions from the Merchant (as set out in the Service configuration and this DPA)</li>
        <li style={{ marginBottom: '6px' }}>Ensure that persons authorised to process the personal data have committed themselves to confidentiality</li>
        <li style={{ marginBottom: '6px' }}>Implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk (see Annex B)</li>
        <li style={{ marginBottom: '6px' }}>Not engage another processor without prior specific or general written authorisation (sub-processor list above constitutes general authorisation)</li>
        <li style={{ marginBottom: '6px' }}>Assist the Merchant in responding to data subject requests for exercising their rights</li>
        <li style={{ marginBottom: '6px' }}>Assist the Merchant in ensuring compliance with GDPR Articles 32-36</li>
        <li style={{ marginBottom: '6px' }}>Delete or return all personal data upon termination of the Service</li>
        <li style={{ marginBottom: '6px' }}>Make available to the Merchant all information necessary to demonstrate compliance</li>
      </ol>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>4. Security Measures (Annex B)</h2>
      <ol style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Encryption in Transit:</strong> All data transmitted uses TLS 1.3</li>
        <li style={{ marginBottom: '6px' }}><strong>Encryption at Rest:</strong> Database storage uses AES-256 encryption</li>
        <li style={{ marginBottom: '6px' }}><strong>Access Control:</strong> Service role keys stored as environment variables, never exposed in client-side code</li>
        <li style={{ marginBottom: '6px' }}><strong>Data Minimisation:</strong> WISMO queries process zero AI calls; only non-WISMO chat messages are sent to DeepSeek AI; order data is fetched in real-time and not stored</li>
        <li style={{ marginBottom: '6px' }}><strong>Pseudonymisation:</strong> Customer identifiers are pseudonymised where feasible</li>
        <li style={{ marginBottom: '6px' }}><strong>Data Retention:</strong> Conversations retained for 90 days, PII anonymised after 90 days, automated daily cleanup</li>
        <li style={{ marginBottom: '6px' }}><strong>Incident Response:</strong> Data breaches notified without undue delay and no later than 72 hours</li>
        <li style={{ marginBottom: '6px' }}><strong>Secure Development:</strong> XSS prevention, input validation, CORS controls, rate limiting, HMAC-verified webhooks</li>
        <li style={{ marginBottom: '6px' }}><strong>Geographic Controls:</strong> CN IP blocking via Vercel Geo-Location (HTTP 451)</li>
        <li style={{ marginBottom: '6px' }}><strong>HSTS:</strong> Strict-Transport-Security enabled (max-age=31536000; includeSubDomains)</li>
      </ol>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>5. Data Subject Rights</h2>
      <p>Haimo Tech will assist the Merchant in fulfilling data subject requests by:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>Providing data export functionality via GDPR webhooks (customers/data_request)</li>
        <li style={{ marginBottom: '6px' }}>Deleting PII upon request (customers/redact)</li>
        <li style={{ marginBottom: '6px' }}>Deleting all shop data upon uninstallation (shop/redact)</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>6. International Data Transfers</h2>
      <h3 style={{ fontSize: '18px', marginTop: '24px', marginBottom: '12px' }}>6.1 DeepSeek (China)</h3>
      <p>Transfers governed by Standard Contractual Clauses (Module 3: Processor to Processor), Commission Implementing Decision (EU) 2021/914, supplemented by encryption in transit and at rest, data minimisation, pseudonymisation, and real-time processing without retention. A Transfer Impact Assessment has been conducted considering China&apos;s legal framework.</p>
      <h3 style={{ fontSize: '18px', marginTop: '24px', marginBottom: '12px' }}>6.2 Vercel and Shopify (USA)</h3>
      <p>Covered by the EU-US Data Privacy Framework certification.</p>
      <h3 style={{ fontSize: '18px', marginTop: '24px', marginBottom: '12px' }}>6.3 Supabase (Japan)</h3>
      <p>Benefits from the EU adequacy decision for Japan (Commission Implementing Decision 2019/1919).</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>7. Data Breach Notification</h2>
      <p>Haimo Tech will notify the Merchant without undue delay and no later than 72 hours after becoming aware of a personal data breach, providing the nature of the breach, likely consequences, and measures taken.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>8. Audit Rights</h2>
      <p>The Merchant has the right to audit Haimo Tech&apos;s compliance with this DPA, subject to reasonable notice (at least 14 days) and during normal business hours.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>9. Term and Termination</h2>
      <p>This DPA remains in effect for the duration of the Merchant&apos;s use of the Service. Upon termination, all personal data will be deleted within 30 days. Written confirmation of deletion will be provided upon request.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>10. Governing Law</h2>
      <p>This DPA shall be governed by the laws of Singapore. For EU Merchants, the mandatory provisions of GDPR and applicable EU member state law shall prevail where they provide greater protection.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Annex A: Processing Details</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '16px 0' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #e5e7eb', padding: '10px 12px', textAlign: 'left', background: '#f9fafb' }}>Item</th>
            <th style={{ border: '1px solid #e5e7eb', padding: '10px 12px', textAlign: 'left', background: '#f9fafb' }}>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Subject matter</td><td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>AI-powered order tracking chatbot for Shopify stores</td></tr>
          <tr><td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Duration</td><td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>For the duration of the Merchant&apos;s subscription</td></tr>
          <tr><td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Nature of processing</td><td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Collection, storage, query, and automated response generation</td></tr>
          <tr><td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Purpose</td><td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Order tracking, customer service automation, analytics</td></tr>
          <tr><td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Personal data types</td><td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Customer email, customer name, chat messages, order numbers, locale/language</td></tr>
          <tr><td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>Categories of data subjects</td><td style={{ border: '1px solid #e5e7eb', padding: '10px 12px' }}>End customers of the Merchant&apos;s Shopify store</td></tr>
        </tbody>
      </table>

      <p style={{ marginTop: '32px', color: '#666', fontSize: '14px' }}>Last updated: June 7, 2026</p>
    </div>
  );
}
