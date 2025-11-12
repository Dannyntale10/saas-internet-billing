const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAdmin() {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (admin) {
      console.log('✅ Admin user exists:')
      console.log(`   Email: ${admin.email}`)
      console.log(`   Name: ${admin.name}`)
      console.log(`   Role: ${admin.role}`)
      console.log(`   Created: ${admin.createdAt}`)
    } else {
      console.log('❌ No admin user found')
      console.log('   Run: node scripts/create-admin-quick.js')
    }
  } catch (error) {
    console.error('Error checking admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()

