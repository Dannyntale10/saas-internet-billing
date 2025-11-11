/**
 * Interactive script to add Airtel Money API credentials to Vercel
 * Run: node scripts/add-airtel-credentials.js
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

async function setupAirtelCredentials() {
  console.log('\n🔐 Airtel Money API Credentials Setup for Vercel\n')
  console.log('=' .repeat(50))
  console.log('Please enter your Airtel Money API credentials\n')

  try {
    // Get credentials
    const apiKey = await question('Enter Airtel API Key (Client ID): ')
    const apiSecret = await question('Enter Airtel API Secret (Client Secret): ')
    const merchantCode = await question('Enter Merchant Code [7WTV89LD]: ') || '7WTV89LD'
    const applicationName = await question('Enter Application Name [jenda_mobility]: ') || 'jenda_mobility'
    const environment = await question('Environment (sandbox/production) [sandbox]: ') || 'sandbox'

    if (!apiKey || !apiSecret) {
      console.error('\n❌ Error: Both API Key and Secret are required')
      process.exit(1)
    }

    console.log('\n📤 Adding credentials to Vercel...\n')

    const environments = ['production', 'preview', 'development']
    let successCount = 0
    let errorCount = 0

    // Add AIRTEL_API_KEY
    console.log('1. Adding AIRTEL_API_KEY...')
    for (const env of environments) {
      try {
        execSync(
          `echo "${apiKey}" | vercel env add AIRTEL_API_KEY ${env}`,
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

    // Add AIRTEL_API_SECRET
    console.log('\n2. Adding AIRTEL_API_SECRET...')
    for (const env of environments) {
      try {
        execSync(
          `echo "${apiSecret}" | vercel env add AIRTEL_API_SECRET ${env}`,
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

    // Add AIRTEL_MERCHANT_CODE
    console.log('\n3. Adding AIRTEL_MERCHANT_CODE...')
    for (const env of environments) {
      try {
        execSync(
          `echo "${merchantCode}" | vercel env add AIRTEL_MERCHANT_CODE ${env}`,
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

    // Add AIRTEL_APPLICATION_NAME
    console.log('\n4. Adding AIRTEL_APPLICATION_NAME...')
    for (const env of environments) {
      try {
        execSync(
          `echo "${applicationName}" | vercel env add AIRTEL_APPLICATION_NAME ${env}`,
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

    // Add AIRTEL_ENVIRONMENT
    console.log('\n5. Adding AIRTEL_ENVIRONMENT...')
    for (const env of environments) {
      try {
        execSync(
          `echo "${environment}" | vercel env add AIRTEL_ENVIRONMENT ${env}`,
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
      console.log('✅ All Airtel credentials added successfully!')
    } else {
      console.log(`⚠️  Setup completed with ${errorCount} errors`)
    }
    
    console.log('\n📝 Next Steps:')
    console.log('   1. Verify: vercel env ls | findstr AIRTEL')
    console.log('   2. Redeploy: vercel --prod')
    console.log('   3. Test payments: /admin/test-payments')
    console.log('   4. Use sandbox test numbers: 256700000001\n')

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
  setupAirtelCredentials()
} catch (error) {
  console.error('❌ Not logged into Vercel!')
  console.error('Please run: vercel login')
  console.error('Then run this script again.')
  process.exit(1)
}

