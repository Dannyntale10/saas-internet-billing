'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'

interface Transaction {
  id: string
  amount: number
  currency: string
  status: string
  method: string
  createdAt: string
  user?: { email: string; name: string | null }
  voucher?: { 
    code: string
    name: string | null
    client?: {
      id: string
      name: string
      email: string
    }
  }
}

interface ClientTotal {
  clientId: string
  clientName: string
  clientEmail: string
  totalAmount: number
  completedAmount: number
  pendingAmount: number
  transactionCount: number
  completedCount: number
}

export default function TransactionsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [clientTotals, setClientTotals] = useState<ClientTotal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'all' | 'byClient'>('byClient')

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/login?role=admin')
      return
    }

    fetchTransactions()
  }, [session, status, router])

  const fetchTransactions = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/transactions')

      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login?role=admin')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || data)
        setClientTotals(data.clientTotals || [])
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

  const handleExport = () => {
    const csv = [
      ['ID', 'Amount', 'Currency', 'Status', 'Payment Method', 'User', 'Voucher', 'Date'].join(','),
      ...filteredTransactions.map((t) =>
        [
          t.id,
          t.amount,
          t.currency,
          t.status,
          t.method || 'N/A',
          t.user?.email || 'N/A',
          t.voucher?.code || 'N/A',
          new Date(t.createdAt).toLocaleString(),
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.voucher?.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter
    const matchesDate =
      dateFilter === 'all' ||
      (dateFilter === 'today' &&
        new Date(t.createdAt).toDateString() === new Date().toDateString()) ||
      (dateFilter === 'week' &&
        new Date(t.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (dateFilter === 'month' &&
        new Date(t.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

    return matchesSearch && matchesStatus && matchesDate
  })

  const totalRevenue = filteredTransactions
    .filter((t) => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0)

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
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">Transactions</h1>
            <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
              View and manage all payment transactions
            </p>
          </div>
          <Button 
            onClick={handleExport} 
            variant="outline" 
            className="w-full sm:w-auto border-2 border-green-600 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:border-green-700 dark:hover:border-green-500 transition-all font-bold shadow-lg hover:shadow-xl"
          >
            Export CSV
          </Button>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorDisplay error={error} onRetry={fetchTransactions} />
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6 animate-slide-up">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
              <div className="sm:col-span-2">
                <Input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'all' | 'byClient')}
              >
                <option value="byClient">View by Client</option>
                <option value="all">View All Transactions</option>
              </select>
              <select
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <select
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Total Revenue (filtered): {filteredTransactions.filter((t) => t.status === 'COMPLETED').length} transactions - {filteredTransactions[0]?.currency || 'UGX'} {totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Client Totals View */}
        {viewMode === 'byClient' && (
          <Card className="mb-6 animate-slide-up">
            <CardHeader>
              <CardTitle>Transactions by Client</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center">
                  <LoadingSpinner size="md" text="Loading transactions..." />
                </div>
              ) : clientTotals.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No client transactions found.</p>
              ) : (
                <div className="space-y-4">
                  {clientTotals.map((client) => (
                    <div
                      key={client.clientId}
                      className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {client.clientName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{client.clientEmail}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {filteredTransactions[0]?.currency || 'UGX'} {client.completedAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Completed Revenue</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Transactions</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{client.transactionCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Completed</p>
                          <p className="text-lg font-semibold text-green-600 dark:text-green-400">{client.completedCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Amount</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {filteredTransactions[0]?.currency || 'UGX'} {client.totalAmount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pending</p>
                          <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                            {filteredTransactions[0]?.currency || 'UGX'} {client.pendingAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* All Transactions List */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>
              {viewMode === 'byClient' ? 'All Transactions' : 'All Transactions'} ({filteredTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">
                <LoadingSpinner size="md" text="Loading transactions..." />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No transactions found.</p>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {transaction.currency} {transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {transaction.voucher?.name || transaction.voucher?.code || 'N/A'} • {transaction.user?.email || 'Guest'} • {transaction.method || 'N/A'}
                        {transaction.voucher?.client && (
                          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                            • Client: {transaction.voucher.client.name}
                          </span>
                        )}
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
