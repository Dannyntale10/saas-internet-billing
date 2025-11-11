# GitHub Setup Instructions

## Step 1: Install Git

If Git is not installed on your system:

1. **Download Git for Windows**: https://git-scm.com/download/win
2. **Install** with default settings
3. **Restart** your terminal/PowerShell after installation

## Step 2: Push to GitHub

### Option A: Use the PowerShell Script (Easiest)

1. **Open PowerShell** in the project directory
2. **Run the script**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File push-to-github.ps1
   ```
3. **Enter your GitHub credentials** when prompted

### Option B: Manual Commands

If you prefer to run commands manually:

```powershell
# Initialize git (if not already done)
git init
git branch -M main

# Add remote repository
git remote add origin https://github.com/Dannyntale10/saas-internet-billing.git

# Add all files
git add .

# Commit
git commit -m "Initial commit: Complete SaaS Internet Billing System"

# Push to GitHub (you'll be prompted for credentials)
git push -u origin main --force
```

## Step 3: GitHub Authentication

When pushing, you'll need to authenticate:

- **Personal Access Token** (recommended):
  1. Go to: https://github.com/settings/tokens
  2. Click "Generate new token (classic)"
  3. Give it a name: "Vercel Deployment"
  4. Select scopes: `repo` (full control)
  5. Copy the token
  6. Use it as password when Git prompts for credentials

- **Username**: Your GitHub username
- **Password**: Your Personal Access Token (not your GitHub password)

## Step 4: Verify

After pushing, check your repository:
https://github.com/Dannyntale10/saas-internet-billing

All files should now be there!

## Next: Deploy to Vercel

Once files are on GitHub:

1. Go to https://vercel.com
2. Click "New Project"
3. Import from GitHub: `Dannyntale10/saas-internet-billing`
4. Vercel will auto-detect Next.js
5. Add environment variables
6. Deploy!

See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for Vercel deployment steps.

