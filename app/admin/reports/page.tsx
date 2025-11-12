'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/ui/logo'

interface ReportData {
  clients: Array<{ name: string; totalTransactions: number; totalRevenue: number }>
  packages: Array<{ name: string; count: number; revenue: number }>
  transactions: Array<{ date: string; count: number; revenue: number }>
  vouchers: Array<{ code: string; package: string; status: string; createdAt: string }>
}

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState<'revenue' | 'clients' | 'packages' | 'vouchers'>('revenue')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [reportData, setReportData] = useState<ReportData | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }
  }, [router])

  const generateReport = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const params = new URLSearchParams()
      if (dateFrom) params.append('from', dateFrom)
      if (dateTo) params.append('to', dateTo)
      params.append('type', reportType)

      const res = await fetch(`/api/admin/reports?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (res.status === 401) {
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setReportData(data)
      } else {
        alert('Failed to generate report')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('An error occurred. Please try again.')
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
          [v.code, v.package, v.status, v.createdAt].join(',')
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

  return (
    <div className="min-h-screen bg-brand-dark p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Logo />
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-4">Reports</h1>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="outline" className="w-full sm:w-auto">Back to Dashboard</Button>
          </Link>
        </div>

        {/* Report Generator */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Report Type
                </label>
                <select
                  className="flex h-10 w-full rounded-button border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent"
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    To Date
                  </label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={generateReport} disabled={loading} className="w-full sm:w-auto">
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Results */}
        {reportData && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle>
                  {reportType === 'revenue' && 'Revenue Report'}
                  {reportType === 'clients' && 'Clients Report'}
                  {reportType === 'packages' && 'Packages Report'}
                  {reportType === 'vouchers' && 'Vouchers Report'}
                </CardTitle>
                <Button onClick={() => handleExport(reportType)} variant="outline">
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
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-background-light p-4 rounded-button"
                    >
                      <div>
                        <p className="text-white font-medium">{t.date}</p>
                        <p className="text-sm text-gray-400">{t.count} transactions</p>
                      </div>
                      <p className="text-white font-bold">UGX {t.revenue.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {reportType === 'clients' && reportData.clients && (
                <div className="space-y-2">
                  {reportData.clients.map((c, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-background-light p-4 rounded-button"
                    >
                      <div>
                        <p className="text-white font-medium">{c.name}</p>
                        <p className="text-sm text-gray-400">{c.totalTransactions} transactions</p>
                      </div>
                      <p className="text-white font-bold">UGX {c.totalRevenue.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {reportType === 'packages' && reportData.packages && (
                <div className="space-y-2">
                  {reportData.packages.map((p, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-background-light p-4 rounded-button"
                    >
                      <div>
                        <p className="text-white font-medium">{p.name}</p>
                        <p className="text-sm text-gray-400">{p.count} sales</p>
                      </div>
                      <p className="text-white font-bold">UGX {p.revenue.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {reportType === 'vouchers' && reportData.vouchers && (
                <div className="space-y-2">
                  {reportData.vouchers.map((v, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-background-light p-4 rounded-button"
                    >
                      <div>
                        <p className="text-white font-medium font-mono">{v.code}</p>
                        <p className="text-sm text-gray-400">{v.package} • {v.status}</p>
                      </div>
                      <p className="text-xs text-gray-500">{v.createdAt}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

