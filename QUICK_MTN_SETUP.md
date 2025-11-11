# ⚡ Quick MTN Setup - Do Everything

## 🚀 Automated Setup

I've created scripts to add your MTN credentials automatically. **You need to provide your actual credentials** (the unmasked values from your MTN Developer Portal).

## 📋 Step-by-Step

### Option 1: Edit and Run Script (Fastest)

1. **Open:** `scripts/add-mtn-now.ps1`
2. **Replace the values:**
   ```powershell
   $MTN_API_KEY = "YOUR_ACTUAL_CONSUMER_KEY_HERE"
   $MTN_API_SECRET = "YOUR_ACTUAL_CONSUMER_SECRET_HERE"
   ```
3. **Run:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/add-mtn-now.ps1
   ```

### Option 2: Vercel Dashboard (Easiest - No Scripts)

1. Go to: https://vercel.com/dannyntale10s-projects/saas-internet-billing/settings/environment-variables
2. Click "Add New"
3. Add these 3 variables:

   **Variable 1:**
   - Key: `MTN_API_KEY`
   - Value: Your full Consumer Key
   - Environments: ✅ All

   **Variable 2:**
   - Key: `MTN_API_SECRET`
   - Value: Your full Consumer Secret
   - Environments: ✅ All

   **Variable 3:**
   - Key: `MTN_ENVIRONMENT`
   - Value: `sandbox`
   - Environments: ✅ All

4. Click "Save" for each

### Option 3: Interactive Script

```powershell
node scripts/setup-mtn-credentials.js
```

This will prompt you to enter your credentials securely.

## ✅ After Adding

1. **Verify:**
   ```powershell
   vercel env ls
   ```
   You should see MTN_API_KEY, MTN_API_SECRET, MTN_ENVIRONMENT

2. **Redeploy:**
   ```powershell
   vercel --prod
   ```

3. **Test:**
   - Go to: https://saas-internet-billing.vercel.app/admin/test-payments
   - Use sandbox test number: `256700000000`
   - Run test payment

## 🔑 Where to Find Your Credentials

From your MTN Developer Portal screenshot:
- **Consumer Key:** The full value (not the masked `Vrg0XXXXXXXXXXXXXXXXXXXXXXXXXFc5`)
- **Consumer Secret:** The full value (not the masked `OMjmXXXXXXXXPOyJ`)

Copy the **actual values** from the portal (they should be longer than the masked versions shown).

## 🎯 Quick Command Reference

```powershell
# Check if credentials are set
vercel env ls | Select-String MTN

# Redeploy after adding
vercel --prod

# Test payments
# Visit: /admin/test-payments
```

---

**Need help?** The Vercel Dashboard method (Option 2) is the easiest and most reliable!

