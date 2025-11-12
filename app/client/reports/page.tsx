'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { Activity, Download, TrendingUp, Users, Ticket, DollarSign } from 'lucide-react'

interface ReportData {
  revenue?: Array<{ date: string; amount: number }>
  vouchers?: Array<{ code: string; name: string; status: string; createdAt: string }>
  transactions?: Array<{ id: string; amount: number; status: string; createdAt: string }>
  stats?: {
    totalRevenue: number
    totalVouchers: number
    activeVouchers: number
    totalTransactions: number
  }
}

export default function ClientReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [reportType, setReportType] = useState<'revenue' | 'vouchers' | 'transactions'>('revenue')

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

    fetchReports()
  }, [session, status, router])

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch data from multiple endpoints
      const [vouchersRes, transactionsRes, dashboardRes] = await Promise.all([
        fetch('/api/client/vouchers'),
        fetch('/api/client/transactions'),
        fetch('/api/client/dashboard'),
      ])

      if (!vouchersRes.ok || !transactionsRes.ok || !dashboardRes.ok) {
        throw new Error('Failed to fetch report data')
      }

      const [vouchersData, transactionsData, dashboardData] = await Promise.all([
        vouchersRes.json(),
        transactionsRes.json(),
        dashboardRes.json(),
      ])

      // Transform transactions data to match expected format
      const formattedTransactions = Array.isArray(transactionsData) 
        ? transactionsData.map((t: any) => ({
            id: t.id,
            amount: t.amount,
            status: t.status,
            method: t.method || 'N/A',
            createdAt: t.createdAt,
          }))
        : []

      // Process revenue data from transactions
      const revenue = formattedTransactions
        .filter((t: any) => t.status === 'COMPLETED')
        .map((t: any) => ({
          date: new Date(t.createdAt).toISOString().split('T')[0],
          amount: t.amount,
        }))
        .reduce((acc: any, curr: any) => {
          const existing = acc.find((item: any) => item.date === curr.date)
          if (existing) {
            existing.amount += curr.amount
          } else {
            acc.push(curr)
          }
          return acc
        }, [])
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setReportData({
        revenue,
        vouchers: vouchersData.all || vouchersData,
        transactions: formattedTransactions,
        stats: {
          totalRevenue: dashboardData.stats?.totalRevenue || 0,
          totalVouchers: (vouchersData.all || vouchersData).length,
          activeVouchers: (vouchersData.all || vouchersData).filter((v: any) => v.status === 'ACTIVE').length,
          totalTransactions: formattedTransactions.length,
        },
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load reports')
      setError(error)
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = (type: 'revenue' | 'vouchers' | 'transactions') => {
    if (!reportData) return

    let csv: string[] = []
    let filename = ''

    if (type === 'revenue' && reportData.revenue) {
      csv = [
        ['Date', 'Revenue (UGX)'].join(','),
        ...reportData.revenue.map((r) => [r.date, r.amount].join(',')),
      ]
      filename = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`
    } else if (type === 'vouchers' && reportData.vouchers) {
      csv = [
        ['Code', 'Name', 'Status', 'Price', 'Created'].join(','),
        ...reportData.vouchers.map((v) =>
          [
            v.code,
            v.name || 'N/A',
            v.status,
            v.price || 0,
            new Date(v.createdAt).toLocaleDateString(),
          ].join(',')
        ),
      ]
      filename = `vouchers-report-${new Date().toISOString().split('T')[0]}.csv`
    } else if (type === 'transactions' && reportData.transactions) {
      csv = [
        ['ID', 'Amount', 'Status', 'Method', 'Date'].join(','),
        ...reportData.transactions.map((t) =>
          [
            t.id,
            t.amount,
            t.status,
            t.method || 'N/A',
            new Date(t.createdAt).toLocaleString(),
          ].join(',')
        ),
      ]
      filename = `transactions-report-${new Date().toISOString().split('T')[0]}.csv`
    }

    const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading reports..." />
        </div>
      </DashboardLayout>
    )
  }

  if (!session || session.user.role !== 'CLIENT') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <ErrorDisplay error="Access denied. Please login as client." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mobile-padding">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">Reports</h1>
            <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
              View and export your business reports
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorDisplay error={error} onRetry={fetchReports} />
          </div>
        )}

        {/* Stats Cards */}
        {reportData?.stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            <Card className="animate-scale-in">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      UGX {reportData.stats.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="animate-scale-in">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Vouchers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {reportData.stats.totalVouchers}
                    </p>
                  </div>
                  <Ticket className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="animate-scale-in">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Vouchers</p>
                    <p className="text-2xl font-bold text-green-600">
                      {reportData.stats.activeVouchers}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="animate-scale-in">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transactions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {reportData.stats.totalTransactions}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Report Type Selector */}
        <Card className="mb-6 animate-slide-up">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => setReportType('revenue')}
                  className={reportType === 'revenue' ? 'bg-green-600 text-white' : ''}
                >
                  Revenue Report
                </Button>
                <Button
                  onClick={() => setReportType('vouchers')}
                  className={reportType === 'vouchers' ? 'bg-green-600 text-white' : ''}
                >
                  Vouchers Report
                </Button>
                <Button
                  onClick={() => setReportType('transactions')}
                  className={reportType === 'transactions' ? 'bg-green-600 text-white' : ''}
                >
                  Transactions Report
                </Button>
              </div>
              <Button
                onClick={() => handleExport(reportType)}
                variant="outline"
                className="border-2 border-green-600 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
              >
                <Download className="h-4 w-4 mr-2" />
                Export {reportType === 'revenue' && 'Revenue'}
                {reportType === 'vouchers' && 'Vouchers'}
                {reportType === 'transactions' && 'Transactions'} CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>
              {reportType === 'revenue' && 'Revenue Report'}
              {reportType === 'vouchers' && 'Vouchers Report'}
              {reportType === 'transactions' && 'Transactions Report'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportType === 'revenue' && reportData?.revenue && (
              <div className="space-y-2">
                {reportData.revenue.length > 0 ? (
                  reportData.revenue.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <p className="text-gray-900 dark:text-white font-medium">
                        {new Date(item.date).toLocaleDateString()}
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        UGX {item.amount.toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No revenue data available
                  </p>
                )}
              </div>
            )}

            {reportType === 'vouchers' && reportData?.vouchers && (
              <div className="space-y-2">
                {reportData.vouchers.length > 0 ? (
                  reportData.vouchers.map((voucher, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium font-mono">
                          {voucher.code}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {voucher.name || 'N/A'}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          voucher.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {voucher.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No vouchers found
                  </p>
                )}
              </div>
            )}

            {reportType === 'transactions' && reportData?.transactions && (
              <div className="space-y-2">
                {reportData.transactions.length > 0 ? (
                  reportData.transactions.map((transaction, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">
                          UGX {transaction.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          transaction.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No transactions found
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

