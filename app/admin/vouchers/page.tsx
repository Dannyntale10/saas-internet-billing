'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/ui/logo'

interface Voucher {
  id: string
  code: string
  packageId: string
  isUsed: boolean
  createdAt: string
  package: { name: string; price: number; currency: string } | null
}

interface Package {
  id: string
  name: string
  price: number
  currency: string
  isActive: boolean
}

export default function VouchersPage() {
  const router = useRouter()
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Bulk generation form
  const [bulkForm, setBulkForm] = useState({
    packageId: '',
    count: '10',
    prefix: '',
    expiresAt: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }

    fetchVouchers()
    fetchPackages()
  }, [router])

  const fetchVouchers = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/vouchers', {
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
        setVouchers(data)
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/packages', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        setPackages(data.filter((p: Package) => p.isActive))
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    }
  }

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/vouchers/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          packageId: bulkForm.packageId,
          count: parseInt(bulkForm.count),
          prefix: bulkForm.prefix || undefined,
          expiresAt: bulkForm.expiresAt || undefined,
        }),
      })

      if (res.status === 401) {
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
        return
      }

      if (res.ok) {
        setBulkForm({ packageId: '', count: '10', prefix: '', expiresAt: '' })
        fetchVouchers()
        alert('Vouchers generated successfully!')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to generate vouchers')
      }
    } catch (error) {
      console.error('Error generating vouchers:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    const csv = [
      ['Code', 'Package', 'Status', 'Created At'].join(','),
      ...filteredVouchers.map((v) =>
        [
          v.code,
          v.package?.name || 'N/A',
          v.isUsed ? 'Used' : 'Available',
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
    const matchesSearch = v.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'used' && v.isUsed) ||
      (statusFilter === 'available' && !v.isUsed)
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-brand-dark p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Logo />
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-4">Voucher Management</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link href="/admin/dashboard">
              <Button variant="outline" className="w-full sm:w-auto">Back to Dashboard</Button>
            </Link>
            <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
              Export CSV
            </Button>
          </div>
        </div>

        {/* Bulk Generation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bulk Generate Vouchers</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBulkGenerate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Package *
                  </label>
                  <select
                    className="flex h-10 w-full rounded-button border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent"
                    value={bulkForm.packageId}
                    onChange={(e) => setBulkForm({ ...bulkForm, packageId: e.target.value })}
                    required
                  >
                    <option value="">Select Package</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} - {pkg.currency} {pkg.price}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expires At (optional)
                  </label>
                  <Input
                    type="datetime-local"
                    value={bulkForm.expiresAt}
                    onChange={(e) => setBulkForm({ ...bulkForm, expiresAt: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? 'Generating...' : 'Generate Vouchers'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="Search vouchers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="flex h-10 w-full rounded-button border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="used">Used</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Vouchers List */}
        <Card>
          <CardHeader>
            <CardTitle>
              All Vouchers ({filteredVouchers.length}) - {filteredVouchers.filter((v) => !v.isUsed).length} Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-400 text-center py-8">Loading...</p>
            ) : filteredVouchers.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No vouchers found.</p>
            ) : (
              <div className="space-y-2">
                {filteredVouchers.map((voucher) => (
                  <div
                    key={voucher.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-background-light p-4 rounded-button"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium font-mono">{voucher.code}</p>
                      <p className="text-sm text-gray-400">
                        {voucher.package?.name || 'N/A'} - {voucher.package?.currency} {voucher.package?.price}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {new Date(voucher.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-button text-xs ${
                        voucher.isUsed
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-green-500/20 text-green-300'
                      }`}
                    >
                      {voucher.isUsed ? 'Used' : 'Available'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

