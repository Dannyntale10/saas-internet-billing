'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { Router, CheckCircle, XCircle } from 'lucide-react'

export default function RouterConfigPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    host: '',
    port: 8728,
    username: '',
    password: '',
    apiPort: 8728,
  })
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/router/config')
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setConfig({
            host: data.config.host || '',
            port: data.config.port || 8728,
            username: data.config.username || '',
            password: '', // Don't show password
            apiPort: data.config.apiPort || 8728,
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
        body: JSON.stringify(config),
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
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Router Configuration</h1>
          <p className="mt-2 text-sm text-gray-600">
            Configure your MikroTik router connection
          </p>
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>MikroTik RouterOS Settings</CardTitle>
                <div className="flex items-center">
                  {isConnected ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm text-green-600">Connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-sm text-red-600">Not Connected</span>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label htmlFor="host" className="block text-sm font-medium text-gray-700">
                    Router IP Address / Hostname *
                  </label>
                  <input
                    type="text"
                    id="host"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    placeholder="192.168.88.1"
                    value={config.host}
                    onChange={(e) => setConfig({ ...config, host: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="port" className="block text-sm font-medium text-gray-700">
                      API Port *
                    </label>
                    <input
                      type="number"
                      id="port"
                      required
                      min="1"
                      max="65535"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                      value={config.port}
                      onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label htmlFor="apiPort" className="block text-sm font-medium text-gray-700">
                      API Port (Alternative)
                    </label>
                    <input
                      type="number"
                      id="apiPort"
                      min="1"
                      max="65535"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                      value={config.apiPort}
                      onChange={(e) => setConfig({ ...config, apiPort: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username *
                  </label>
                  <input
                    type="text"
                    id="username"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    placeholder="admin"
                    value={config.username}
                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    placeholder="Enter router password"
                    value={config.password}
                    onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Password is encrypted and stored securely
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                  >
                    Test Connection
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Router Integration Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-sm text-gray-600 mb-4">
                  To enable router integration, ensure the following:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                  <li>RouterOS API is enabled on your MikroTik router</li>
                  <li>API port (default 8728) is accessible from your server</li>
                  <li>User has API read/write permissions</li>
                  <li>Hotspot is configured on your router</li>
                </ul>
                <p className="text-sm text-gray-500 mt-4">
                  Once configured, vouchers will automatically create users on your router when purchased.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

