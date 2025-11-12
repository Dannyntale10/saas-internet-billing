import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@jenda.com' },
    update: {},
    create: {
      email: 'admin@jenda.com',
      password: await hashPassword('admin123'),
      name: 'Admin User',
      role: 'admin',
    },
  })

  console.log('Created admin user:', admin.email)

  // Package model not in schema - packages are managed via vouchers
  // Create sample vouchers directly
  const voucherData = [
    { code: '6HOURS-0001', name: '6 Hours', price: 500, timeLimit: 6, clientId: admin.id },
    { code: '24HOURS-0001', name: '24 Hours', price: 1000, timeLimit: 24, clientId: admin.id },
    { code: 'WEEK-0001', name: '1 Week', price: 5000, timeLimit: 168, clientId: admin.id },
    { code: 'MONTH-0001', name: '1 Month', price: 20000, timeLimit: 720, clientId: admin.id },
  ]

  for (const v of voucherData) {
    const voucher = await prisma.voucher.upsert({
      where: { code: v.code },
      update: {},
      create: v,
    })
    console.log('Created/Updated voucher:', voucher.code)
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

