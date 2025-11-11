# 🔐 MTN API Credentials Setup Guide

## 📋 Your MTN API Credentials

From your MTN Developer Portal, you have:
- **Consumer Key (API Key):** `Vrg0XXXXXXXXXXXXXXXXXXXXXXXXXFc5`
- **Consumer Secret (API Secret):** `OMjmXXXXXXXXPOyJ`
- **Country:** Uganda
- **Entity:** Jenda_Mobility_Limited
- **Environment:** Production (or Sandbox for testing)

## 🚀 Quick Setup Methods

### Method 1: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dannyntale10s-projects/saas-internet-billing/settings/environment-variables

2. **Add Environment Variables:**
   
   **MTN_API_KEY:**
   - Name: `MTN_API_KEY`
   - Value: `Vrg0XXXXXXXXXXXXXXXXXXXXXXXXXFc5` (your Consumer Key)
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

   **MTN_API_SECRET:**
   - Name: `MTN_API_SECRET`
   - Value: `OMjmXXXXXXXXPOyJ` (your Consumer Secret)
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

   **MTN_ENVIRONMENT:**
   - Name: `MTN_ENVIRONMENT`
   - Value: `sandbox` (for testing) or `production` (for live)
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

3. **Redeploy:**
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"

### Method 2: Via Vercel CLI

```bash
# Add MTN_API_KEY
echo "Vrg0XXXXXXXXXXXXXXXXXXXXXXXXXFc5" | vercel env add MTN_API_KEY production
echo "Vrg0XXXXXXXXXXXXXXXXXXXXXXXXXFc5" | vercel env add MTN_API_KEY preview
echo "Vrg0XXXXXXXXXXXXXXXXXXXXXXXXXFc5" | vercel env add MTN_API_KEY development

# Add MTN_API_SECRET
echo "OMjmXXXXXXXXPOyJ" | vercel env add MTN_API_SECRET production
echo "OMjmXXXXXXXXPOyJ" | vercel env add MTN_API_SECRET preview
echo "OMjmXXXXXXXXPOyJ" | vercel env add MTN_API_SECRET development

# Add MTN_ENVIRONMENT
echo "sandbox" | vercel env add MTN_ENVIRONMENT production
echo "sandbox" | vercel env add MTN_ENVIRONMENT preview
echo "sandbox" | vercel env add MTN_ENVIRONMENT development
```

### Method 3: Using the Setup Script

```bash
node scripts/add-mtn-credentials.js
```

The script will prompt you for your credentials and add them automatically.

## ✅ Verify Setup

After adding credentials, verify they're set:

```bash
vercel env ls
```

You should see:
- `MTN_API_KEY` (Encrypted) - Production, Preview, Development
- `MTN_API_SECRET` (Encrypted) - Production, Preview, Development
- `MTN_ENVIRONMENT` (Encrypted) - Production, Preview, Development

## 🧪 Testing

1. **Redeploy your app:**
   ```bash
   vercel --prod
   ```

2. **Test Payment Flow:**
   - Login as Admin
   - Go to `/admin/test-payments`
   - Use sandbox test numbers:
     - MTN: `256700000000` or `256700000001`
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
- **MTN Sandbox:** `256700000000`, `256700000001`
- **Amount:** Any amount (no real money)
- **Environment:** Set `MTN_ENVIRONMENT=sandbox`

## 🚨 Troubleshooting

### "Failed to get MTN access token"
- Check API Key and Secret are correct
- Verify environment is set correctly
- Check MTN Developer Portal for API status

### "Payment request failed"
- Verify sandbox credentials are active
- Check phone number format (should be without +)
- Ensure test numbers are valid for sandbox

### "Unauthorized"
- Check API credentials are set in Vercel
- Verify environment variables are deployed
- Redeploy after adding credentials

## 📞 Support

- **MTN Developer Portal:** https://momodeveloper.mtn.com
- **MTN API Documentation:** Check MTN Developer Portal
- **Vercel Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables

## 🎯 Next Steps

1. ✅ Add credentials to Vercel
2. ✅ Redeploy application
3. ✅ Test payment flow at `/admin/test-payments`
4. ✅ Test with real vouchers once sandbox works
5. ✅ Switch to production when ready

---

**Important:** Replace the masked values (`XXXXX`) with your actual credentials from the MTN Developer Portal!

