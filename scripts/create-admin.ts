import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('=== Create Admin User ===\n')

  const email = await question('Email: ')
  const name = await question('Name: ')
  const password = await question('Password: ')

  if (!email || !name || !password) {
    console.error('All fields are required!')
    process.exit(1)
  }

  // Check if user exists
  const existing = await prisma.user.findUnique({
    where: { email }
  })

  if (existing) {
    console.error('User with this email already exists!')
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
  console.log(`ID: ${admin.id}`)
  console.log(`Email: ${admin.email}`)
  console.log(`Name: ${admin.name}`)
  console.log(`Role: ${admin.role}`)
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    rl.close()
  })

