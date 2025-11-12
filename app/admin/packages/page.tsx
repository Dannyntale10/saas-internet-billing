'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { useToast } from '@/hooks/useToast'
import { Plus, Package, DollarSign, Clock } from 'lucide-react'
import Link from 'next/link'

interface PackageData {
  id: string
  name: string
  price: number
  timeLimit?: number
  dataLimit?: number
  speedLimit?: number
  status: string
}

export default function PackagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [packages, setPackages] = useState<PackageData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const toast = useToast()

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/login')
      return
    }

    fetchPackages()
  }, [session, status, router])

  const fetchPackages = async () => {
    try {
      setLoading(true)
      setError(null)
      // Get packages from vouchers (since packages are stored as vouchers)
      const res = await fetch('/api/admin/vouchers')
      if (!res.ok) throw new Error('Failed to fetch packages')
      
      const vouchers = await res.json()
      // Group by unique package characteristics
      const packageMap = new Map<string, PackageData>()
      
      vouchers.forEach((v: any) => {
        const key = `${v.timeLimit || 0}-${v.dataLimit || 0}-${v.speedLimit || 0}-${v.price}`
        if (!packageMap.has(key)) {
          packageMap.set(key, {
            id: v.id,
            name: v.name || `${v.timeLimit || 0} hours`,
            price: v.price,
            timeLimit: v.timeLimit,
            dataLimit: v.dataLimit,
            speedLimit: v.speedLimit,
            status: v.status,
          })
        }
      })
      
      setPackages(Array.from(packageMap.values()))
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load packages')
      setError(error)
      toast.showError(error.message)
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

  if (error) {
    return (
      <DashboardLayout>
        <ErrorDisplay error={error} onRetry={fetchPackages} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mobile-padding">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">
              Packages
            </h1>
            <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
              Manage internet packages
            </p>
          </div>
          <Link href="/admin/vouchers">
            <Button 
              variant="gradient" 
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all border-2 border-green-400"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Package
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="animate-scale-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
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
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <DollarSign className="h-4 w-4 mr-2 text-brand-green" />
                    <span className="font-semibold">UGX {pkg.price.toLocaleString()}</span>
                  </div>
                  {pkg.timeLimit && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-2 text-brand-green" />
                      <span>{pkg.timeLimit} hours</span>
                    </div>
                  )}
                  {pkg.dataLimit && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Package className="h-4 w-4 mr-2 text-brand-green" />
                      <span>{pkg.dataLimit} GB</span>
                    </div>
                  )}
                  {pkg.speedLimit && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Package className="h-4 w-4 mr-2 text-brand-green" />
                      <span>{pkg.speedLimit} Mbps</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {packages.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No packages found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Create packages by generating vouchers
              </p>
              <Link href="/admin/vouchers">
                <Button 
                  variant="gradient" 
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all border-2 border-green-400"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Package
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
