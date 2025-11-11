/**
 * Interactive script to add MTN API credentials to Vercel
 * Run: node scripts/setup-mtn-credentials.js
 */

const { execSync } = require('child_process')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function setupMTNCredentials() {
  console.log('\n🔐 MTN API Credentials Setup for Vercel\n')
  console.log('=' .repeat(50))
  console.log('Please enter your MTN API credentials from the MTN Developer Portal')
  console.log('(The values shown in the portal, not the masked XXXXX values)\n')

  try {
    // Get credentials
    const apiKey = await question('Enter MTN Consumer Key (API Key): ')
    const apiSecret = await question('Enter MTN Consumer Secret (API Secret): ')
    const environment = await question('Environment (sandbox/production) [sandbox]: ') || 'sandbox'

    if (!apiKey || !apiSecret) {
      console.error('\n❌ Error: Both API Key and Secret are required')
      process.exit(1)
    }

    console.log('\n📤 Adding credentials to Vercel...\n')

    const environments = ['production', 'preview', 'development']
    let successCount = 0
    let errorCount = 0

    // Add MTN_API_KEY
    console.log('1. Adding MTN_API_KEY...')
    for (const env of environments) {
      try {
        execSync(
          `echo "${apiKey}" | vercel env add MTN_API_KEY ${env}`,
          { stdio: 'pipe', shell: true }
        )
        console.log(`   ✅ Added to ${env}`)
        successCount++
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  ${env}: Already exists (skipping)`)
        } else {
          console.log(`   ❌ ${env}: ${error.message.split('\n')[0]}`)
          errorCount++
        }
      }
    }

    // Add MTN_API_SECRET
    console.log('\n2. Adding MTN_API_SECRET...')
    for (const env of environments) {
      try {
        execSync(
          `echo "${apiSecret}" | vercel env add MTN_API_SECRET ${env}`,
          { stdio: 'pipe', shell: true }
        )
        console.log(`   ✅ Added to ${env}`)
        successCount++
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  ${env}: Already exists (skipping)`)
        } else {
          console.log(`   ❌ ${env}: ${error.message.split('\n')[0]}`)
          errorCount++
        }
      }
    }

    // Add MTN_ENVIRONMENT
    console.log('\n3. Adding MTN_ENVIRONMENT...')
    for (const env of environments) {
      try {
        execSync(
          `echo "${environment}" | vercel env add MTN_ENVIRONMENT ${env}`,
          { stdio: 'pipe', shell: true }
        )
        console.log(`   ✅ Added to ${env}`)
        successCount++
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  ${env}: Already exists (skipping)`)
        } else {
          console.log(`   ❌ ${env}: ${error.message.split('\n')[0]}`)
          errorCount++
        }
      }
    }

    console.log('\n' + '=' .repeat(50))
    if (errorCount === 0) {
      console.log('✅ All MTN credentials added successfully!')
    } else {
      console.log(`⚠️  Setup completed with ${errorCount} errors`)
    }
    
    console.log('\n📝 Next Steps:')
    console.log('   1. Verify: vercel env ls | findstr MTN')
    console.log('   2. Redeploy: vercel --prod')
    console.log('   3. Test payments: /admin/test-payments')
    console.log('   4. Use sandbox test numbers: 256700000000\n')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  } finally {
    rl.close()
  }
}

// Check if logged into Vercel
try {
  execSync('vercel whoami', { stdio: 'pipe' })
  setupMTNCredentials()
} catch (error) {
  console.error('❌ Not logged into Vercel!')
  console.error('Please run: vercel login')
  console.error('Then run this script again.')
  process.exit(1)
}

