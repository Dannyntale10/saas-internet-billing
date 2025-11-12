import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@jenda.com' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    }
  })

  if (!admin) {
    console.log('❌ Admin user not found!')
    console.log('Creating admin user...')
    
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const newAdmin = await prisma.user.create({
      data: {
        email: 'admin@jenda.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true,
      }
    })
    
    console.log('✅ Admin user created!')
    console.log('Email:', newAdmin.email)
    console.log('Role:', newAdmin.role)
    console.log('Password: admin123')
  } else {
    console.log('✅ Admin user found:')
    console.log('ID:', admin.id)
    console.log('Email:', admin.email)
    console.log('Name:', admin.name)
    console.log('Role:', admin.role, admin.role === 'ADMIN' ? '✅' : '❌ WRONG ROLE!')
    console.log('Is Active:', admin.isActive)
    
    if (admin.role !== 'ADMIN') {
      console.log('\n⚠️  Fixing role...')
      await prisma.user.update({
        where: { id: admin.id },
        data: { role: 'ADMIN' }
      })
      console.log('✅ Role fixed to ADMIN')
    }
    
    if (!admin.isActive) {
      console.log('\n⚠️  Activating account...')
      await prisma.user.update({
        where: { id: admin.id },
        data: { isActive: true }
      })
      console.log('✅ Account activated')
    }
  }
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

