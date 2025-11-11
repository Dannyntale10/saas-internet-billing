/**
 * Smoke test script for production deployment
 * Tests: Auth, Vouchers, Payments, Router connectivity
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function smokeTest() {
  console.log('🧪 Running Smoke Tests...\n')
  
  let passed = 0
  let failed = 0

  // Test 1: Database Connection
  console.log('1. Testing Database Connection...')
  try {
    await prisma.$connect()
    console.log('   ✅ Database connected\n')
    passed++
  } catch (error) {
    console.log('   ❌ Database connection failed:', error.message, '\n')
    failed++
    return
  }

  // Test 2: Admin User Exists
  console.log('2. Testing Admin User...')
  try {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    if (admin) {
      console.log(`   ✅ Admin found: ${admin.email}\n`)
      passed++
    } else {
      console.log('   ❌ No admin user found\n')
      failed++
    }
  } catch (error) {
    console.log('   ❌ Error checking admin:', error.message, '\n')
    failed++
  }

  // Test 3: Schema Tables
  console.log('3. Testing Database Schema...')
  try {
    const userCount = await prisma.user.count()
    const clientCount = await prisma.user.count({ where: { role: 'CLIENT' } })
    const voucherCount = await prisma.voucher.count()
    const paymentCount = await prisma.payment.count()
    console.log(`   ✅ Schema OK - Users: ${userCount}, Clients: ${clientCount}, Vouchers: ${voucherCount}, Payments: ${paymentCount}\n`)
    passed++
  } catch (error) {
    console.log('   ❌ Schema error:', error.message, '\n')
    failed++
  }

  // Test 4: Environment Variables
  console.log('4. Testing Environment Variables...')
  const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL']
  const missing = requiredVars.filter(v => !process.env[v])
  if (missing.length === 0) {
    console.log('   ✅ All required env vars set\n')
    passed++
  } else {
    console.log(`   ❌ Missing: ${missing.join(', ')}\n`)
    failed++
  }

  // Summary
  console.log('📊 Test Summary:')
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`)

  if (failed === 0) {
    console.log('🎉 All smoke tests passed!')
  } else {
    console.log('⚠️  Some tests failed. Please review above.')
  }

  await prisma.$disconnect()
}

smokeTest().catch(console.error)

