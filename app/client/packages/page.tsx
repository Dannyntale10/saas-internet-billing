'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { Package, DollarSign, Clock, HardDrive, Wifi } from 'lucide-react'

interface PackageData {
  id: string
  name: string
  price: number
  currency: string
  timeLimit?: number
  dataLimit?: number
  speedLimit?: number
  status: string
  code?: string
}

export default function ClientPackagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [packages, setPackages] = useState<PackageData[]>([])
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

    fetchPackages()
  }, [session, status, router])

  const fetchPackages = async () => {
    try {
      setLoading(true)
      setError(null)
      // Get packages from vouchers (since packages are stored as vouchers)
      const res = await fetch('/api/client/vouchers')
      if (!res.ok) throw new Error('Failed to fetch packages')
      
      const data = await res.json()
      const vouchers = data.all || data
      
      // Group by unique package characteristics
      const packageMap = new Map<string, PackageData>()
      
      vouchers.forEach((v: any) => {
        const key = `${v.timeLimit || 0}-${v.dataLimit || 0}-${v.speedLimit || 0}-${v.price}`
        if (!packageMap.has(key)) {
          packageMap.set(key, {
            id: v.id,
            name: v.name || `${v.timeLimit || 0} hours`,
            price: v.price,
            currency: v.currency || 'UGX',
            timeLimit: v.timeLimit,
            dataLimit: v.dataLimit,
            speedLimit: v.speedLimit,
            status: v.status,
            code: v.code,
          })
        }
      })
      
      setPackages(Array.from(packageMap.values()))
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load packages')
      setError(error)
      console.error('Error fetching packages:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading packages..." />
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
        <div className="mb-6 sm:mb-8">
          <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">Packages</h1>
          <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
            View all available internet packages
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorDisplay error={error} onRetry={fetchPackages} />
          </div>
        )}

        {packages.length === 0 ? (
          <Card className="animate-slide-up">
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No packages found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create vouchers to generate packages
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="animate-scale-in">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wifi className="h-5 w-5 text-green-600" />
                      {pkg.name}
                    </CardTitle>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      pkg.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {pkg.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-lg font-bold text-gray-900 dark:text-white">
                      <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                      <span>{pkg.currency} {pkg.price.toLocaleString()}</span>
                    </div>
                    {pkg.timeLimit && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="h-4 w-4 mr-2 text-green-600" />
                        <span>{pkg.timeLimit} hours</span>
                      </div>
                    )}
                    {pkg.dataLimit && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <HardDrive className="h-4 w-4 mr-2 text-green-600" />
                        <span>{pkg.dataLimit} GB</span>
                      </div>
                    )}
                    {pkg.speedLimit && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Package className="h-4 w-4 mr-2 text-green-600" />
                        <span>{pkg.speedLimit} Mbps</span>
                      </div>
                    )}
                    {pkg.code && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Voucher Code</p>
                        <p className="text-sm font-mono text-gray-900 dark:text-white">{pkg.code}</p>
                      </div>
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

