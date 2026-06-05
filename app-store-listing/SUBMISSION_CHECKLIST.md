# WISMO AI - App Store Submission Checklist

## ✅ Pre-submission Checklist

### Authentication & Security
- [x] OAuth 2.0 with proper HMAC validation
- [x] GDPR webhooks (3/3) respond 200
- [x] App uninstall webhook cleans up data
- [x] Access tokens stored securely
- [x] No sensitive data in client-side code
- [x] CN IP geo-block active

### User Experience
- [x] App fully embedded in Shopify admin
- [x] Clean sidebar navigation (Dashboard/Settings/Plans)
- [x] Loading states present
- [x] Error handling with clear messages
- [x] Responsive layout

### Functionality
- [x] Order tracking works (Demo mode for testing)
- [x] AI chat responses via DeepSeek
- [x] Widget color/position customizable
- [x] FAQ items configurable
- [x] Multi-language support (auto-detect)
- [x] Billing via Shopify GraphQL API
- [x] Conversation analytics dashboard

### Legal & Compliance
- [x] Privacy Policy page
- [x] Terms of Service page
- [x] DMCA page
- [x] GDPR webhook endpoints registered
- [x] No third-party tracking cookies

### App Listing
- [x] App name: WISMO AI
- [x] Tagline prepared
- [x] Short + Long description
- [x] Pricing plans defined
- [ ] Screenshots needed (see below)
- [ ] App icon (512x512)

## 📋 Submission Steps (Partners Dashboard)

1. Go to https://partners.shopify.com → Apps → WISMO AI
2. Click "App Store listing"
3. Fill in listing details from listing.md
4. Upload screenshots (see requirements below)
5. Upload app icon
6. Set pricing (already configured via billing API)
7. Submit for review

## 📸 Screenshots Required

Shopify requires screenshots showing:
1. **Dashboard** - Main analytics view showing conversations, auto-resolved rate
2. **Chat widget** - Storefront chat bubble and conversation
3. **Settings** - Widget customization options
4. **Billing** - Pricing plans page

Format: 1280x800 or 1440x900 PNG
Minimum: 2 screenshots, Recommended: 4-5

## ⚠️ Items Requiring Manual Action

1. **W-8BEN Tax Form** - Partners Dashboard → Settings → Payouts
   - US tax form for non-US developers
   - Required before receiving payouts
   
2. **Payout Settings** - Partners Dashboard → Settings → Payouts
   - Bank account or PayPal for receiving payments

3. **App Screenshots** - Need to capture from live app
   - Can use developer store admin panel
   - Or use test page at https://shopify-ai-lister-tau.vercel.app/test.html

4. **App Icon** - 512x512 PNG, no rounded corners
   - Simple, recognizable icon for WISMO AI

5. **Final App Store Submission** - After screenshots and W-8BEN
