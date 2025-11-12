import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Generate a unique email with timestamp
  const timestamp = Date.now()
  const email = `admin${timestamp}@jenda.com`
  const name = 'Admin User'
  const password = 'Admin@123' // Strong password

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'ADMIN',
      isActive: true,
    },
  })

  console.log('\n✅ Admin user created successfully!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📧 Email:', admin.email)
  console.log('🔑 Password:', password)
  console.log('👤 Name:', admin.name)
  console.log('🛡️  Role:', admin.role)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n🔗 Login URL: http://localhost:3000/auth/login?role=admin')
  console.log('')
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

