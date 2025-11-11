// Production deployment helper script
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const readline = require('readline')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('=== Production Database Setup ===\n')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✓' : 'NOT SET ✗')
  
  if (!process.env.DATABASE_URL) {
    console.error('\n❌ DATABASE_URL environment variable is required!')
    console.error('Set it with: $env:DATABASE_URL="your-connection-string"')
    process.exit(1)
  }

  console.log('\n1. Testing database connection...')
  try {
    await prisma.$connect()
    console.log('✅ Database connection successful!\n')
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    process.exit(1)
  }

  console.log('2. Checking for admin user...')
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists!')
    const overwrite = await question('Create new admin anyway? (y/n): ')
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Skipping admin creation.')
      process.exit(0)
    }
  }

  console.log('\n3. Creating admin user...')
  const email = await question('Email: ')
  const name = await question('Name: ')
  const password = await question('Password: ')

  if (!email || !name || !password) {
    console.error('❌ All fields are required!')
    process.exit(1)
  }

  // Check if user exists
  const existing = await prisma.user.findUnique({
    where: { email }
  })

  if (existing) {
    console.error('❌ User with this email already exists!')
    process.exit(1)
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'ADMIN',
    }
  })

  console.log('\n✅ Admin user created successfully!')
  console.log(`   ID: ${admin.id}`)
  console.log(`   Email: ${admin.email}`)
  console.log(`   Name: ${admin.name}`)
  console.log(`   Role: ${admin.role}`)
  console.log('\n✅ Production setup complete!')
}

main()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    rl.close()
  })

