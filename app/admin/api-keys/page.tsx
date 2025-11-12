'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'

interface ApiKey {
  id: string
  name: string
  key: string
  secret: string
  permissions: string | null
  isActive: boolean
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
  user: { id: string; email: string; name: string | null }
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    permissions: '',
    expiresAt: '',
    isActive: true,
  })
  const [newKey, setNewKey] = useState<{ key: string; secret: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }
    fetchApiKeys()
  }, [router])

  const fetchApiKeys = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/api-keys', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setApiKeys(data)
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          permissions: formData.permissions ? JSON.parse(formData.permissions) : null,
          expiresAt: formData.expiresAt || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setNewKey({ key: data.key, secret: data.secret })
        setShowForm(false)
        setFormData({
          userId: '',
          name: '',
          permissions: '',
          expiresAt: '',
          isActive: true,
        })
        fetchApiKeys()
      }
    } catch (error) {
      console.error('Error creating API key:', error)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (res.ok) {
        fetchApiKeys()
      }
    } catch (error) {
      console.error('Error updating API key:', error)
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">API Keys</h1>
            <p className="text-gray-400">Manage API keys for integrations</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'Create Key'}
            </Button>
            <Link href="/admin/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {newKey && (
          <Card className="mb-6 bg-yellow-500/20 border-yellow-500/50">
            <CardContent className="p-6">
              <h3 className="text-yellow-400 font-bold mb-4">New API Key Created!</h3>
              <p className="text-gray-300 mb-2">Save these credentials - they won't be shown again:</p>
              <div className="space-y-2">
                <div>
                  <label className="text-sm text-gray-400">Key:</label>
                  <p className="font-mono text-white bg-brand-dark p-2 rounded">{newKey.key}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Secret:</label>
                  <p className="font-mono text-white bg-brand-dark p-2 rounded">{newKey.secret}</p>
                </div>
              </div>
              <Button onClick={() => setNewKey(null)} className="mt-4">Close</Button>
            </CardContent>
          </Card>
        )}

        {showForm && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">User ID</label>
                  <Input
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    placeholder="User ID"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="API Key Name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Permissions (JSON)</label>
                  <Input
                    value={formData.permissions}
                    onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                    placeholder='{"read": true, "write": false}'
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Expires At (Optional)</label>
                  <Input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full sm:w-auto">Create Key</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : apiKeys.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No API keys found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-brand-light">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">User</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Key</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Last Used</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {apiKeys.map((key) => (
                      <tr key={key.id} className="hover:bg-brand-light/50">
                        <td className="px-4 py-3 text-sm text-gray-300">{key.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{key.user.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-300 font-mono text-xs">{key.key}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-button text-xs ${
                            key.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {key.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(key.id, key.isActive)}
                            className="w-full sm:w-auto"
                          >
                            {key.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

