'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  status: string
  dueDate: string | null
  paidAt: string | null
  createdAt: string
}

export default function ClientInvoices() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
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

    fetchInvoices()
  }, [session, status, router, statusFilter])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)

      const res = await fetch(`/api/client/invoices?${params}`)

      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login?role=client')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setInvoices(data)
      } else {
        const errorData = await res.json()
        setError(new Error(errorData.error || 'Failed to fetch invoices'))
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch invoices')
      setError(error)
      console.error('Error fetching invoices:', error)
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
          <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">Invoices</h1>
          <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
            View and manage your invoices
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorDisplay error={error} onRetry={fetchInvoices} />
          </div>
        )}

        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>All Invoices ({invoices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">
                <LoadingSpinner size="md" text="Loading invoices..." />
              </div>
            ) : invoices.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No invoices found.</p>
            ) : (
              <div className="space-y-2">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white font-medium font-mono">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {invoice.currency} {invoice.amount.toLocaleString()}
                      </p>
                      {invoice.dueDate && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : invoice.status === 'overdue'
                            ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                        }`}
                      >
                        {invoice.status}
                      </span>
                      <a href={`/api/client/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-2 border-blue-600 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-700 dark:hover:border-blue-500 transition-all font-bold"
                        >
                          View PDF
                        </Button>
                      </a>
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
