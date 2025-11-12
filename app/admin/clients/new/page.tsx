'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'

export default function NewClient() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  })
  const [createdClient, setCreatedClient] = useState<{ email: string; password: string } | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login?role=admin')
      return
    }

    if (session.user.role !== 'ADMIN') {
      setError('Access denied. Admin privileges required.')
      setTimeout(() => router.push('/auth/login?role=admin'), 2000)
      return
    }
  }, [session, status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password || undefined, // Will use default if not provided
        }),
      })

      const data = await res.json()

      if (res.ok) {
        // Show success message with login credentials
        const clientPassword = formData.password || 'changeme123'
        setCreatedClient({
          email: data.email,
          password: clientPassword,
        })
        // Clear form
        setFormData({ name: '', email: '', phone: '', password: '' })
        // Auto-redirect after 5 seconds
        setTimeout(() => {
          router.push('/admin/clients')
        }, 5000)
      } else {
        console.error('Error creating client:', data)
        setError(data.error || 'Failed to create client')
      }
    } catch (error: any) {
      console.error('Error creating client:', error)
      setError(error.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // STRICT: Only ADMIN users can access admin pages
  const userRole = session?.user?.role ? (session.user.role as string).toUpperCase() : null
  if (!session || userRole !== 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-600">Access denied. Please login as admin.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mobile-padding max-w-3xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">
            Add New Client
          </h1>
          <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
            Create a new client account to manage their internet billing
          </p>
        </div>

        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Pentagon Street WiFi"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="client@example.com"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+256702772200"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password (optional - defaults to "changeme123")
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave empty for default password"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  If not provided, default password will be: changeme123
                </p>
              </div>

              {createdClient && (
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500">
                  <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                    ✅ Client created successfully!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400 mb-2">
                    Login credentials:
                  </p>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border border-green-200 dark:border-green-700">
                    <p className="text-sm font-mono text-gray-900 dark:text-white">
                      <strong>Email:</strong> {createdClient.email}
                    </p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white mt-1">
                      <strong>Password:</strong> {createdClient.password}
                    </p>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    Redirecting to clients list in 5 seconds...
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all border-2 border-green-400"
                >
                  {loading ? 'Creating...' : 'Create Client'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-full sm:w-auto border-2 border-gray-400 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
