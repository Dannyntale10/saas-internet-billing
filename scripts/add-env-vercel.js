// Script to add environment variables to Vercel using the API
const { execSync } = require('child_process')

const envVars = {
  "DATABASE_URL": "postgresql://neondb_owner:npg_HC7I8tAJZYVT@ep-shiny-waterfall-afqei48z-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  "NEXTAUTH_SECRET": "SHeBSeohMTS2PlA8Pe40ibslgVhSEdYHrY5Bc7zHQf4=",
  "NEXTAUTH_URL": "https://saas-internet-billing.vercel.app"
}

console.log('=== Adding Environment Variables to Vercel ===\n')

const environments = ['production', 'preview', 'development']

for (const [key, value] of Object.entries(envVars)) {
  console.log(`Adding ${key}...`)
  
  for (const env of environments) {
    try {
      // Use vercel env add with proper input
      const command = `(echo "${value}") | vercel env add ${key} ${env} --force`
      execSync(command, { 
        stdio: 'inherit',
        shell: true
      })
      console.log(`  ✓ Added to ${env}`)
    } catch (error) {
      // Try without force flag
      try {
        const command = `(echo "${value}") | vercel env add ${key} ${env}`
        execSync(command, { 
          stdio: 'inherit',
          shell: true
        })
        console.log(`  ✓ Added to ${env}`)
      } catch (error2) {
        console.log(`  ⚠ ${env}: ${error2.message.includes('already') ? 'Already exists' : 'Error - may need manual update'}`)
      }
    }
  }
  console.log(`✓ ${key} completed\n`)
}

console.log('\n✅ Environment variables setup complete!')
console.log('\nNext: Go to Vercel Dashboard → Deployments → Redeploy')

