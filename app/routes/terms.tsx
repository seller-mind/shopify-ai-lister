import { json } from '@remix-run/node';

export const meta = () => [
  { title: 'Terms of Service - WISMO AI' },
  { description: 'Terms of Service for WISMO AI Shopify App' },
];

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', lineHeight: '1.6', color: '#1a1a1a' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Terms of Service</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '32px' }}>Effective: June 6, 2026</p>

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
        <p style={{ marginTop: '8px', color: '#666', fontSize: '13px' }}>We implement IP-based geographic blocking to prevent access from mainland China. Chinese users accessing this service through VPN or proxy do so at their own risk and in potential violation of Chinese law. We are not liable for any consequences arising from such unauthorized access.</p>
      </div>
      <p style={{ marginTop: '12px' }}>This App uses DeepSeek (deepseek-chat), a generative AI model that has completed registration with Chinese regulatory authorities. DeepSeek is a third-party service provider and is solely responsible for its compliance with Chinese laws. We operate as an offshore service provider and do not offer services to users in mainland China. Our use of DeepSeek's API is for international customer service automation only.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>8. Billing, Refunds, and EU Consumer Rights</h2>
      <p>Usage of the App beyond the free tier is billed through Shopify's billing system. By subscribing:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>You agree to Shopify's billing terms and payment processing policies</li>
        <li style={{ marginBottom: '6px' }}>Charges will appear on your Shopify invoice</li>
        <li style={{ marginBottom: '6px' }}><strong>Automatic Renewal:</strong> Subscriptions renew automatically at the end of each billing period (every 30 days) at the then-current price, unless you cancel before the renewal date. You will be charged the same price as your current billing period unless you are notified of a price change at least 30 days in advance.</li>
        <li style={{ marginBottom: '6px' }}><strong>How to Cancel:</strong> You may cancel at any time through your Shopify admin panel (Settings → Apps → WISMO AI → Cancel). Cancellation takes effect at the end of the current billing period — you will retain access until then.</li>
        <li style={{ marginBottom: '6px' }}><strong>California Auto-Renewal Notice (AB 2511):</strong> Your subscription will automatically renew. You may cancel at any time. To cancel, go to your Shopify admin panel or contact us at <a href="mailto:haimozhouqiu@outlook.com" style={{ color: '#2563eb' }}>haimozhouqiu@outlook.com</a>.</li>
      </ul>

      <h3 style={{ fontSize: '18px', marginTop: '24px', marginBottom: '12px', color: '#1a1a1a' }}>Free Trial</h3>
      <p>Certain plans may include a free trial period (7 or 14 days, as indicated on the pricing page). During the trial period, you will have access to the plan&apos;s features at no charge. At the end of the trial period, your subscription will automatically convert to a paid subscription at the then-current price, billed through Shopify. To avoid being charged, you must cancel before the trial period ends. You may cancel at any time during the trial through your Shopify admin panel (Settings → Apps → WISMO AI → Cancel).</p>

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

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>15. Governing Law &amp; Dispute Resolution</h2>
      <p>These Terms shall be governed by and construed in accordance with the laws of Singapore, without regard to its conflict of laws principles. For EU consumers, the mandatory consumer protection laws of your country of residence shall apply to the extent required by EU consumer protection law, and nothing in these Terms limits your rights under such mandatory provisions.</p>
      <p style={{ marginTop: '8px' }}>Any disputes arising out of or in connection with these Terms shall first be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be resolved through binding arbitration administered by the International Centre for Dispute Resolution (ICDR) under its International Arbitration Rules. The arbitration shall be conducted in English, and the seat of arbitration shall be Singapore. The arbitral tribunal shall consist of one arbitrator. Notwithstanding the foregoing, either party may seek injunctive or equitable relief in any court of competent jurisdiction.</p>
      <p style={{ marginTop: '8px' }}><strong>EU Consumers:</strong> Nothing in this section deprives you of the right to bring proceedings in your country of residence, nor does it prevent you from using the European Commission&apos;s Online Dispute Resolution platform: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>https://ec.europa.eu/consumers/odr</a>.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>16. Force Majeure</h2>
      <p>We shall not be liable for any failure or delay in performing our obligations under these Terms where such failure or delay results from circumstances beyond our reasonable control, including but not limited to: natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, strikes, shortages of transportation, facilities, fuel, energy, labor, or materials, failures of third-party service providers (including Shopify, DeepSeek, Supabase, or Vercel), internet outages, or cyberattacks.</p>
      <p>If a force majeure event continues for more than 90 consecutive days, either party may terminate these Terms by providing written notice to the other party.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>17. Severability</h2>
      <p>If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be modified to the minimum extent necessary to make it valid and enforceable, or if modification is not possible, shall be severed from these Terms. The invalidity of any provision shall not affect the validity or enforceability of the remaining provisions, which shall continue in full force and effect.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>18. Entire Agreement</h2>
      <p>These Terms, together with our <a href="/privacy" style={{ color: '#2563eb' }}>Privacy Policy</a>, constitute the entire agreement between you and Haimo Tech regarding the use of WISMO AI, and supersede all prior or contemporaneous understandings, agreements, representations, and warranties, both written and oral, regarding such subject matter. No oral or written information or advice given by Haimo Tech or its representatives shall create any warranty or obligation not expressly stated in these Terms.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>19. Waiver</h2>
      <p>The failure of Haimo Tech to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision. Any waiver of any provision of these Terms will be effective only if in writing and signed by Haimo Tech. The waiver of any right or provision shall not be deemed a waiver of any other right or provision, nor shall it constitute a continuing waiver.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>20. Contact</h2>
      <p>Questions about these Terms? Contact: <a href="mailto:haimozhouqiu@outlook.com" style={{ color: '#2563eb' }}>haimozhouqiu@outlook.com</a></p>
      <p style={{ marginTop: '8px' }}>For Data Processing Agreement requests, please email with &quot;DPA Request&quot; in the subject line.</p>
    </div>
  );
}
