# 🔐 MTN API Credentials Setup Guide

## Your MTN API Credentials

From your MTN Developer Portal:

- **Consumer Key:** `Vrg0XXXXXXXXXXXXXXXXXXXXXXXXXFc5`
- **Consumer Secret:** `OMjmXXXXXXXXPOyJ`
- **Country:** Uganda
- **Entity Name:** Jenda_Mobility
- **Environment:** Production (or Sandbox for testing)

## 📋 Environment Variables to Add

Add these to Vercel (Production, Preview, and Development):

```
MTN_CONSUMER_KEY=Vrg0XXXXXXXXXXXXXXXXXXXXXXXXXFc5
MTN_CONSUMER_SECRET=OMjmXXXXXXXXPOyJ
MTN_ENVIRONMENT=production
```

**Note:** Replace the X's with your actual credentials!

## 🚀 Method 1: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dannyntale10s-projects/saas-internet-billing/settings/environment-variables

2. **Add Each Variable:**
   - Click "Add New"
   - **Name:** `MTN_CONSUMER_KEY`
   - **Value:** Your actual Consumer Key (replace X's)
   - **Environment:** Select all (Production, Preview, Development)
   - Click "Save"

   - Repeat for:
     - `MTN_CONSUMER_SECRET` = Your actual Consumer Secret
     - `MTN_ENVIRONMENT` = `production` (or `sandbox` for testing)

3. **Redeploy:**
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"

## 🖥️ Method 2: Via Vercel CLI

```bash
# Add Consumer Key
(echo "Vrg0XXXXXXXXXXXXXXXXXXXXXXXXXFc5") | vercel env add MTN_CONSUMER_KEY production
(echo "Vrg0XXXXXXXXXXXXXXXXXXXXXXXXXFc5") | vercel env add MTN_CONSUMER_KEY preview
(echo "Vrg0XXXXXXXXXXXXXXXXXXXXXXXXXFc5") | vercel env add MTN_CONSUMER_KEY development

# Add Consumer Secret
(echo "OMjmXXXXXXXXPOyJ") | vercel env add MTN_CONSUMER_SECRET production
(echo "OMjmXXXXXXXXPOyJ") | vercel env add MTN_CONSUMER_SECRET preview
(echo "OMjmXXXXXXXXPOyJ") | vercel env add MTN_CONSUMER_SECRET development

# Add Environment
(echo "production") | vercel env add MTN_ENVIRONMENT production
(echo "production") | vercel env add MTN_ENVIRONMENT preview
(echo "sandbox") | vercel env add MTN_ENVIRONMENT development
```

## ✅ Verify Setup

1. **Check Environment Variables:**
   ```bash
   vercel env ls
   ```

2. **Test Payment Flow:**
   - Login as Admin
   - Go to "Test Payments"
   - Test MTN payment with sandbox number

## 🔒 Security Notes

- ✅ Never commit credentials to Git
- ✅ Use different credentials for sandbox and production
- ✅ Rotate credentials regularly
- ✅ Keep Consumer Secret secure

## 📝 MTN API Documentation

- **Sandbox URL:** `https://sandbox.momodeveloper.mtn.com/v1`
- **Production URL:** `https://api.mtn.com/v1`
- **API Documentation:** Check MTN Developer Portal

## 🧪 Testing

For sandbox testing:
- Use test phone numbers provided by MTN
- Set `MTN_ENVIRONMENT=sandbox`
- Test payments won't charge real money

For production:
- Set `MTN_ENVIRONMENT=production`
- Use real phone numbers
- Real money will be charged

## ⚠️ Important

**Replace the X's in the credentials with your actual values from the MTN Developer Portal!**

The values shown are placeholders - you need to copy your actual Consumer Key and Consumer Secret.

