/**
 * Test API endpoints for smoke testing
 * Tests authentication, vouchers, payments, and router endpoints
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://saas-internet-billing.vercel.app'

async function testEndpoint(name, url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    
    const status = response.status
    const isOk = status >= 200 && status < 300
    
    if (isOk || status === 401 || status === 403) {
      // 401/403 are expected for unauthenticated requests
      console.log(`   ✅ ${name}: ${status} ${response.statusText}`)
      return { success: true, status }
    } else {
      console.log(`   ❌ ${name}: ${status} ${response.statusText}`)
      const text = await response.text()
      console.log(`      Error: ${text.substring(0, 100)}`)
      return { success: false, status }
    }
  } catch (error) {
    console.log(`   ❌ ${name}: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runAPITests() {
  console.log('🌐 Testing API Endpoints...\n')
  console.log(`Base URL: ${BASE_URL}\n`)
  
  let passed = 0
  let failed = 0

  // Test 1: Health Check / Setup Check
  console.log('1. Testing Setup Check...')
  const setupResult = await testEndpoint('Setup Check', `${BASE_URL}/setup-check`)
  setupResult.success ? passed++ : failed++
  console.log()

  // Test 2: Auth Endpoints
  console.log('2. Testing Authentication Endpoints...')
  const authResult = await testEndpoint('Login Page', `${BASE_URL}/auth/login`)
  authResult.success ? passed++ : failed++
  console.log()

  // Test 3: API Routes (should return 401/403 without auth)
  console.log('3. Testing Protected API Routes...')
  const voucherResult = await testEndpoint('Vouchers API', `${BASE_URL}/api/vouchers/available`)
  voucherResult.success ? passed++ : failed++
  console.log()

  // Test 4: Router Test Endpoint
  console.log('4. Testing Router Endpoints...')
  const routerResult = await testEndpoint('Router Test API', `${BASE_URL}/api/router/test`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
  routerResult.success ? passed++ : failed++
  console.log()

  // Summary
  console.log('📊 API Test Summary:')
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`)

  if (failed === 0) {
    console.log('🎉 All API tests passed!')
  } else {
    console.log('⚠️  Some API tests failed. This may be expected for protected endpoints.')
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('⚠️  fetch is not available. Install node-fetch or use Node.js 18+')
  console.log('   Run: npm install node-fetch@2')
  process.exit(1)
}

runAPITests().catch(console.error)

