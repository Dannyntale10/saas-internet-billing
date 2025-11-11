# 🔐 Airtel Money API Credentials Setup Guide

## 📋 Your Airtel API Credentials

From your Airtel Developer Portal:
- **Application Name:** `jenda_mobility`
- **Merchant Code:** `7WTV89LD`
- **API Key (Client ID):** (from Airtel Portal)
- **API Secret (Client Secret):** (from Airtel Portal)

## 🚀 Quick Setup Methods

### Method 1: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dannyntale10s-projects/saas-internet-billing/settings/environment-variables

2. **Add Environment Variables:**
   
   **AIRTEL_API_KEY:**
   - Name: `AIRTEL_API_KEY`
   - Value: Your Airtel API Key (Client ID)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **AIRTEL_API_SECRET:**
   - Name: `AIRTEL_API_SECRET`
   - Value: Your Airtel API Secret (Client Secret)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **AIRTEL_MERCHANT_CODE:**
   - Name: `AIRTEL_MERCHANT_CODE`
   - Value: `7WTV89LD`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **AIRTEL_APPLICATION_NAME:**
   - Name: `AIRTEL_APPLICATION_NAME`
   - Value: `jenda_mobility`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **AIRTEL_ENVIRONMENT:**
   - Name: `AIRTEL_ENVIRONMENT`
   - Value: `sandbox` (for testing) or `production` (for live)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

3. **Redeploy:**
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"

### Method 2: Via Vercel CLI

```bash
# Add Airtel credentials
echo "YOUR_AIRTEL_API_KEY" | vercel env add AIRTEL_API_KEY production
echo "YOUR_AIRTEL_API_KEY" | vercel env add AIRTEL_API_KEY preview
echo "YOUR_AIRTEL_API_KEY" | vercel env add AIRTEL_API_KEY development

echo "YOUR_AIRTEL_API_SECRET" | vercel env add AIRTEL_API_SECRET production
echo "YOUR_AIRTEL_API_SECRET" | vercel env add AIRTEL_API_SECRET preview
echo "YOUR_AIRTEL_API_SECRET" | vercel env add AIRTEL_API_SECRET development

echo "7WTV89LD" | vercel env add AIRTEL_MERCHANT_CODE production
echo "7WTV89LD" | vercel env add AIRTEL_MERCHANT_CODE preview
echo "7WTV89LD" | vercel env add AIRTEL_MERCHANT_CODE development

echo "jenda_mobility" | vercel env add AIRTEL_APPLICATION_NAME production
echo "jenda_mobility" | vercel env add AIRTEL_APPLICATION_NAME preview
echo "jenda_mobility" | vercel env add AIRTEL_APPLICATION_NAME development

echo "sandbox" | vercel env add AIRTEL_ENVIRONMENT production
echo "sandbox" | vercel env add AIRTEL_ENVIRONMENT preview
echo "sandbox" | vercel env add AIRTEL_ENVIRONMENT development
```

### Method 3: Using the Setup Script

```bash
# Interactive script
node scripts/add-airtel-credentials.js

# Or use the complete setup script for both MTN and Airtel
powershell -ExecutionPolicy Bypass -File scripts/add-all-payment-credentials.ps1
```

## ✅ Verify Setup

After adding credentials, verify they're set:

```bash
vercel env ls
```

You should see:
- `AIRTEL_API_KEY` (Encrypted) - Production, Preview, Development
- `AIRTEL_API_SECRET` (Encrypted) - Production, Preview, Development
- `AIRTEL_MERCHANT_CODE` (Encrypted) - Production, Preview, Development
- `AIRTEL_APPLICATION_NAME` (Encrypted) - Production, Preview, Development
- `AIRTEL_ENVIRONMENT` (Encrypted) - Production, Preview, Development

## 🧪 Testing

1. **Redeploy your app:**
   ```bash
   vercel --prod
   ```

2. **Test Payment Flow:**
   - Login as Admin
   - Go to `/admin/test-payments`
   - Use sandbox test numbers:
     - Airtel: `256700000001` or `256700000002`
   - Run test payment

3. **Check Test Results:**
   - View test results on the test page
   - Check for successful connection
   - Verify payment request initiation

## 🔒 Security Notes

- ✅ Never commit credentials to Git
- ✅ Use environment variables only
- ✅ Use `sandbox` for testing, `production` for live
- ✅ Keep credentials secure and rotate regularly
- ✅ Use different credentials for sandbox and production

## 📱 Sandbox Testing

For sandbox testing, use these test numbers:
- **Airtel Sandbox:** `256700000001`, `256700000002`
- **Amount:** Any amount (no real money)
- **Environment:** Set `AIRTEL_ENVIRONMENT=sandbox`

## 🚨 Troubleshooting

### "Failed to get Airtel access token"
- Check API Key and Secret are correct
- Verify environment is set correctly
- Check Airtel Developer Portal for API status

### "Payment request failed"
- Verify sandbox credentials are active
- Check phone number format (should be without +)
- Ensure test numbers are valid for sandbox
- Verify Merchant Code is correct

### "Unauthorized"
- Check API credentials are set in Vercel
- Verify environment variables are deployed
- Redeploy after adding credentials

## 📞 Support

- **Airtel Developer Portal:** Check your Airtel developer account
- **Airtel API Documentation:** Check Airtel Developer Portal
- **Vercel Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables

## 🎯 Next Steps

1. ✅ Add credentials to Vercel
2. ✅ Redeploy application
3. ✅ Test payment flow at `/admin/test-payments`
4. ✅ Test with real vouchers once sandbox works
5. ✅ Switch to production when ready

---

## 📋 Complete Environment Variables Checklist

### MTN Mobile Money
- [ ] MTN_API_KEY
- [ ] MTN_API_SECRET
- [ ] MTN_ENVIRONMENT

### Airtel Money
- [ ] AIRTEL_API_KEY
- [ ] AIRTEL_API_SECRET
- [ ] AIRTEL_MERCHANT_CODE (`7WTV89LD`)
- [ ] AIRTEL_APPLICATION_NAME (`jenda_mobility`)
- [ ] AIRTEL_ENVIRONMENT

### Core App
- [x] DATABASE_URL
- [x] NEXTAUTH_SECRET
- [x] NEXTAUTH_URL

---

**Your Airtel Details:**
- **Application Name:** `jenda_mobility`
- **Merchant Code:** `7WTV89LD`

