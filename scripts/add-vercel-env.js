// Script to add environment variables to Vercel using Vercel CLI
const { execSync } = require('child_process')

const envVars = {
  "DATABASE_URL": "postgresql://neondb_owner:npg_HC7I8tAJZYVT@ep-shiny-waterfall-afqei48z-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  "NEXTAUTH_SECRET": "SHeBSeohMTS2PlA8Pe40ibslgVhSEdYHrY5Bc7zHQf4=",
  "NEXTAUTH_URL": "https://saas-internet-billing.vercel.app",
  "MTN_ENVIRONMENT": "sandbox",
  "AIRTEL_ENVIRONMENT": "sandbox",
  "APP_NAME": "Internet Billing System",
  "APP_URL": "https://saas-internet-billing.vercel.app"
}

console.log('=== Adding Environment Variables to Vercel ===\n')

// Check if logged in
try {
  execSync('vercel whoami', { stdio: 'pipe' })
  console.log('✓ Logged into Vercel\n')
} catch (error) {
  console.error('❌ Not logged into Vercel!')
  console.error('Please run: vercel login')
  console.error('Then run this script again.')
  process.exit(1)
}

// Add each environment variable
for (const [key, value] of Object.entries(envVars)) {
  console.log(`Adding ${key}...`)
  
  try {
    // Add to all environments
    const environments = ['production', 'preview', 'development']
    
    for (const env of environments) {
      try {
        // Use echo to pipe value to vercel env add
        execSync(`echo "${value}" | vercel env add ${key} ${env}`, {
          stdio: 'pipe',
          shell: true
        })
        console.log(`  ✓ Added to ${env}`)
      } catch (error) {
        // Variable might already exist, try to update
        console.log(`  ⚠ ${env}: ${error.message.includes('already exists') ? 'Already exists (skipping)' : 'Error (may need manual update)'}`)
      }
    }
    
    console.log(`✓ ${key} completed\n`)
  } catch (error) {
    console.error(`❌ Error adding ${key}:`, error.message)
  }
}

console.log('\n✅ Environment variables setup complete!')
console.log('\nNext steps:')
console.log('1. Go to Vercel Dashboard → Deployments → Redeploy')
console.log('2. Create admin user: node scripts/create-admin-quick.js admin@example.com "Admin User" password123')

