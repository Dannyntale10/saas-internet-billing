'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'

interface Subscription {
  id: string
  status: string
  billingCycle: string
  startDate: string
  endDate: string | null
  nextBillingDate: string | null
  name: string
  price: number
  currency: string
  user: { id: string; email: string; name: string | null }
}

export default function SubscriptionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/login?role=admin')
      return
    }

    fetchSubscriptions()
  }, [session, status, router, statusFilter])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)

      const res = await fetch(`/api/admin/subscriptions?${params}`)

      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login?role=admin')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setSubscriptions(data)
      } else {
        const errorData = await res.json()
        setError(new Error(errorData.error || 'Failed to fetch subscriptions'))
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch subscriptions')
      setError(error)
      console.error('Error fetching subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/subscriptions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login?role=admin')
        return
      }

      if (res.ok) {
        fetchSubscriptions()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update subscription')
      }
    } catch (error) {
      console.error('Error updating subscription:', error)
      alert('Failed to update subscription')
    }
  }

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading..." />
        </div>
      </DashboardLayout>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <ErrorDisplay error="Access denied. Please login as admin." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mobile-padding">
        <div className="mb-6 sm:mb-8">
          <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">Subscriptions</h1>
          <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
            Manage user subscriptions
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorDisplay error={error} onRetry={fetchSubscriptions} />
          </div>
        )}

        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <Card className="animate-slide-up">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <LoadingSpinner size="md" text="Loading subscriptions..." />
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">No subscriptions found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">User</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Package</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Billing Cycle</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Expires At</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{sub.user.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                          {sub.name} - {sub.currency} {sub.price.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-lg text-xs ${
                            sub.status === 'active' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                            sub.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                            sub.status === 'expired' ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400' :
                            'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{sub.billingCycle}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                          {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-col sm:flex-row gap-2">
                            {sub.status === 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(sub.id, 'cancelled')}
                                className="w-full sm:w-auto border-2 border-red-600 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-700 dark:hover:border-red-500 transition-all font-bold"
                              >
                                Cancel
                              </Button>
                            )}
                            {sub.status === 'cancelled' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(sub.id, 'active')}
                                className="w-full sm:w-auto border-2 border-green-600 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:border-green-700 dark:hover:border-green-500 transition-all font-bold"
                              >
                                Reactivate
                              </Button>
                            )}
                          </div>
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
    </DashboardLayout>
  )
}
