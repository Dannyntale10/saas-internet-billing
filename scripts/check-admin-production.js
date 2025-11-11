const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function checkAdmin() {
  try {
    console.log('Checking admin users in production database...\n')
    
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    })
    
    if (admins.length === 0) {
      console.log('❌ No admin users found!')
      console.log('\nCreate one with:')
      console.log('node scripts/create-admin-production.js email@example.com "Name" password')
      return
    }
    
    console.log(`✅ Found ${admins.length} admin user(s):\n`)
    
    for (const admin of admins) {
      console.log(`Email: ${admin.email}`)
      console.log(`Name: ${admin.name}`)
      console.log(`Role: ${admin.role}`)
      console.log(`Active: ${admin.isActive}`)
      console.log(`Created: ${admin.createdAt}`)
      console.log('---\n')
    }
    
    // Test password for dannyntale10@gmail.com
    const testUser = admins.find(u => u.email === 'dannyntale10@gmail.com')
    if (testUser) {
      console.log('Testing password for dannyntale10@gmail.com...')
      const testPassword = 'Hubolt@83'
      const isValid = await bcrypt.compare(testPassword, testUser.password)
      console.log(`Password test: ${isValid ? '✅ Valid' : '❌ Invalid'}`)
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()

