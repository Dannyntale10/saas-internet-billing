'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CreditCard, CheckCircle, XCircle, Loader, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface TestResult {
  success: boolean
  message: string
  details?: any
  timestamp: string
}

export default function TestPaymentsPage() {
  const { data: session } = useSession()
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [testConfig, setTestConfig] = useState({
    phoneNumber: '256700000000', // MTN sandbox test number
    amount: 1000,
    method: 'MTN_MOBILE_MONEY' as 'MTN_MOBILE_MONEY' | 'AIRTEL_MONEY',
  })

  const testMTNPayment = async () => {
    setTesting(true)
    const testId = `test-${Date.now()}`
    
    try {
      // Test 1: Check API credentials
      const credentialsCheck: TestResult = {
        success: !!process.env.NEXT_PUBLIC_MTN_API_KEY,
        message: process.env.NEXT_PUBLIC_MTN_API_KEY 
          ? 'MTN API credentials found' 
          : 'MTN API credentials missing (check environment variables)',
        timestamp: new Date().toISOString(),
      }
      setResults(prev => [credentialsCheck, ...prev])

      // Test 2: Test payment initiation
      const response = await fetch('/api/payments/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: testConfig.phoneNumber,
          amount: testConfig.amount,
          method: 'MTN_MOBILE_MONEY',
          testMode: true,
        }),
      })

      const data = await response.json()

      const paymentTest: TestResult = {
        success: response.ok,
        message: response.ok 
          ? `Payment request initiated successfully. Transaction ID: ${data.transactionId}` 
          : `Payment failed: ${data.error || 'Unknown error'}`,
        details: data,
        timestamp: new Date().toISOString(),
      }
      setResults(prev => [paymentTest, ...prev])

      if (response.ok && data.transactionId) {
        // Test 3: Check payment status
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
        
        const statusResponse = await fetch(`/api/payments/test-status?transactionId=${data.transactionId}`)
        const statusData = await statusResponse.json()

        const statusTest: TestResult = {
          success: statusResponse.ok,
          message: statusResponse.ok
            ? `Status check successful. Status: ${statusData.status}`
            : `Status check failed: ${statusData.error || 'Unknown error'}`,
          details: statusData,
          timestamp: new Date().toISOString(),
        }
        setResults(prev => [statusTest, ...prev])
      }

      toast.success('MTN payment test completed')
    } catch (error: any) {
      const errorResult: TestResult = {
        success: false,
        message: `Test error: ${error.message}`,
        timestamp: new Date().toISOString(),
      }
      setResults(prev => [errorResult, ...prev])
      toast.error('Test failed')
    } finally {
      setTesting(false)
    }
  }

  const testAirtelPayment = async () => {
    setTesting(true)
    
    try {
      const credentialsCheck: TestResult = {
        success: !!process.env.NEXT_PUBLIC_AIRTEL_API_KEY,
        message: process.env.NEXT_PUBLIC_AIRTEL_API_KEY 
          ? 'Airtel API credentials found' 
          : 'Airtel API credentials missing (check environment variables)',
        timestamp: new Date().toISOString(),
      }
      setResults(prev => [credentialsCheck, ...prev])

      const response = await fetch('/api/payments/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: testConfig.phoneNumber,
          amount: testConfig.amount,
          method: 'AIRTEL_MONEY',
          testMode: true,
        }),
      })

      const data = await response.json()

      const paymentTest: TestResult = {
        success: response.ok,
        message: response.ok 
          ? `Payment request initiated successfully. Transaction ID: ${data.transactionId}` 
          : `Payment failed: ${data.error || 'Unknown error'}`,
        details: data,
        timestamp: new Date().toISOString(),
      }
      setResults(prev => [paymentTest, ...prev])

      toast.success('Airtel payment test completed')
    } catch (error: any) {
      const errorResult: TestResult = {
        success: false,
        message: `Test error: ${error.message}`,
        timestamp: new Date().toISOString(),
      }
      setResults(prev => [errorResult, ...prev])
      toast.error('Test failed')
    } finally {
      setTesting(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment Flow Testing</h1>
          <p className="mt-2 text-sm text-gray-600">
            Test MTN and Airtel mobile money payment flows in sandbox mode
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
          {/* Test Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Sandbox)
                </label>
                <input
                  type="text"
                  value={testConfig.phoneNumber}
                  onChange={(e) => setTestConfig({ ...testConfig, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-green focus:border-brand-green"
                  placeholder="256700000000"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use sandbox test numbers: MTN (256700000000) or Airtel (256700000001)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (UGX)
                </label>
                <input
                  type="number"
                  value={testConfig.amount}
                  onChange={(e) => setTestConfig({ ...testConfig, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-green focus:border-brand-green"
                  min="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={testConfig.method}
                  onChange={(e) => setTestConfig({ ...testConfig, method: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-green focus:border-brand-green"
                >
                  <option value="MTN_MOBILE_MONEY">MTN Mobile Money</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={testMTNPayment}
                  disabled={testing}
                  className="flex-1 bg-brand-green hover:bg-accent"
                >
                  {testing ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Test MTN
                    </>
                  )}
                </Button>
                <Button
                  onClick={testAirtelPayment}
                  disabled={testing}
                  className="flex-1 bg-brand-green hover:bg-accent"
                >
                  {testing ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Test Airtel
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Information */}
          <Card>
            <CardHeader>
              <CardTitle>Test Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Sandbox Testing</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Tests run in sandbox mode (no real money)</li>
                  <li>• Use test phone numbers provided by MTN/Airtel</li>
                  <li>• Check environment variables for API credentials</li>
                  <li>• Payment status may take a few seconds to update</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">Required Environment Variables</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• MTN_API_KEY</li>
                  <li>• MTN_API_SECRET</li>
                  <li>• MTN_ENVIRONMENT=sandbox</li>
                  <li>• AIRTEL_API_KEY</li>
                  <li>• AIRTEL_API_SECRET</li>
                  <li>• AIRTEL_ENVIRONMENT=sandbox</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Test Results</CardTitle>
            {results.length > 0 && (
              <Button
                onClick={clearResults}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Results
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No test results yet. Run a test to see results here.
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`border rounded-md p-4 ${
                      result.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className={`font-medium ${
                          result.success ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {result.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(result.timestamp).toLocaleString()}
                        </p>
                        {result.details && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-600 cursor-pointer">
                              View Details
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

