'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { Ticket, Plus, CheckCircle2, XCircle, Clock, Filter } from 'lucide-react'

interface Voucher {
  id: string
  code: string
  name: string | null
  status: string
  price: number
  currency: string
  dataLimit: number | null
  timeLimit: number | null
  speedLimit: number | null
  validUntil: string | null
  createdAt: string
  usedAt?: string | null
}

interface VoucherStats {
  total: number
  active: number
  used: number
  expired: number
  cancelled: number
}

export default function VouchersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([])
  const [stats, setStats] = useState<VoucherStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

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

    fetchVouchers()
  }, [session, status, router])

  // Filter vouchers based on status
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredVouchers(vouchers)
    } else {
      setFilteredVouchers(vouchers.filter(v => v.status === statusFilter))
    }
  }, [statusFilter, vouchers])

  const fetchVouchers = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/client/vouchers')

      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login?role=client')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setVouchers(data.all || data)
        setStats(data.stats || null)
        // Set initial filtered vouchers
        setFilteredVouchers(data.all || data)
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

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading..." />
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
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">Vouchers</h1>
            <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
              Manage your internet access vouchers
            </p>
          </div>
          <Link href="/client/vouchers/create">
            <Button 
              className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all border-2 border-green-400"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Voucher
            </Button>
          </Link>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorDisplay error={error} onRetry={fetchVouchers} />
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            <Card className="animate-scale-in">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="animate-scale-in border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    Active
                  </p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="animate-scale-in border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3 text-blue-600" />
                    Used
                  </p>
                  <p className="text-2xl font-bold text-blue-600">{stats.used}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="animate-scale-in border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-center gap-1">
                    <XCircle className="h-3 w-3 text-red-600" />
                    Expired
                  </p>
                  <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="animate-scale-in border-gray-200 dark:border-gray-800">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Cancelled</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.cancelled}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter */}
        <Card className="mb-6 animate-slide-up">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              >
                <option value="all">All Vouchers ({vouchers.length})</option>
                <option value="ACTIVE">Active ({stats?.active || 0})</option>
                <option value="USED">Used ({stats?.used || 0})</option>
                <option value="EXPIRED">Expired ({stats?.expired || 0})</option>
                <option value="CANCELLED">Cancelled ({stats?.cancelled || 0})</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <LoadingSpinner size="md" text="Loading vouchers..." />
          </div>
        ) : filteredVouchers.length === 0 ? (
          <Card className="animate-slide-up">
            <CardContent className="py-12 text-center">
              <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No vouchers found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Create your first voucher to get started
              </p>
              <Link href="/client/vouchers/create">
                <Button 
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all border-2 border-green-400"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Voucher
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVouchers.map((voucher) => (
              <Card key={voucher.id} className="animate-scale-in">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{voucher.name || voucher.code}</CardTitle>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">{voucher.code}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs ${
                      voucher.status === 'ACTIVE' 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : voucher.status === 'USED'
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}>
                      {voucher.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {voucher.currency} {voucher.price.toLocaleString()}
                    </p>
                    {voucher.dataLimit && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Data: {voucher.dataLimit} GB
                      </p>
                    )}
                    {voucher.timeLimit && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Time: {voucher.timeLimit} hours
                      </p>
                    )}
                    {voucher.speedLimit && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Speed: {voucher.speedLimit} Mbps
                      </p>
                    )}
                    {voucher.validUntil && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Valid until: {new Date(voucher.validUntil).toLocaleDateString()}
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
