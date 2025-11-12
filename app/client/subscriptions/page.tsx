'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
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
}

export default function ClientSubscriptions() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

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

    fetchSubscriptions()
  }, [session, status, router])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/client/subscriptions')

      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login?role=client')
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

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading..." />
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <ErrorDisplay error="Please login to continue." />
        </div>
      </DashboardLayout>
    )
  }

  // STRICT: Only CLIENT users can access client pages
  const userRole = (session.user.role as string)?.toUpperCase()
  if (userRole !== 'CLIENT') {
    signOut({ redirect: false, callbackUrl: `/auth/login?role=client` }).then(() => {
      router.push(`/auth/login?role=client&error=access_denied`)
    })
    return null
  }

  return (
    <DashboardLayout>
      <div className="mobile-padding">
        <div className="mb-6 sm:mb-8">
          <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">Subscriptions</h1>
          <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
            Manage your active subscriptions
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorDisplay error={error} onRetry={fetchSubscriptions} />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <LoadingSpinner size="md" text="Loading subscriptions..." />
          </div>
        ) : subscriptions.length === 0 ? (
          <Card className="animate-slide-up">
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No subscriptions found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You don't have any active subscriptions yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id} className="animate-scale-in">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{subscription.name}</CardTitle>
                    <span className={`px-2 py-1 rounded-lg text-xs ${
                      subscription.status === 'active' 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                    }`}>
                      {subscription.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {subscription.currency} {subscription.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Billing: {subscription.billingCycle}
                    </p>
                    {subscription.endDate && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Expires: {new Date(subscription.endDate).toLocaleDateString()}
                      </p>
                    )}
                    {subscription.nextBillingDate && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Next billing: {new Date(subscription.nextBillingDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
