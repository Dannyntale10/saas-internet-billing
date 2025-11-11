/**
 * Script to add MTN API credentials to Vercel
 * Run: node scripts/add-mtn-credentials.js
 */

const { execSync } = require('child_process')

const credentials = {
  MTN_CONSUMER_KEY: 'Vrg0XXXXXXXXXXXXXXXXXXXXXXXXXFc5', // Replace with actual key
  MTN_CONSUMER_SECRET: 'OMjmXXXXXXXXPOyJ', // Replace with actual secret
  MTN_ENVIRONMENT: 'sandbox', // or 'production'
}

console.log('🔐 Adding MTN API credentials to Vercel...\n')

// Add to all environments
const environments = ['production', 'preview', 'development']

environments.forEach(env => {
  console.log(`Adding to ${env} environment...`)
  
  Object.entries(credentials).forEach(([key, value]) => {
    try {
      // Use echo to pipe value to vercel env add
      const command = `(echo "${value}") | vercel env add ${key} ${env}`
      execSync(command, { 
        stdio: 'inherit',
        shell: true 
      })
      console.log(`  ✅ ${key} added to ${env}`)
    } catch (error) {
      console.error(`  ❌ Failed to add ${key} to ${env}:`, error.message)
    }
  })
  
  console.log()
})

console.log('✅ Done! Credentials added to Vercel.')
console.log('\n📝 Next steps:')
console.log('1. Replace the placeholder values with your actual credentials')
console.log('2. Run this script again, or add manually via Vercel dashboard')
console.log('3. Redeploy your application')

