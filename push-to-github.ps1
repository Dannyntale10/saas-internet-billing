# Script to push all files to GitHub repository
# Make sure Git is installed first: https://git-scm.com/download/win

Write-Host "=== Pushing to GitHub ===" -ForegroundColor Green

# Check if git is available
try {
    $gitVersion = git --version
    Write-Host "Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Git is not installed!" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Initialize git if not already initialized
if (-not (Test-Path .git)) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    git branch -M main
}

# Add remote (will update if already exists)
Write-Host "Setting up remote repository..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/Dannyntale10/saas-internet-billing.git

# Add all files
Write-Host "Adding all files..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "Committing changes..." -ForegroundColor Yellow
$commitMessage = "Initial commit: Complete SaaS Internet Billing System"
git commit -m $commitMessage

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "You may be prompted for GitHub credentials..." -ForegroundColor Cyan
git push -u origin main --force

Write-Host "`n=== Done! ===" -ForegroundColor Green
Write-Host "Your code is now on GitHub: https://github.com/Dannyntale10/saas-internet-billing" -ForegroundColor Green

