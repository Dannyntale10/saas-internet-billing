'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { Users, Wifi, Clock, HardDrive, MapPin, Activity } from 'lucide-react'

interface ActiveUser {
  user: {
    id: string
    name: string
    email: string
  }
  voucher: {
    id: string
    code: string
    name: string | null
    timeLimit: number | null
    dataLimit: number | null
  } | null
  lastActivity: string
  dataUsed: number
  duration: number
  ipAddress: string | null
  macAddress: string | null
}

export default function ActiveUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
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

    fetchActiveUsers()
    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveUsers, 30000)
    return () => clearInterval(interval)
  }, [session, status, router])

  const fetchActiveUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/client/active-users', {
        cache: 'no-store',
      })

      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login?role=client')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setActiveUsers(data.activeUsers || [])
      } else {
        const errorData = await res.json()
        setError(new Error(errorData.error || 'Failed to fetch active users'))
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch active users')
      setError(error)
      console.error('Error fetching active users:', error)
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

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  return (
    <DashboardLayout>
      <div className="mobile-padding">
        <div className="mb-6 sm:mb-8">
          <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">Active Users</h1>
          <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
            Monitor users currently using your internet packages
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorDisplay error={error} onRetry={fetchActiveUsers} />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <LoadingSpinner size="md" text="Loading active users..." />
          </div>
        ) : activeUsers.length === 0 ? (
          <Card className="animate-slide-up">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Active Users
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No users are currently connected to your network
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Card */}
            <Card className="mb-6 animate-slide-up bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Active Users</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeUsers.length}</p>
                  </div>
                  <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Activity className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Users List */}
            <div className="grid grid-cols-1 gap-4">
              {activeUsers.map((item, index) => (
                <Card key={item.user.id} className="animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              {item.user.name || 'Unknown User'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.user.email}</p>
                          </div>
                        </div>

                        {item.voucher && (
                          <div className="ml-13 mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Wifi className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Voucher: {item.voucher.code}
                              </span>
                            </div>
                            {item.voucher.name && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
                                {item.voucher.name}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                          {item.duration > 0 && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {formatDuration(item.duration)}
                                </p>
                              </div>
                            </div>
                          )}
                          {item.dataUsed > 0 && (
                            <div className="flex items-center gap-2">
                              <HardDrive className="h-4 w-4 text-gray-500" />
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Data Used</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {item.dataUsed.toFixed(2)} GB
                                </p>
                              </div>
                            </div>
                          )}
                          {item.ipAddress && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">IP Address</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono">
                                  {item.ipAddress}
                                </p>
                              </div>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Last Activity</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {new Date(item.lastActivity).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">Active</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

