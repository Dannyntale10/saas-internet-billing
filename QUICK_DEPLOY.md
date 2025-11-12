# Quick Deployment Guide - jendamobility.gt.tc

## 🚀 Fast Track (5 Steps)

### Step 1: Deploy to Vercel (5 minutes)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

Follow the prompts. Your app will be live at `your-project.vercel.app`

### Step 2: Create Free Database (2 minutes)

1. Go to **https://neon.tech** → Sign up (free)
2. Create project: `internet-billing-prod`
3. Copy the connection string (looks like: `postgresql://user:pass@host/db?sslmode=require`)

### Step 3: Add Environment Variables in Vercel (3 minutes)

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add these:

```
DATABASE_URL = [paste your Neon connection string]
NEXTAUTH_URL = https://jendamobility.gt.tc
NEXTAUTH_SECRET = [run: openssl rand -base64 32]
MTN_API_KEY = [your key]
MTN_API_SECRET = [your secret]
MTN_ENVIRONMENT = production
AIRTEL_API_KEY = [your key]
AIRTEL_API_SECRET = [your secret]
AIRTEL_ENVIRONMENT = production
APP_NAME = Internet Billing System
APP_URL = https://jendamobility.gt.tc
```

3. Click **Save** → Go to **Deployments** → Click **Redeploy**

### Step 4: Run Database Setup (2 minutes)

```bash
# Set production database URL
$env:DATABASE_URL="your-neon-connection-string"

# Run migrations
npx prisma migrate deploy

# Create admin user
node scripts/deploy-production.js
```

### Step 5: Connect Your Domain (5 minutes)

1. In **Vercel Dashboard** → **Settings** → **Domains**
2. Click **Add Domain** → Enter: `jendamobility.gt.tc`
3. Vercel shows: **CNAME** → `cname.vercel-dns.com`
4. In your DNS provider (where jendamobility.gt.tc is managed):
   - Add **CNAME** record:
     - Name: `@` (or blank)
     - Value: `cname.vercel-dns.com`
5. Wait 5-60 minutes for DNS to update
6. Vercel automatically adds SSL certificate ✅

## ✅ Done!

Visit: **https://jendamobility.gt.tc**

Login with your admin credentials!

---

## 📋 Detailed Instructions

See [DEPLOYMENT_STEPS.md](./DEPLOYMENT_STEPS.md) for complete step-by-step guide.

## 🆘 Troubleshooting

**Domain not working?**
- Check DNS: https://dnschecker.org
- Verify CNAME record is correct
- Wait up to 24 hours

**Database errors?**
- Verify DATABASE_URL is correct
- Check Neon dashboard
- Ensure SSL mode is enabled

**Build fails?**
- Check Vercel build logs
- Verify all environment variables are set
- Check Prisma schema

