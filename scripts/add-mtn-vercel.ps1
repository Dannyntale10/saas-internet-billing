# PowerShell script to add MTN credentials to Vercel
# Run: powershell -ExecutionPolicy Bypass -File scripts/add-mtn-vercel.ps1

Write-Host "🔐 Adding MTN API Credentials to Vercel`n" -ForegroundColor Cyan

# Replace these with your actual credentials from MTN Developer Portal
$MTN_API_KEY = "Vrg0XXXXXXXXXXXXXXXXXXXXXXXXXFc5"
$MTN_API_SECRET = "OMjmXXXXXXXXPOyJ"
$MTN_ENVIRONMENT = "sandbox"

$environments = @("production", "preview", "development")

# Add MTN_API_KEY
Write-Host "Adding MTN_API_KEY...`n" -ForegroundColor Yellow
foreach ($env in $environments) {
    try {
        $MTN_API_KEY | vercel env add MTN_API_KEY $env
        Write-Host "  ✅ Added to $env" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  $env : Error (may already exist)" -ForegroundColor Yellow
    }
}

# Add MTN_API_SECRET
Write-Host "`nAdding MTN_API_SECRET...`n" -ForegroundColor Yellow
foreach ($env in $environments) {
    try {
        $MTN_API_SECRET | vercel env add MTN_API_SECRET $env
        Write-Host "  ✅ Added to $env" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  $env : Error (may already exist)" -ForegroundColor Yellow
    }
}

# Add MTN_ENVIRONMENT
Write-Host "`nAdding MTN_ENVIRONMENT...`n" -ForegroundColor Yellow
foreach ($env in $environments) {
    try {
        $MTN_ENVIRONMENT | vercel env add MTN_ENVIRONMENT $env
        Write-Host "  ✅ Added to $env" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  $env : Error (may already exist)" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ MTN credentials setup complete!`n" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Redeploy: vercel --prod" -ForegroundColor White
Write-Host "   2. Test at: /admin/test-payments" -ForegroundColor White
Write-Host "   3. Use sandbox test numbers for testing`n" -ForegroundColor White

