/**
 * Script to add MTN API credentials to Vercel
 * Run: node scripts/add-mtn-credentials.js
 */

const { execSync } = require('child_process')

// Get credentials from user input or environment
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => readline.question(query, resolve))
}

async function addMTNCredentials() {
  console.log('🔐 MTN API Credentials Setup\n')
  console.log('Please enter your MTN API credentials from the MTN Developer Portal:\n')

  // Get credentials
  const apiKey = await question('MTN Consumer Key (API Key): ')
  const apiSecret = await question('MTN Consumer Secret (API Secret): ')
  const environment = await question('Environment (sandbox/production) [sandbox]: ') || 'sandbox'

  if (!apiKey || !apiSecret) {
    console.error('❌ Error: Both API Key and Secret are required')
    process.exit(1)
  }

  console.log('\n📤 Adding credentials to Vercel...\n')

  const environments = ['production', 'preview', 'development']

  try {
    // Add MTN_API_KEY
    console.log('Adding MTN_API_KEY...')
    for (const env of environments) {
      try {
        execSync(
          `echo "${apiKey}" | vercel env add MTN_API_KEY ${env}`,
          { stdio: 'inherit' }
        )
        console.log(`  ✅ Added to ${env}`)
      } catch (error) {
        console.log(`  ⚠️  ${env}: ${error.message}`)
      }
    }

    // Add MTN_API_SECRET
    console.log('\nAdding MTN_API_SECRET...')
    for (const env of environments) {
      try {
        execSync(
          `echo "${apiSecret}" | vercel env add MTN_API_SECRET ${env}`,
          { stdio: 'inherit' }
        )
        console.log(`  ✅ Added to ${env}`)
      } catch (error) {
        console.log(`  ⚠️  ${env}: ${error.message}`)
      }
    }

    // Add MTN_ENVIRONMENT
    console.log('\nAdding MTN_ENVIRONMENT...')
    for (const env of environments) {
      try {
        execSync(
          `echo "${environment}" | vercel env add MTN_ENVIRONMENT ${env}`,
          { stdio: 'inherit' }
        )
        console.log(`  ✅ Added to ${env}`)
      } catch (error) {
        console.log(`  ⚠️  ${env}: ${error.message}`)
      }
    }

    console.log('\n✅ All MTN credentials added successfully!')
    console.log('\n📝 Next steps:')
    console.log('   1. Redeploy your app: vercel --prod')
    console.log('   2. Test payments at: /admin/test-payments')
    console.log('   3. Use sandbox test numbers for testing')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    readline.close()
  }
}

addMTNCredentials()

