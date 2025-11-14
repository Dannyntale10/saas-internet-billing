'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'
import { Router, CheckCircle, XCircle, Server, Wifi } from 'lucide-react'

type RouterType = 'MIKROTIK' | 'FREERADIUS'

export default function RouterConfigPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [routerType, setRouterType] = useState<RouterType>('MIKROTIK')
  const [config, setConfig] = useState({
    host: '',
    port: 8728,
    username: '',
    password: '',
    apiPort: 8728,
    // FreeRADIUS specific
    radiusSecret: '',
    nasId: '',
    apiUrl: typeof window !== 'undefined' ? window.location.origin : '',
  })
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login?role=client')
      return
    }

    // STRICT: Only CLIENT users can access client pages
    const userRole = (session.user.role as string)?.toUpperCase()
    if (userRole !== 'CLIENT') {
      console.error('❌ Access denied: User role', userRole, 'cannot access client pages')
      signOut({ redirect: false, callbackUrl: `/auth/login?role=client` }).then(() => {
        router.push(`/auth/login?role=client&error=access_denied`)
      })
      return
    }

    fetchConfig()
  }, [session, status, router])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/router/config')
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setRouterType((data.config.routerType || 'MIKROTIK') as RouterType)
          setConfig({
            host: data.config.host || '',
            port: data.config.port || 8728,
            username: data.config.username || '',
            password: '', // Don't show password
            apiPort: data.config.apiPort || 8728,
            radiusSecret: data.config.radiusSecret || '',
            nasId: data.config.nasId || '',
            apiUrl: data.config.apiUrl || (typeof window !== 'undefined' ? window.location.origin : ''),
          })
          setIsConnected(data.config.isActive || false)
        }
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/router/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          routerType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save configuration')
      }

      toast.success('Router configuration saved successfully!')
      setIsConnected(true)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      const response = await fetch('/api/router/test', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok && data.connected) {
        toast.success('Router connection successful!')
        setIsConnected(true)
      } else {
        toast.error(data.error || 'Failed to connect to router')
        setIsConnected(false)
      }
    } catch (error) {
      toast.error('Failed to test connection')
      setIsConnected(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading router configuration..." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mobile-padding">
        <div className="mb-6 sm:mb-8">
          <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">Router Configuration</h1>
          <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
            Configure your router gateway connection
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Router Type Selection */}
          <Card className="animate-slide-up mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Select Router Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRouterType('MIKROTIK')}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    routerType === 'MIKROTIK'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Router className={`h-6 w-6 ${routerType === 'MIKROTIK' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                    <h3 className={`font-semibold ${routerType === 'MIKROTIK' ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      MikroTik RouterOS
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Commercial router with built-in hotspot
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRouterType('FREERADIUS')}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    routerType === 'FREERADIUS'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Server className={`h-6 w-6 ${routerType === 'FREERADIUS' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                    <h3 className={`font-semibold ${routerType === 'FREERADIUS' ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      FreeRADIUS + CoovaChilli
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Free, open-source Linux-based solution
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                  {routerType === 'MIKROTIK' ? 'MikroTik RouterOS Settings' : 'FreeRADIUS + CoovaChilli Settings'}
                </CardTitle>
                <div className="flex items-center">
                  {isConnected ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">Connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">Not Connected</span>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                {routerType === 'MIKROTIK' ? (
                  <>
                    <div>
                      <label htmlFor="host" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Router IP Address / Hostname *
                      </label>
                      <Input
                        type="text"
                        id="host"
                        required
                        placeholder="192.168.88.1"
                        value={config.host}
                        onChange={(e) => setConfig({ ...config, host: e.target.value })}
                        className="w-full"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="port" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          API Port *
                        </label>
                        <Input
                          type="number"
                          id="port"
                          required
                          min="1"
                          max="65535"
                          value={config.port}
                          onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 8728 })}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label htmlFor="apiPort" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          API Port (Alternative)
                        </label>
                        <Input
                          type="number"
                          id="apiPort"
                          min="1"
                          max="65535"
                          value={config.apiPort}
                          onChange={(e) => setConfig({ ...config, apiPort: parseInt(e.target.value) || 8728 })}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Username *
                      </label>
                      <Input
                        type="text"
                        id="username"
                        required
                        placeholder="admin"
                        value={config.username}
                        onChange={(e) => setConfig({ ...config, username: e.target.value })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Password *
                      </label>
                      <Input
                        type="password"
                        id="password"
                        required
                        placeholder="Enter router password"
                        value={config.password}
                        onChange={(e) => setConfig({ ...config, password: e.target.value })}
                        className="w-full"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Password is encrypted and stored securely
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <Wifi className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                            Free & Open-Source Solution
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            CoovaChilli handles the captive portal, FreeRADIUS manages authentication, 
                            and your SaaS provides billing logic. Completely free and Linux-based.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="host" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        FreeRADIUS Server IP / Hostname *
                      </label>
                      <Input
                        type="text"
                        id="host"
                        required
                        placeholder="192.168.1.1 or radius.example.com"
                        value={config.host}
                        onChange={(e) => setConfig({ ...config, host: e.target.value })}
                        className="w-full"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        IP address or hostname of your FreeRADIUS server
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="port" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          RADIUS Port *
                        </label>
                        <Input
                          type="number"
                          id="port"
                          required
                          min="1"
                          max="65535"
                          value={config.port}
                          onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 1812 })}
                          className="w-full"
                          placeholder="1812"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Default: 1812 (authentication)
                        </p>
                      </div>

                      <div>
                        <label htmlFor="nasId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          NAS Identifier *
                        </label>
                        <Input
                          type="text"
                          id="nasId"
                          required
                          placeholder="hotspot01"
                          value={config.nasId}
                          onChange={(e) => setConfig({ ...config, nasId: e.target.value })}
                          className="w-full"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Unique identifier for this hotspot
                        </p>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="radiusSecret" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        RADIUS Shared Secret *
                      </label>
                      <Input
                        type="password"
                        id="radiusSecret"
                        required
                        placeholder="testing123"
                        value={config.radiusSecret}
                        onChange={(e) => setConfig({ ...config, radiusSecret: e.target.value })}
                        className="w-full"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Shared secret between FreeRADIUS and CoovaChilli
                      </p>
                    </div>

                    <div>
                      <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        SaaS API URL *
                      </label>
                      <Input
                        type="url"
                        id="apiUrl"
                        required
                        placeholder="https://your-saas.com"
                        value={config.apiUrl}
                        onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                        className="w-full"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Your SaaS API URL for FreeRADIUS to call (e.g., {typeof window !== 'undefined' ? window.location.origin : 'https://your-saas.com'})
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                        API Endpoints
                      </h4>
                      <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                        <p><strong>Authentication:</strong> {config.apiUrl || 'YOUR_API_URL'}/api/radius/authenticate</p>
                        <p><strong>Accounting:</strong> {config.apiUrl || 'YOUR_API_URL'}/api/radius/accounting</p>
                        <p><strong>Authorization:</strong> {config.apiUrl || 'YOUR_API_URL'}/api/radius/authorize</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    className="w-full sm:w-auto border-2 border-blue-600 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-700 dark:hover:border-blue-500 transition-all font-bold shadow-lg hover:shadow-xl"
                  >
                    Test Connection
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all border-2 border-green-400"
                  >
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-6 animate-slide-up">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                {routerType === 'MIKROTIK' ? 'MikroTik Integration Guide' : 'FreeRADIUS + CoovaChilli Setup Guide'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {routerType === 'MIKROTIK' ? (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      To enable MikroTik router integration, ensure the following:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li>RouterOS API is enabled on your MikroTik router</li>
                      <li>API port (default 8728) is accessible from your server</li>
                      <li>User has API read/write permissions</li>
                      <li>Hotspot is configured on your router</li>
                    </ul>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                      Once configured, vouchers will automatically create users on your router when purchased.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <strong>FreeRADIUS + CoovaChilli</strong> is a completely free, open-source solution for Linux servers.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">How It Works:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <li><strong>CoovaChilli</strong> - Handles captive portal and redirects users to login</li>
                          <li><strong>FreeRADIUS</strong> - Manages authentication and accounting</li>
                          <li><strong>Your SaaS</strong> - Provides billing logic and user validation via API</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Setup Steps:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <li>Install CoovaChilli and FreeRADIUS on your Ubuntu server</li>
                          <li>Configure FreeRADIUS to use rlm_rest module</li>
                          <li>Point FreeRADIUS to your SaaS API endpoints</li>
                          <li>Configure CoovaChilli to use FreeRADIUS</li>
                          <li>Set up your Wi-Fi access points</li>
                        </ol>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>📖 Full Setup Guide:</strong> See <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">FREERADIUS_SETUP.md</code> for complete installation and configuration instructions.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

