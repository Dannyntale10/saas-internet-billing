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

  // Create packages
  const packages = [
    { name: '6hours', duration: 6, price: 500, currency: 'UGX' },
    { name: '24hours', duration: 24, price: 1000, currency: 'UGX' },
    { name: 'week', duration: 168, price: 5000, currency: 'UGX' },
    { name: 'month', duration: 720, price: 20000, currency: 'UGX' },
  ]

  for (const pkg of packages) {
    const created = await prisma.package.upsert({
      where: { name: pkg.name },
      update: {},
      create: pkg,
    })
    console.log('Created package:', created.name)

    // Create sample vouchers for each package
    for (let i = 1; i <= 3; i++) {
      const voucherCode = `${created.name.toUpperCase()}-${i.toString().padStart(4, '0')}`
      const voucher = await prisma.voucher.upsert({
        where: { code: voucherCode },
        update: {},
        create: {
          code: voucherCode,
          packageId: created.id,
        },
      })
      console.log('Created/Updated voucher:', voucher.code)
    }
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

