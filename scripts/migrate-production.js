// Production migration script
const { execSync } = require('child_process')

console.log('=== Running Production Database Migrations ===\n')

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required!')
  console.error('Set it with: $env:DATABASE_URL="your-connection-string"')
  process.exit(1)
}

try {
  console.log('1. Generating Prisma Client...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  
  console.log('\n2. Running migrations...')
  execSync('npx prisma migrate deploy', { stdio: 'inherit' })
  
  console.log('\n✅ Migrations completed successfully!')
} catch (error) {
  console.error('\n❌ Migration failed:', error.message)
  process.exit(1)
}

