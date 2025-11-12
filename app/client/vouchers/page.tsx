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
import { Ticket, Plus } from 'lucide-react'

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
}

export default function VouchersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [vouchers, setVouchers] = useState<Voucher[]>([])
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

    fetchVouchers()
  }, [session, status, router])

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

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <LoadingSpinner size="md" text="Loading vouchers..." />
          </div>
        ) : vouchers.length === 0 ? (
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
            {vouchers.map((voucher) => (
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
