// Quick admin creation script with command line arguments
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const name = process.argv[3]
  const password = process.argv[4]

  if (!email || !name || !password) {
    console.error('Usage: node scripts/create-admin-quick.js <email> <name> <password>')
    console.error('Example: node scripts/create-admin-quick.js admin@example.com "Admin User" mypassword123')
    process.exit(1)
  }

  console.log('=== Creating Admin User ===\n')

  // Check if user exists
  const existing = await prisma.user.findUnique({
    where: { email }
  })

  if (existing) {
    console.error(`❌ User with email ${email} already exists!`)
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
  console.log('\n✅ You can now login with these credentials!')
}

main()
  .catch((error) => {
    console.error('❌ Error:', error.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

