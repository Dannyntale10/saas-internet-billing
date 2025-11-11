# Script to add environment variables to Vercel automatically
# Make sure you're logged in: vercel login

Write-Host "=== Adding Environment Variables to Vercel ===" -ForegroundColor Green

$projectName = "saas-internet-billing"

# Required variables
$envVars = @{
    "DATABASE_URL" = "postgresql://neondb_owner:npg_HC7I8tAJZYVT@ep-shiny-waterfall-afqei48z-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    "NEXTAUTH_SECRET" = "SHeBSeohMTS2PlA8Pe40ibslgVhSEdYHrY5Bc7zHQf4="
    "NEXTAUTH_URL" = "https://saas-internet-billing.vercel.app"
    "MTN_ENVIRONMENT" = "sandbox"
    "AIRTEL_ENVIRONMENT" = "sandbox"
    "APP_NAME" = "Internet Billing System"
    "APP_URL" = "https://saas-internet-billing.vercel.app"
}

Write-Host "`nAdding environment variables..." -ForegroundColor Yellow

foreach ($key in $envVars.Keys) {
    Write-Host "Adding $key..." -ForegroundColor Cyan
    $value = $envVars[$key]
    
    # Add to production
    vercel env add $key production <<< $value 2>&1 | Out-Null
    
    # Add to preview
    vercel env add $key preview <<< $value 2>&1 | Out-Null
    
    # Add to development
    vercel env add $key development <<< $value 2>&1 | Out-Null
    
    Write-Host "  ✓ $key added" -ForegroundColor Green
}

Write-Host "`n✅ All environment variables added!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Go to Vercel Dashboard → Deployments → Redeploy" -ForegroundColor White
Write-Host "2. Create admin user with: node scripts/create-admin-quick.js" -ForegroundColor White

