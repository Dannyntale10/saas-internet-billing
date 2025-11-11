# Deployment Steps for jendamobility.gt.tc

## Step 1: Create Vercel Account & Deploy

1. **Go to https://vercel.com and sign up/login** (use GitHub account for easiest setup)

2. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

3. **Login to Vercel**:
   ```bash
   vercel login
   ```

4. **Deploy the project**:
   ```bash
   vercel
   ```
   - Follow prompts:
     - Set up and deploy? **Yes**
     - Which scope? (select your account)
     - Link to existing project? **No**
     - Project name? **saas-internet-billing** (or your choice)
     - Directory? **./** (current directory)
     - Override settings? **No**

5. **Note the deployment URL** (e.g., `saas-internet-billing.vercel.app`)

## Step 2: Set Up Production Database (Neon - Free Tier)

1. **Go to https://neon.tech and sign up** (free tier available)

2. **Create a new project**:
   - Project name: `internet-billing-prod`
   - Region: Choose closest to your users
   - PostgreSQL version: 15

3. **Get connection string**:
   - Go to Dashboard → Your Project → Connection Details
   - Copy the connection string (looks like: `postgresql://user:password@host/dbname?sslmode=require`)

## Step 3: Configure Vercel Environment Variables

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add these variables**:

   ```
   DATABASE_URL=your-neon-connection-string-here
   NEXTAUTH_URL=https://jendamobility.gt.tc
   NEXTAUTH_SECRET=generate-a-random-secret-here
   MTN_API_KEY=your-mtn-api-key
   MTN_API_SECRET=your-mtn-api-secret
   MTN_ENVIRONMENT=production
   AIRTEL_API_KEY=your-airtel-api-key
   AIRTEL_API_SECRET=your-airtel-api-secret
   AIRTEL_ENVIRONMENT=production
   APP_NAME=Internet Billing System
   APP_URL=https://jendamobility.gt.tc
   ```

3. **Generate NEXTAUTH_SECRET**:
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and use it as NEXTAUTH_SECRET

4. **Save all variables** and redeploy:
   - Go to Deployments tab
   - Click the three dots on latest deployment
   - Click "Redeploy"

## Step 4: Run Database Migrations

1. **Install Vercel CLI** (if not done):
   ```bash
   npm i -g vercel
   ```

2. **Pull environment variables locally** (for migration):
   ```bash
   vercel env pull .env.production
   ```

3. **Run migrations**:
   ```bash
   # Set DATABASE_URL from .env.production
   $env:DATABASE_URL="your-neon-connection-string"
   npx prisma migrate deploy
   ```

   OR use Vercel's built-in migration:
   ```bash
   vercel env pull
   npx prisma migrate deploy
   ```

## Step 5: Create Admin User

1. **Create a script to run on Vercel** or run locally with production DB:

   ```bash
   # Set production DATABASE_URL
   $env:DATABASE_URL="your-neon-connection-string"
   node scripts/create-admin.js
   ```

2. **Enter admin credentials** when prompted

## Step 6: Configure Domain (jendamobility.gt.tc)

### Option A: If you have DNS access to jendamobility.gt.tc

1. **In Vercel Dashboard**:
   - Go to your project → Settings → Domains
   - Click "Add Domain"
   - Enter: `jendamobility.gt.tc`
   - Click "Add"

2. **Vercel will show DNS records**:
   - Type: **CNAME**
   - Name: `@` or `jendamobility`
   - Value: `cname.vercel-dns.com`

3. **In your DNS provider** (where jendamobility.gt.tc is managed):
   - Add CNAME record:
     - Name: `@` (or leave blank for root domain)
     - Value: `cname.vercel-dns.com`
     - TTL: 3600

4. **Wait for DNS propagation** (5-60 minutes)

5. **Vercel will automatically provision SSL** certificate

### Option B: If using if0_4038918 hosting platform

If your current host (if0_4038918) doesn't allow DNS changes, you may need to:

1. **Point subdomain** instead:
   - Use `app.jendamobility.gt.tc` or `billing.jendamobility.gt.tc`
   - Add CNAME in DNS: `app` → `cname.vercel-dns.com`

2. **Or use Vercel's domain** temporarily:
   - Access via: `your-project.vercel.app`
   - Configure domain later when you have DNS access

## Step 7: Verify Deployment

1. **Visit your domain**: https://jendamobility.gt.tc

2. **Test login** with admin credentials

3. **Check database connection**:
   - Login as admin
   - Try creating a client
   - Verify data is saved

## Step 8: Set Up Mobile Money APIs (Production)

1. **MTN Mobile Money**:
   - Register at https://momodeveloper.mtn.com
   - Create app → Get API credentials
   - Update Vercel environment variables

2. **Airtel Money**:
   - Register at https://developer.airtel.com
   - Create app → Get API credentials
   - Update Vercel environment variables

3. **Redeploy** after updating API keys

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check Neon dashboard for connection status
- Ensure SSL mode is enabled in connection string

### Domain Not Working
- Check DNS propagation: https://dnschecker.org
- Verify CNAME record is correct
- Wait up to 24 hours for full propagation

### Build Errors
- Check Vercel build logs
- Ensure all environment variables are set
- Verify Prisma schema is correct

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Neon database logs
3. Verify all environment variables are set correctly

