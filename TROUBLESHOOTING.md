# Troubleshooting Vercel Build Errors

## How to Get Error Details

1. Go to **Vercel Dashboard** → Your Project
2. Click on the **failed deployment**
3. Click **"Build Logs"** tab
4. Copy the **exact error message** (especially the red text)

## Common Errors & Quick Fixes

### Error: "Module not found" or "Cannot find module"
**Fix**: All dependencies are in package.json. If you see a specific module error, share it and I'll add it.

### Error: "Prisma Client not generated"
**Fix**: ✅ Already fixed - `postinstall` script runs `prisma generate`

### Error: "Type error" or TypeScript errors
**Fix**: Share the exact error message and file path, I'll fix it.

### Error: "Environment variable missing"
**Fix**: Add required variables in Vercel Dashboard → Settings → Environment Variables:
- `DATABASE_URL`
- `NEXTAUTH_SECRET` 
- `NEXTAUTH_URL`

### Error: "Build timeout"
**Fix**: Build should be faster now. If it still times out, we may need to optimize.

### Error: "Database connection failed"
**Fix**: 
1. Verify `DATABASE_URL` is set correctly
2. Ensure database allows connections from Vercel IPs
3. Check if connection string includes `?sslmode=require`

## What to Share

When reporting errors, please include:
1. **Exact error message** (copy from Vercel build logs)
2. **File path** (if mentioned in error)
3. **Line number** (if mentioned in error)
4. **Which step failed** (install, build, or deploy)

## Quick Test

To test locally before deploying:
```bash
npm install
npm run build
```

If this works locally but fails on Vercel, it's likely:
- Missing environment variables
- Database connection issue
- Vercel-specific configuration

