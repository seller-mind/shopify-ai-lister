import { json } from '@remix-run/node';

export const meta = () => [
  { title: 'DMCA Policy - Haimo AI Lister' },
  { description: 'DMCA Copyright Policy for Haimo AI Lister Shopify App' },
];

export default function DmcaPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', lineHeight: '1.6', color: '#1a1a1a' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>DMCA Copyright Policy</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '32px' }}>Effective: June 2026</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Designated Copyright Agent</h2>
      <p>Haimo AI Lister respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act (DMCA), we have designated a Copyright Agent to receive copyright infringement notices.</p>
      <p style={{ marginTop: '12px' }}><strong>Designated Agent:</strong><br />
      Copyright Agent<br />
      Haimo AI Lister / Haimo Tech<br />
      Email: <a href="mailto:haimozhouqiu@outlook.com" style={{ color: '#2563eb' }}>haimozhouqiu@outlook.com</a></p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>How to Submit a DMCA Takedown Notice</h2>
      <p>If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement, please provide our Copyright Agent with a written notice containing the following information:</p>
      <ol style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}><strong>Physical or electronic signature</strong> of the person authorized to act on behalf of the owner of the copyright interest.</li>
        <li style={{ marginBottom: '6px' }}><strong>Identification of the copyrighted work</strong> claimed to have been infringed, or if multiple copyrighted works are covered by a single notice, a representative list of such works.</li>
        <li style={{ marginBottom: '6px' }}><strong>Identification of the material</strong> that is claimed to be infringing or to be the subject of infringing activity, and its location on our service.</li>
        <li style={{ marginBottom: '6px' }}><strong>Your contact information</strong>, including your address, telephone number, and email address.</li>
        <li style={{ marginBottom: '6px' }}><strong>A statement that you have a good faith belief</strong> that the disputed use is not authorized by the copyright owner, its agent, or the law.</li>
        <li style={{ marginBottom: '6px' }}><strong>A statement, under penalty of perjury</strong>, that the information in the notice is accurate and that you are authorized to act on behalf of the owner of the exclusive right that is allegedly infringed.</li>
      </ol>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Counter-Notification Procedure</h2>
      <p>If you believe that your content that was removed (or to which access was disabled) is not infringing, or that you have the authorization from the copyright owner, the copyright owner's agent, or pursuant to the law, to post and use the material in your content, you may send a counter-notice containing the following information:</p>
      <ul style={{ marginBottom: '12px', paddingLeft: '24px' }}>
        <li style={{ marginBottom: '6px' }}>Your physical or electronic signature</li>
        <li style={{ marginBottom: '6px' }}>Identification of the content that has been removed or to which access has been disabled, and the location at which the content appeared before it was removed or disabled</li>
        <li style={{ marginBottom: '6px' }}>A statement that you have a good faith belief that the content was removed or disabled as a result of mistake or misidentification of the content</li>
        <li style={{ marginBottom: '6px' }}>Your name, address, telephone number, and email address</li>
        <li style={{ marginBottom: '6px' }}>A statement that you consent to the jurisdiction of the federal court in which your address is located, or if your address is outside the United States, that you consent to jurisdiction in any judicial district in which we may be found</li>
        <li style={{ marginBottom: '6px' }}>A statement that you will accept service of process from the party who filed the original DMCA notice or an agent of such party</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Repeat Infringer Policy</h2>
      <p>In accordance with the DMCA and other applicable laws, we have adopted a policy of terminating, in appropriate circumstances, the accounts of users who are deemed to be repeat infringers. We may also limit access to our service or terminate the accounts of any users who infringe any intellectual property rights of others, whether or not there is any repeat infringement.</p>
      <p style={{ marginTop: '12px' }}><strong>Three-Strike Policy:</strong> Users who receive three (3) valid DMCA takedown notices will have their account terminated and will be prohibited from creating a new account.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Fair Use Notice</h2>
      <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #bbf7d0' }}>
        <p><strong>AI-Generated Content Notice:</strong> Haimo AI Lister uses artificial intelligence (DeepSeek) to generate product descriptions. AI-generated content is considered transformative in nature as it creates new, original text based on user-provided product information. This transformative use is distinct from copying copyrighted material. Users are solely responsible for ensuring that the content they submit for AI processing does not include copyrighted material without proper authorization.</p>
        <p style={{ marginTop: '8px' }}>Users should also be aware that AI-generated descriptions may include phrases or combinations that inadvertently resemble existing copyrighted text. While we implement measures to minimize this, we cannot guarantee that AI-generated content will not include similarities to pre-existing works.</p>
      </div>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Contact Information</h2>
      <p>For any questions regarding this DMCA Policy or to submit a DMCA takedown notice or counter-notice, please contact our Copyright Agent:</p>
      <p style={{ marginTop: '12px' }}><strong>Email:</strong> <a href="mailto:haimozhouqiu@outlook.com" style={{ color: '#2563eb' }}>haimozhouqiu@outlook.com</a></p>
      <p style={{ marginTop: '8px' }}><strong>Response Time:</strong> We will endeavor to respond to DMCA notices within 5-7 business days.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', color: '#2563eb' }}>Disclaimer</h2>
      <div style={{ background: '#fff7ed', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #fed7aa' }}>
        <p><strong>Important:</strong> This DMCA Policy is provided for informational purposes only. Haimo AI Lister is an independent third-party application developed by Haimo Tech. It is not affiliated with, endorsed by, or sponsored by Shopify Inc. "Shopify" is a trademark of Shopify Inc. The information provided in this policy does not constitute legal advice. If you have questions about your rights or obligations under the DMCA, please consult with a qualified attorney.</p>
      </div>

      <p style={{ marginTop: '32px', color: '#666', fontSize: '14px' }}>Last updated: June 2026</p>
    </div>
  );
}
