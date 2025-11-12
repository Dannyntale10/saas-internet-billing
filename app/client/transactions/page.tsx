'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'

interface Transaction {
  id: string
  amount: number
  currency: string
  status: string
  method: string
  createdAt: string
  voucher?: { code: string; name: string | null }
}

export default function ClientTransactions() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

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

    fetchTransactions()
  }, [session, status, router, statusFilter])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)

      const res = await fetch(`/api/client/transactions?${params}`)

      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login?role=client')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setTransactions(data)
      } else {
        const errorData = await res.json()
        setError(new Error(errorData.error || 'Failed to fetch transactions'))
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch transactions')
      setError(error)
      console.error('Error fetching transactions:', error)
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
          <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
            View your payment history
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorDisplay error={error} onRetry={fetchTransactions} />
          </div>
        )}

        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>All Transactions ({transactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">
                <LoadingSpinner size="md" text="Loading transactions..." />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No transactions found.</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {transaction.currency} {transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {transaction.voucher?.name || transaction.voucher?.code || 'N/A'} • {transaction.method || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-lg text-xs ${
                        transaction.status === 'COMPLETED'
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : transaction.status === 'PENDING'
                          ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      }`}
                    >
                      {transaction.status}
                    </span>
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
