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

interface ReportData {
  clients?: Array<{ name: string; totalTransactions: number; totalRevenue: number }>
  packages?: Array<{ name: string; count: number; revenue: number }>
  transactions?: Array<{ date: string; count: number; revenue: number }>
  vouchers?: Array<{ code: string; name: string; status: string; createdAt: string }>
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [reportType, setReportType] = useState<'revenue' | 'clients' | 'packages' | 'vouchers'>('revenue')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [reportData, setReportData] = useState<ReportData | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/login?role=admin')
      return
    }
  }, [session, status, router])

  const generateReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.append('from', dateFrom)
      if (dateTo) params.append('to', dateTo)
      params.append('type', reportType)

      const res = await fetch(`/api/admin/reports?${params.toString()}`)

      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login?role=admin')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setReportData(data)
      } else {
        const errorData = await res.json()
        setError(new Error(errorData.error || 'Failed to generate report'))
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate report')
      setError(error)
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = (type: string) => {
    if (!reportData) return

    let csv = ''
    let filename = ''

    if (type === 'revenue' && reportData.transactions) {
      csv = [
        ['Date', 'Transactions', 'Revenue'].join(','),
        ...reportData.transactions.map((t) => [t.date, t.count, t.revenue].join(',')),
      ].join('\n')
      filename = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`
    } else if (type === 'clients' && reportData.clients) {
      csv = [
        ['Client', 'Transactions', 'Revenue'].join(','),
        ...reportData.clients.map((c) => [c.name, c.totalTransactions, c.totalRevenue].join(',')),
      ].join('\n')
      filename = `clients-report-${new Date().toISOString().split('T')[0]}.csv`
    } else if (type === 'packages' && reportData.packages) {
      csv = [
        ['Package', 'Sales', 'Revenue'].join(','),
        ...reportData.packages.map((p) => [p.name, p.count, p.revenue].join(',')),
      ].join('\n')
      filename = `packages-report-${new Date().toISOString().split('T')[0]}.csv`
    } else if (type === 'vouchers' && reportData.vouchers) {
      csv = [
        ['Code', 'Package', 'Status', 'Created At'].join(','),
        ...reportData.vouchers.map((v) =>
          [v.code, v.name || 'N/A', v.status, v.createdAt].join(',')
        ),
      ].join('\n')
      filename = `vouchers-report-${new Date().toISOString().split('T')[0]}.csv`
    }

    if (csv) {
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
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
          <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
            Generate and export system reports
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorDisplay error={error} onRetry={generateReport} />
          </div>
        )}

        {/* Report Generator */}
        <Card className="mb-6 animate-slide-up">
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Type
                </label>
                <select
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                >
                  <option value="revenue">Revenue Report</option>
                  <option value="clients">Clients Report</option>
                  <option value="packages">Packages Report</option>
                  <option value="vouchers">Vouchers Report</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    To Date
                  </label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={generateReport} 
                disabled={loading} 
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all border-2 border-green-400"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Results */}
        {reportData && (
          <Card className="animate-slide-up">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle>
                  {reportType === 'revenue' && 'Revenue Report'}
                  {reportType === 'clients' && 'Clients Report'}
                  {reportType === 'packages' && 'Packages Report'}
                  {reportType === 'vouchers' && 'Vouchers Report'}
                </CardTitle>
                <Button 
                  onClick={() => handleExport(reportType)} 
                  variant="outline"
                  className="border-2 border-green-600 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:border-green-700 dark:hover:border-green-500 transition-all font-bold shadow-lg hover:shadow-xl"
                >
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {reportType === 'revenue' && reportData.transactions && (
                <div className="space-y-2">
                  {reportData.transactions.map((t, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                    >
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">{t.date}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t.count} transactions</p>
                      </div>
                      <p className="text-gray-900 dark:text-white font-bold">UGX {t.revenue.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {reportType === 'clients' && reportData.clients && (
                <div className="space-y-2">
                  {reportData.clients.map((c, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                    >
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">{c.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{c.totalTransactions} transactions</p>
                      </div>
                      <p className="text-gray-900 dark:text-white font-bold">UGX {c.totalRevenue.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {reportType === 'packages' && reportData.packages && (
                <div className="space-y-2">
                  {reportData.packages.map((p, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                    >
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">{p.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{p.count} sales</p>
                      </div>
                      <p className="text-gray-900 dark:text-white font-bold">UGX {p.revenue.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {reportType === 'vouchers' && reportData.vouchers && (
                <div className="space-y-2">
                  {reportData.vouchers.map((v, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                    >
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium font-mono">{v.code}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{v.name || 'N/A'} • {v.status}</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{new Date(v.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
