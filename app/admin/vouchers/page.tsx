'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'

interface Voucher {
  id: string
  code: string
  name?: string
  status: string
  createdAt: string
  price: number
  currency: string
  client?: { name: string }
}

export default function VouchersPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Bulk generation form
  const [bulkForm, setBulkForm] = useState({
    name: '',
    price: '',
    currency: 'UGX',
    dataLimit: '',
    timeLimit: '',
    speedLimit: '',
    count: '10',
    prefix: '',
    expiresAt: '',
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/login?role=admin')
      return
    }

    fetchVouchers()
  }, [session, status, router])

  const fetchVouchers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/vouchers')

      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login?role=admin')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setVouchers(data)
      } else {
        const errorData = await res.json()
        setError(new Error(errorData.error || 'Failed to fetch vouchers'))
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch vouchers')
      setError(error)
      console.error('Error fetching vouchers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/vouchers/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: bulkForm.name || undefined,
          price: parseFloat(bulkForm.price) || 0,
          currency: bulkForm.currency,
          dataLimit: bulkForm.dataLimit ? parseFloat(bulkForm.dataLimit) : undefined,
          timeLimit: bulkForm.timeLimit ? parseInt(bulkForm.timeLimit) : undefined,
          speedLimit: bulkForm.speedLimit ? parseInt(bulkForm.speedLimit) : undefined,
          count: parseInt(bulkForm.count),
          prefix: bulkForm.prefix || undefined,
          expiresAt: bulkForm.expiresAt || undefined,
        }),
      })

      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login?role=admin')
        return
      }

      if (res.ok) {
        setBulkForm({ name: '', price: '', currency: 'UGX', dataLimit: '', timeLimit: '', speedLimit: '', count: '10', prefix: '', expiresAt: '' })
        fetchVouchers()
        alert('Vouchers generated successfully!')
      } else {
        const data = await res.json()
        setError(new Error(data.error || 'Failed to generate vouchers'))
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate vouchers')
      setError(error)
      console.error('Error generating vouchers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    const csv = [
      ['Code', 'Name', 'Price', 'Currency', 'Status', 'Client', 'Created At'].join(','),
      ...filteredVouchers.map((v) =>
        [
          v.code,
          v.name || 'N/A',
          v.price,
          v.currency,
          v.status,
          v.client?.name || 'N/A',
          new Date(v.createdAt).toLocaleString(),
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vouchers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch = v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.name && v.name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'USED' && v.status === 'USED') ||
      (statusFilter === 'ACTIVE' && v.status === 'ACTIVE') ||
      (statusFilter === 'EXPIRED' && v.status === 'EXPIRED')
    return matchesSearch && matchesStatus
  })

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
            <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">Voucher Management</h1>
            <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
              Create and manage vouchers for your clients
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              onClick={handleExport} 
              variant="outline" 
              className="w-full sm:w-auto border-2 border-green-600 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:border-green-700 dark:hover:border-green-500 transition-all font-bold shadow-lg hover:shadow-xl"
            >
              Export CSV
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorDisplay error={error} onRetry={fetchVouchers} />
          </div>
        )}

        {/* Bulk Generation */}
        <Card className="mb-6 animate-slide-up">
          <CardHeader>
            <CardTitle>Bulk Generate Vouchers</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBulkGenerate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Voucher Name
                  </label>
                  <Input
                    value={bulkForm.name}
                    onChange={(e) => setBulkForm({ ...bulkForm, name: e.target.value })}
                    placeholder="e.g., Daily Package"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bulkForm.price}
                    onChange={(e) => setBulkForm({ ...bulkForm, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Currency *
                  </label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                    value={bulkForm.currency}
                    onChange={(e) => setBulkForm({ ...bulkForm, currency: e.target.value })}
                    required
                  >
                    <option value="UGX">UGX</option>
                    <option value="USD">USD</option>
                    <option value="KES">KES</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data Limit (GB)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={bulkForm.dataLimit}
                    onChange={(e) => setBulkForm({ ...bulkForm, dataLimit: e.target.value })}
                    placeholder="Unlimited if empty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Limit (Hours)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={bulkForm.timeLimit}
                    onChange={(e) => setBulkForm({ ...bulkForm, timeLimit: e.target.value })}
                    placeholder="Unlimited if empty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Speed Limit (Mbps)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={bulkForm.speedLimit}
                    onChange={(e) => setBulkForm({ ...bulkForm, speedLimit: e.target.value })}
                    placeholder="Unlimited if empty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Count *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={bulkForm.count}
                    onChange={(e) => setBulkForm({ ...bulkForm, count: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prefix (optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., PROMO"
                    value={bulkForm.prefix}
                    onChange={(e) => setBulkForm({ ...bulkForm, prefix: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expires At (optional)
                  </label>
                  <Input
                    type="datetime-local"
                    value={bulkForm.expiresAt}
                    onChange={(e) => setBulkForm({ ...bulkForm, expiresAt: e.target.value })}
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all border-2 border-green-400"
              >
                {loading ? 'Generating...' : 'Generate Vouchers'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6 animate-slide-up">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="Search vouchers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="USED">Used</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Vouchers List */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>
              All Vouchers ({filteredVouchers.length}) - {filteredVouchers.filter((v) => v.status === 'ACTIVE').length} Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">
                <LoadingSpinner size="md" text="Loading vouchers..." />
              </div>
            ) : filteredVouchers.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-center py-8">No vouchers found.</p>
            ) : (
              <div className="space-y-2">
                {filteredVouchers.map((voucher) => (
                  <div
                    key={voucher.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white font-medium font-mono">{voucher.code}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {voucher.name || 'N/A'} - {voucher.currency} {voucher.price.toLocaleString()}
                      </p>
                      {voucher.client && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Client: {voucher.client.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Created: {new Date(voucher.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-lg text-xs ${
                        voucher.status === 'USED'
                          ? 'bg-red-500/20 text-red-700 dark:text-red-400'
                          : voucher.status === 'ACTIVE'
                          ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                          : 'bg-gray-500/20 text-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {voucher.status}
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
