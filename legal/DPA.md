# DATA PROCESSING AGREEMENT (DPA)

**Between:**

- **Merchant** (the "Data Controller"): The Shopify store owner who has installed WISMO AI
- **Haimo Tech** (the "Data Processor"): The developer and operator of WISMO AI

**Effective Date:** Upon merchant's written request to haimozhouqiu@outlook.com

---

## 1. Scope and Purpose

This DPA applies to the processing of personal data by Haimo Tech on behalf of the Merchant in connection with the WISMO AI Shopify App ("the Service"). The subject matter, duration, nature, and purpose of the processing, the types of personal data processed, and the categories of data subjects are described in Annex A.

## 2. Roles and Responsibilities

### 2.1 Data Controller
The Merchant is the Data Controller of end-customer personal data processed through the WISMO AI chat widget on their Shopify store.

### 2.2 Data Processor
Haimo Tech acts as a Data Processor on behalf of the Merchant, processing personal data only to provide the Service as described in the Terms of Service and Privacy Policy.

### 2.3 Sub-processors
Haimo Tech engages the following sub-processors:
| Provider | Purpose | Location | Transfer Basis |
|----------|---------|----------|----------------|
| Supabase Inc. | Database hosting | Tokyo, Japan | EU adequacy decision |
| DeepSeek (High-Flyer AI) | AI response generation (non-WISMO queries only) | China | SCCs Module 3 + supplementary measures |
| Vercel Inc. | Application hosting | USA | EU-US DPF |
| Shopify Inc. | OAuth, API, billing | USA/Canada | DPF certification |

Haimo Tech will notify the Merchant of any changes to sub-processors at least 30 days in advance, providing the Merchant the opportunity to object.

## 3. Processor Obligations

Haimo Tech shall:
1. Process personal data only on documented instructions from the Merchant (as set out in the Service configuration and this DPA)
2. Ensure that persons authorised to process the personal data have committed themselves to confidentiality
3. Implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk (see Annex B)
4. Not engage another processor without prior specific or general written authorisation (sub-processor list above constitutes general authorisation)
5. Assist the Merchant in responding to data subject requests for exercising their rights
6. Assist the Merchant in ensuring compliance with GDPR Articles 32-36
7. Delete or return all personal data upon termination of the Service
8. Make available to the Merchant all information necessary to demonstrate compliance

## 4. Security Measures

### Annex B - Technical and Organisational Security Measures

1. **Encryption in Transit:** All data transmitted between the Merchant's store, WISMO AI, and sub-processors uses TLS 1.3
2. **Encryption at Rest:** Database storage (Supabase) uses AES-256 encryption
3. **Access Control:** Service role keys are stored as environment variables, never exposed in client-side code. Access is limited to authorised personnel.
4. **Data Minimisation:** 
   - WISMO (order tracking) queries process zero AI calls — pure Shopify data
   - Only non-WISMO chat messages are sent to DeepSeek AI
   - Order data is fetched in real-time and not stored after responding
5. **Pseudonymisation:** Customer identifiers are pseudonymised where feasible
6. **Data Retention:** Conversations retained for 90 days, PII anonymised after 90 days, GDPR data packages scrubbed after 30 days
7. **Incident Response:** Data breaches affecting Merchant data will be notified to the Merchant without undue delay and no later than 72 hours
8. **Secure Development:** XSS prevention, input validation, CORS controls, rate limiting, HMAC-verified webhooks
9. **Geographic Controls:** CN IP blocking via Vercel Geo-Location (HTTP 451)

## 5. Data Subject Rights

Haimo Tech will assist the Merchant in fulfilling data subject requests (access, rectification, erasure, restriction, portability, objection) by:
- Providing data export functionality via GDPR webhooks (customers/data_request)
- Deleting PII upon request (customers/redact)
- Deleting all shop data upon uninstallation (shop/redact)

## 6. International Data Transfers

### 6.1 DeepSeek (China)
Transfers of personal data to DeepSeek in China are governed by:
- Standard Contractual Clauses (Module 3: Processor to Processor), Commission Implementing Decision (EU) 2021/914
- Supplementary measures: encryption in transit and at rest, data minimisation, pseudonymisation, real-time processing without retention
- Transfer Impact Assessment conducted considering China's legal framework (PIPL, Cybersecurity Law)

### 6.2 Vercel and Shopify (USA)
Transfers are covered by the EU-US Data Privacy Framework certification.

### 6.3 Supabase (Japan)
Transfers benefit from the EU adequacy decision for Japan (Commission Implementing Decision 2019/1919).

## 7. Data Breach Notification

Haimo Tech will notify the Merchant without undue delay and no later than 72 hours after becoming aware of a personal data breach, providing:
- The nature of the breach including categories and approximate numbers of data subjects and records
- The likely consequences of the breach
- The measures taken or proposed to address the breach

## 8. Audit Rights

The Merchant has the right to audit Haimo Tech's compliance with this DPA, subject to reasonable notice (at least 14 days) and during normal business hours. Haimo Tech will provide reasonable cooperation and access to relevant information.

## 9. Term and Termination

This DPA remains in effect for the duration of the Merchant's use of the Service. Upon termination:
- All personal data will be deleted within 30 days (via Shopify's shop/redact webhook)
- Written confirmation of deletion will be provided upon request

## 10. Governing Law

This DPA shall be governed by the laws of Singapore. For EU Merchants, the mandatory provisions of GDPR and applicable EU member state law shall prevail where they provide greater protection.

---

## Annex A: Processing Details

| Item | Description |
|------|-------------|
| **Subject matter** | AI-powered order tracking chatbot for Shopify stores |
| **Duration** | For the duration of the Merchant's subscription |
| **Nature of processing** | Collection, storage, query, and automated response generation |
| **Purpose** | Order tracking, customer service automation, analytics |
| **Personal data types** | Customer email, customer name, chat messages, order numbers, locale/language |
| **Categories of data subjects** | End customers of the Merchant's Shopify store |

---

*To request execution of this DPA, email haimozhouqiu@outlook.com with "DPA Request" in the subject line, including your shop domain.*
