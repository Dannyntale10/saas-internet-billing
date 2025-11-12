# Vercel Deployment Fix Guide

## Common Errors and Solutions

### Error 1: Prisma Client Not Generated
**Symptom**: `@prisma/client did not initialize yet`

**Solution**: ✅ Fixed in package.json - Added `postinstall` script

### Error 2: Missing Environment Variables
**Symptom**: Build fails or runtime errors

**Required Variables** (Add in Vercel Dashboard → Settings → Environment Variables):

```
DATABASE_URL=your-postgresql-connection-string
NEXTAUTH_URL=https://your-app.vercel.app (or your custom domain)
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

**Optional but Recommended**:
```
MTN_API_KEY=your-key
MTN_API_SECRET=your-secret
MTN_ENVIRONMENT=sandbox
AIRTEL_API_KEY=your-key
AIRTEL_API_SECRET=your-secret
AIRTEL_ENVIRONMENT=sandbox
APP_NAME=Internet Billing System
APP_URL=https://your-app.vercel.app
```

### Error 3: Database Connection Failed
**Symptom**: `Can't reach database server`

**Solution**:
1. Create a free Neon database: https://neon.tech
2. Copy the connection string
3. Add as `DATABASE_URL` in Vercel
4. Make sure connection string includes `?sslmode=require`

### Error 4: Build Timeout
**Symptom**: Build exceeds time limit

**Solution**: 
- Vercel has a 45-minute build limit
- Prisma generation is now in postinstall (runs during npm install)
- This should speed up builds

### Error 5: TypeScript Errors
**Symptom**: Type errors during build

**Solution**: 
- Check build logs in Vercel
- Ensure all dependencies are in package.json
- Run `npm run build` locally to catch errors first

## Step-by-Step Fix

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add Required Variables**:
   - `DATABASE_URL` (from Neon or your PostgreSQL)
   - `NEXTAUTH_SECRET` (generate: `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (your Vercel URL: `https://saas-internet-billing.vercel.app`)

3. **Redeploy**:
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"

4. **Check Build Logs**:
   - Click on the deployment
   - Check "Build Logs" tab
   - Look for specific error messages

## Quick Test

After deployment, visit:
- `https://your-app.vercel.app` - Should redirect to login
- `https://your-app.vercel.app/auth/login` - Should show login page

If you see errors, check:
1. Environment variables are set correctly
2. Database is accessible
3. Build completed successfully

## Still Having Issues?

Share the specific error message from Vercel build logs, and I'll help fix it!

