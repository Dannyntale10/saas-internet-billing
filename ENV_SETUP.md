# Environment Variables Setup Guide

## ⚠️ IMPORTANT SECURITY WARNING

**NEVER commit your `.env` file with real secrets to GitHub!**

The `.env` file is already in `.gitignore` to protect your secrets. Only `.env.example` (with placeholder values) should be on GitHub.

## Where to Add Real Environment Variables

### For Vercel Deployment (Production)

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add these variables with your **REAL** values:

```
DATABASE_URL=your-actual-postgresql-connection-string
NEXTAUTH_SECRET=your-generated-secret-key
NEXTAUTH_URL=https://your-app.vercel.app
MTN_API_KEY=your-mtn-key
MTN_API_SECRET=your-mtn-secret
MTN_ENVIRONMENT=production
AIRTEL_API_KEY=your-airtel-key
AIRTEL_API_SECRET=your-airtel-secret
AIRTEL_ENVIRONMENT=production
APP_NAME=Internet Billing System
APP_URL=https://your-app.vercel.app
```

### For Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your local values (this file is NOT committed to GitHub)

## How to Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copy the output and use it as your `NEXTAUTH_SECRET`.

## Database Setup

### Option 1: Neon (Free, Recommended)
1. Go to https://neon.tech
2. Create a free account
3. Create a new project
4. Copy the connection string
5. Add as `DATABASE_URL` in Vercel

### Option 2: Local PostgreSQL
Use the connection string from your local database.

## Why .env is Not Committed

- `.env` contains sensitive secrets
- It's in `.gitignore` to prevent accidental commits
- Real secrets should only be in:
  - Vercel Environment Variables (for production)
  - Local `.env` file (for development, never commit)

## Security Best Practices

✅ DO:
- Use Vercel environment variables for production
- Keep `.env` local only
- Use `.env.example` as a template
- Rotate secrets if accidentally exposed

❌ DON'T:
- Commit `.env` to GitHub
- Share secrets in code
- Use production secrets in development
- Hardcode secrets in source code

