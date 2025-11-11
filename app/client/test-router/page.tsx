'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Router, CheckCircle, XCircle, Loader, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface RouterTestResult {
  success: boolean
  message: string
  details?: any
  timestamp: string
}

interface RouterConfig {
  host: string
  port: number
  username: string
  password: string
}

export default function TestRouterPage() {
  const { data: session } = useSession()
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<RouterTestResult[]>([])
  const [routerConfig, setRouterConfig] = useState<RouterConfig>({
    host: '',
    port: 8728,
    username: '',
    password: '',
  })
  const [savedConfig, setSavedConfig] = useState<RouterConfig | null>(null)

  useEffect(() => {
    // Load saved router config
    fetchRouterConfig()
  }, [])

  const fetchRouterConfig = async () => {
    try {
      const response = await fetch('/api/router/config')
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setSavedConfig(data.config)
          setRouterConfig({
            host: data.config.host || '',
            port: data.config.port || 8728,
            username: data.config.username || '',
            password: '', // Don't load password
          })
        }
      }
    } catch (error) {
      console.error('Error fetching router config:', error)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    
    try {
      const response = await fetch('/api/router/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: routerConfig.host,
          port: routerConfig.port,
          username: routerConfig.username,
          password: routerConfig.password,
        }),
      })

      const data = await response.json()

      const result: RouterTestResult = {
        success: response.ok && data.connected,
        message: data.connected
          ? `Successfully connected to router at ${routerConfig.host}:${routerConfig.port}`
          : `Connection failed: ${data.error || data.message || 'Unknown error'}`,
        details: data,
        timestamp: new Date().toISOString(),
      }

      setResults(prev => [result, ...prev])

      if (result.success) {
        toast.success('Router connection successful!')
      } else {
        toast.error('Router connection failed')
      }
    } catch (error: any) {
      const errorResult: RouterTestResult = {
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

  const testWithSavedConfig = async () => {
    if (!savedConfig) {
      toast.error('No saved router configuration found')
      return
    }

    setTesting(true)
    
    try {
      const response = await fetch('/api/router/test', {
        method: 'POST',
      })

      const data = await response.json()

      const result: RouterTestResult = {
        success: response.ok && data.connected,
        message: data.connected
          ? `Successfully connected to saved router configuration`
          : `Connection failed: ${data.error || data.message || 'Unknown error'}`,
        details: data,
        timestamp: new Date().toISOString(),
      }

      setResults(prev => [result, ...prev])

      if (result.success) {
        toast.success('Router connection successful!')
      } else {
        toast.error('Router connection failed')
      }
    } catch (error: any) {
      const errorResult: RouterTestResult = {
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

  const testRouterFeatures = async () => {
    if (!savedConfig) {
      toast.error('Please configure and save router settings first')
      return
    }

    setTesting(true)
    const tests: RouterTestResult[] = []

    try {
      // Test 1: System Resources
      try {
        const resourcesResponse = await fetch('/api/router/resources')
        const resourcesData = await resourcesResponse.json()
        tests.push({
          success: resourcesResponse.ok,
          message: resourcesResponse.ok
            ? 'System resources retrieved successfully'
            : 'Failed to get system resources',
          details: resourcesData,
          timestamp: new Date().toISOString(),
        })
      } catch (error: any) {
        tests.push({
          success: false,
          message: `System resources test failed: ${error.message}`,
          timestamp: new Date().toISOString(),
        })
      }

      // Test 2: Hotspot Users (if applicable)
      try {
        const usersResponse = await fetch('/api/router/users')
        const usersData = await usersResponse.json()
        tests.push({
          success: usersResponse.ok,
          message: usersResponse.ok
            ? `Hotspot users retrieved: ${usersData.users?.length || 0} found`
            : 'Failed to get hotspot users',
          details: usersData,
          timestamp: new Date().toISOString(),
        })
      } catch (error: any) {
        tests.push({
          success: false,
          message: `Hotspot users test failed: ${error.message}`,
          timestamp: new Date().toISOString(),
        })
      }

      setResults(prev => [...tests, ...prev])
      toast.success('Router feature tests completed')
    } catch (error: any) {
      toast.error('Feature tests failed')
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
          <h1 className="text-3xl font-bold text-gray-900">Router Connectivity Testing</h1>
          <p className="mt-2 text-sm text-gray-600">
            Test MikroTik RouterOS connection and features
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
          {/* Router Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Router Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {savedConfig && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Saved Config:</strong> {savedConfig.host}:{savedConfig.port}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Router IP/Hostname
                </label>
                <input
                  type="text"
                  value={routerConfig.host}
                  onChange={(e) => setRouterConfig({ ...routerConfig, host: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-green focus:border-brand-green"
                  placeholder="192.168.1.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port
                </label>
                <input
                  type="number"
                  value={routerConfig.port}
                  onChange={(e) => setRouterConfig({ ...routerConfig, port: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-green focus:border-brand-green"
                  placeholder="8728"
                />
                <p className="mt-1 text-xs text-gray-500">Default: 8728 (API) or 8729 (SSL)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={routerConfig.username}
                  onChange={(e) => setRouterConfig({ ...routerConfig, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-green focus:border-brand-green"
                  placeholder="admin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={routerConfig.password}
                  onChange={(e) => setRouterConfig({ ...routerConfig, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-green focus:border-brand-green"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={testConnection}
                  disabled={testing || !routerConfig.host || !routerConfig.username}
                  className="flex-1 bg-brand-green hover:bg-accent"
                >
                  {testing ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Wifi className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
                {savedConfig && (
                  <Button
                    onClick={testWithSavedConfig}
                    disabled={testing}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test Saved
                  </Button>
                )}
              </div>

              <Button
                onClick={testRouterFeatures}
                disabled={testing || !savedConfig}
                variant="outline"
                className="w-full"
              >
                <Router className="h-4 w-4 mr-2" />
                Test Router Features
              </Button>
            </CardContent>
          </Card>

          {/* Test Information */}
          <Card>
            <CardHeader>
              <CardTitle>Test Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Router Requirements</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• MikroTik RouterOS with API enabled</li>
                  <li>• API port open (default: 8728)</li>
                  <li>• Valid username and password</li>
                  <li>• Router accessible from server network</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">Security Notes</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Use secure connection (SSL port 8729) in production</li>
                  <li>• Restrict API access to specific IPs</li>
                  <li>• Use strong passwords</li>
                  <li>• Enable firewall rules</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="font-semibold text-green-900 mb-2">Testing Features</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>✓ Connection test</li>
                  <li>✓ System resources</li>
                  <li>✓ Hotspot user management</li>
                  <li>✓ User profile creation</li>
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

