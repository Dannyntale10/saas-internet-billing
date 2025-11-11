# Database Setup Instructions

## Your Neon Connection String

```
postgresql://neondb_owner:npg_HC7I8tAJZYVT@ep-shiny-waterfall-afqei48z-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Step 1: Add to Vercel Environment Variables

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add these variables:

```
DATABASE_URL=postgresql://neondb_owner:npg_HC7I8tAJZYVT@ep-shiny-waterfall-afqei48z-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NEXTAUTH_SECRET=[generate with: openssl rand -base64 32]
NEXTAUTH_URL=https://saas-internet-billing.vercel.app
```

3. Click **Save**
4. Go to **Deployments** → Click **Redeploy**

## Step 2: Initialize Database (Run Migrations)

After adding DATABASE_URL to Vercel, you need to run migrations. You can do this:

### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login
vercel login

# Pull environment variables
vercel env pull .env.production

# Run migrations
npx prisma migrate deploy
```

### Option B: Using Neon Web Console

1. Go to Neon Dashboard → Your Project
2. Click on "SQL Editor"
3. Run the migration SQL manually (from `prisma/migrations/20251111095851_init/migration.sql`)

### Option C: Direct Connection

```bash
# Set the DATABASE_URL
$env:DATABASE_URL="postgresql://neondb_owner:npg_HC7I8tAJZYVT@ep-shiny-waterfall-afqei48z-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Run migrations
npx prisma migrate deploy

# Create admin user
node scripts/deploy-production.js
```

## Step 3: Create Admin User

After migrations are complete, create your admin user:

```bash
# Set DATABASE_URL (if not already set)
$env:DATABASE_URL="postgresql://neondb_owner:npg_HC7I8tAJZYVT@ep-shiny-waterfall-afqei48z-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Create admin
node scripts/deploy-production.js
```

Enter:
- Email: your-admin@email.com
- Name: Admin User
- Password: (choose a secure password)

## Step 4: Verify

1. Visit your app: https://saas-internet-billing.vercel.app
2. Go to login page
3. Login with your admin credentials

## Troubleshooting

If you get connection errors:
- Verify DATABASE_URL is correct in Vercel
- Check Neon dashboard to ensure database is active
- Make sure connection string includes `?sslmode=require`

