# PowerShell script to add MTN credentials to Vercel
# Run: powershell -ExecutionPolicy Bypass -File scripts/add-mtn-credentials-vercel.ps1

Write-Host "🔐 Adding MTN API credentials to Vercel..." -ForegroundColor Cyan
Write-Host ""

# IMPORTANT: Replace these with your actual credentials from MTN Developer Portal
$MTN_CONSUMER_KEY = "Vrg0XXXXXXXXXXXXXXXXXXXXXXXXXFc5"  # Replace X's with actual key
$MTN_CONSUMER_SECRET = "OMjmXXXXXXXXPOyJ"  # Replace X's with actual secret
$MTN_ENVIRONMENT = "production"  # or "sandbox" for testing

$environments = @("production", "preview", "development")

foreach ($env in $environments) {
    Write-Host "Adding to $env environment..." -ForegroundColor Yellow
    
    # Add Consumer Key
    Write-Host "  Adding MTN_CONSUMER_KEY..." -ForegroundColor Gray
    $MTN_CONSUMER_KEY | vercel env add MTN_CONSUMER_KEY $env
    
    # Add Consumer Secret
    Write-Host "  Adding MTN_CONSUMER_SECRET..." -ForegroundColor Gray
    $MTN_CONSUMER_SECRET | vercel env add MTN_CONSUMER_SECRET $env
    
    # Add Environment (use sandbox for development)
    $envValue = if ($env -eq "development") { "sandbox" } else { $MTN_ENVIRONMENT }
    Write-Host "  Adding MTN_ENVIRONMENT ($envValue)..." -ForegroundColor Gray
    $envValue | vercel env add MTN_ENVIRONMENT $env
    
    Write-Host "  ✅ Credentials added to $env" -ForegroundColor Green
    Write-Host ""
}

Write-Host "✅ Done! Credentials added to Vercel." -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Replace placeholder values with your actual credentials" -ForegroundColor White
Write-Host "2. Run this script again, or add manually via Vercel dashboard" -ForegroundColor White
Write-Host "3. Redeploy your application" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Replace the X's with your actual Consumer Key and Secret!" -ForegroundColor Red

