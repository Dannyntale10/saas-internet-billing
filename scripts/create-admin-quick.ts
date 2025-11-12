import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@jenda.com'
  const name = 'Admin User'
  const password = 'admin123'

  // Check if user exists
  const existing = await prisma.user.findUnique({
    where: { email }
  })

  if (existing) {
    console.log('Admin user already exists!')
    await prisma.$disconnect()
    return
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
  console.log(`ID: ${admin.id}`)
  console.log(`Email: ${admin.email}`)
  console.log(`Name: ${admin.name}`)
  console.log(`Role: ${admin.role}`)
  console.log(`Password: ${password}`)
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

