// Create admin user for production database
// Usage: node scripts/create-admin-production.js <email> <name> <password>
// Or set DATABASE_URL environment variable and run without args for interactive mode

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('\n🔐 Create Admin User for Production\n')
  console.log('=' .repeat(50))
  
  // Check database connection
  try {
    await prisma.$connect()
    console.log('✅ Connected to database\n')
  } catch (error) {
    console.error('❌ Database connection failed!')
    console.error('Make sure DATABASE_URL is set in your environment variables')
    console.error('Error:', error.message)
    process.exit(1)
  }

  let email, name, password

  // Check if arguments provided
  if (process.argv.length >= 5) {
    email = process.argv[2]
    name = process.argv[3]
    password = process.argv[4]
    console.log('Using provided credentials...\n')
  } else {
    // Interactive mode
    console.log('Enter admin user details:\n')
    email = await question('Email: ')
    name = await question('Name: ')
    password = await question('Password: ')
    console.log('')
  }

  if (!email || !name || !password) {
    console.error('❌ All fields are required!')
    console.error('\nUsage: node scripts/create-admin-production.js <email> <name> <password>')
    console.error('Example: node scripts/create-admin-production.js admin@example.com "Admin User" mypassword123')
    process.exit(1)
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    console.error('❌ Invalid email format!')
    process.exit(1)
  }

  // Validate password strength
  if (password.length < 6) {
    console.error('❌ Password must be at least 6 characters long!')
    process.exit(1)
  }

  console.log('Creating admin user...\n')

  try {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      console.error(`❌ User with email ${email} already exists!`)
      console.error(`   ID: ${existing.id}`)
      console.error(`   Role: ${existing.role}`)
      console.error('\n💡 You can login with this existing user or use a different email.')
      process.exit(1)
    }

    // Hash password
    console.log('Hashing password...')
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin user
    console.log('Creating user in database...')
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
        isActive: true,
      }
    })

    console.log('\n' + '=' .repeat(50))
    console.log('✅ Admin user created successfully!\n')
    console.log('📋 User Details:')
    console.log(`   ID: ${admin.id}`)
    console.log(`   Email: ${admin.email}`)
    console.log(`   Name: ${admin.name}`)
    console.log(`   Role: ${admin.role}`)
    console.log(`   Created: ${admin.createdAt}`)
    console.log('\n' + '=' .repeat(50))
    console.log('\n🔐 Login Credentials:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log('\n✅ You can now login to your app with these credentials!')
    console.log('\n🌐 Access your app:')
    console.log('   https://saas-internet-billing-pre7sznz3-dannyntale10s-projects.vercel.app/auth/login')
    console.log('')

  } catch (error) {
    console.error('\n❌ Error creating admin user:')
    console.error(error.message)
    if (error.code === 'P2002') {
      console.error('\n💡 This email is already in use. Try a different email.')
    }
    process.exit(1)
  }
}

main()
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    rl.close()
  })

