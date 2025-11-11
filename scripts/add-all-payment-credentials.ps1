# Complete Payment Credentials Setup Script
# Add both MTN and Airtel credentials to Vercel

Write-Host "`n🔐 Complete Payment Credentials Setup`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# MTN Credentials
Write-Host "MTN MOBILE MONEY" -ForegroundColor Yellow
Write-Host "-" * 60 -ForegroundColor Gray
$MTN_API_KEY = Read-Host "Enter MTN Consumer Key (API Key)"
$MTN_API_SECRET = Read-Host "Enter MTN Consumer Secret (API Secret)"
$MTN_ENVIRONMENT = Read-Host "MTN Environment [sandbox]" 
if ([string]::IsNullOrWhiteSpace($MTN_ENVIRONMENT)) { $MTN_ENVIRONMENT = "sandbox" }

Write-Host ""

# Airtel Credentials
Write-Host "AIRTEL MONEY" -ForegroundColor Yellow
Write-Host "-" * 60 -ForegroundColor Gray
$AIRTEL_API_KEY = Read-Host "Enter Airtel API Key (Client ID)"
$AIRTEL_API_SECRET = Read-Host "Enter Airtel API Secret (Client Secret)"
$AIRTEL_MERCHANT_CODE = Read-Host "Airtel Merchant Code [7WTV89LD]"
if ([string]::IsNullOrWhiteSpace($AIRTEL_MERCHANT_CODE)) { $AIRTEL_MERCHANT_CODE = "7WTV89LD" }
$AIRTEL_APPLICATION_NAME = Read-Host "Application Name [jenda_mobility]"
if ([string]::IsNullOrWhiteSpace($AIRTEL_APPLICATION_NAME)) { $AIRTEL_APPLICATION_NAME = "jenda_mobility" }
$AIRTEL_ENVIRONMENT = Read-Host "Airtel Environment [sandbox]"
if ([string]::IsNullOrWhiteSpace($AIRTEL_ENVIRONMENT)) { $AIRTEL_ENVIRONMENT = "sandbox" }

Write-Host "`n📤 Adding credentials to Vercel...`n" -ForegroundColor Cyan

$environments = @("production", "preview", "development")

# Function to add env var
function Add-EnvVar {
    param($Name, $Value, $Environments)
    Write-Host "Adding $Name..." -ForegroundColor Yellow
    foreach ($env in $Environments) {
        try {
            $Value | vercel env add $Name $env 2>&1 | Out-Null
            Write-Host "  ✅ $env" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️  $env (may already exist)" -ForegroundColor Yellow
        }
    }
    Write-Host ""
}

# Add MTN credentials
Add-EnvVar "MTN_API_KEY" $MTN_API_KEY $environments
Add-EnvVar "MTN_API_SECRET" $MTN_API_SECRET $environments
Add-EnvVar "MTN_ENVIRONMENT" $MTN_ENVIRONMENT $environments

# Add Airtel credentials
Add-EnvVar "AIRTEL_API_KEY" $AIRTEL_API_KEY $environments
Add-EnvVar "AIRTEL_API_SECRET" $AIRTEL_API_SECRET $environments
Add-EnvVar "AIRTEL_MERCHANT_CODE" $AIRTEL_MERCHANT_CODE $environments
Add-EnvVar "AIRTEL_APPLICATION_NAME" $AIRTEL_APPLICATION_NAME $environments
Add-EnvVar "AIRTEL_ENVIRONMENT" $AIRTEL_ENVIRONMENT $environments

Write-Host "✅ Setup complete!`n" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Verify: vercel env ls" -ForegroundColor White
Write-Host "  2. Redeploy: vercel --prod" -ForegroundColor White
Write-Host "  3. Test: /admin/test-payments`n" -ForegroundColor White

