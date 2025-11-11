# Quick script to add MTN credentials - EDIT WITH YOUR ACTUAL VALUES
# Replace the values below with your actual MTN credentials from the Developer Portal

$MTN_API_KEY = "Vrg0XXXXXXXXXXXXXXXXXXXXXXXXXFc5"  # REPLACE WITH YOUR FULL CONSUMER KEY
$MTN_API_SECRET = "OMjmXXXXXXXXPOyJ"  # REPLACE WITH YOUR FULL CONSUMER SECRET
$MTN_ENVIRONMENT = "sandbox"  # Use "sandbox" for testing, "production" for live

Write-Host "🔐 Adding MTN Credentials to Vercel...`n" -ForegroundColor Cyan

$environments = @("production", "preview", "development")

# Add MTN_API_KEY
Write-Host "Adding MTN_API_KEY..." -ForegroundColor Yellow
foreach ($env in $environments) {
    try {
        $MTN_API_KEY | vercel env add MTN_API_KEY $env 2>&1 | Out-Null
        Write-Host "  ✅ $env" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  $env (may already exist)" -ForegroundColor Yellow
    }
}

# Add MTN_API_SECRET
Write-Host "`nAdding MTN_API_SECRET..." -ForegroundColor Yellow
foreach ($env in $environments) {
    try {
        $MTN_API_SECRET | vercel env add MTN_API_SECRET $env 2>&1 | Out-Null
        Write-Host "  ✅ $env" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  $env (may already exist)" -ForegroundColor Yellow
    }
}

# Add MTN_ENVIRONMENT
Write-Host "`nAdding MTN_ENVIRONMENT..." -ForegroundColor Yellow
foreach ($env in $environments) {
    try {
        $MTN_ENVIRONMENT | vercel env add MTN_ENVIRONMENT $env 2>&1 | Out-Null
        Write-Host "  ✅ $env" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  $env (may already exist)" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Setup complete!`n" -ForegroundColor Green
Write-Host "Next: vercel --prod (to redeploy)" -ForegroundColor Cyan

