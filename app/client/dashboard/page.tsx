'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Users, Ticket, CreditCard, Activity, ArrowUpRight, Plus, Router } from 'lucide-react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'
import { api } from '@/lib/api-client'

interface ClientStats {
  totalEndUsers: number
  activeVouchers: number
  totalRevenue: number
  activeUsers?: number
  recentPayments: Array<{
    id: string
    amount: number
    status: string
    createdAt: string
    user?: { name: string; email: string }
    voucher?: { code: string; name: string }
  }>
}

export default function ClientDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login?role=client')
      return
    }

    // Check role - handle both uppercase and lowercase
    const userRole = (session.user.role as string)?.toUpperCase()
    console.log('Client dashboard - User role:', userRole)

    // STRICT: Only CLIENT users can access client dashboard
    if (userRole !== 'CLIENT') {
      console.error('❌ Access denied: User role', userRole, 'cannot access client dashboard')
      // Sign out and redirect to login
      signOut({ redirect: false, callbackUrl: `/auth/login?role=client` }).then(() => {
        router.push(`/auth/login?role=client&error=access_denied`)
      })
      return
    }

    fetchStats()
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      setLoading(true)
      // Use Promise.all for parallel fetching if needed, or just fetch dashboard endpoint
      const res = await fetch('/api/client/dashboard', {
        cache: 'no-store', // Ensure fresh data
      })
      
      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login?role=client')
        return
      }
      
      if (res.ok) {
        const data = await res.json()
        setStats({
          totalEndUsers: data.stats?.totalEndUsers || 0,
          activeVouchers: data.stats?.activeVouchers || 0,
          totalRevenue: data.stats?.totalRevenue || 0,
          activeUsers: data.stats?.activeUsers || 0,
          recentPayments: data.recentPayments || []
        })
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || 'Failed to load dashboard')
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600">Failed to load dashboard data</p>
        </div>
      </DashboardLayout>
    )
  }

  const statCards = [
    {
      name: 'End Users',
      value: stats.totalEndUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      trend: '+8%',
      trendUp: true,
    },
    {
      name: 'Active Vouchers',
      value: stats.activeVouchers,
      icon: Ticket,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      trend: '+12%',
      trendUp: true,
    },
    {
      name: 'Total Revenue',
      value: `UGX ${stats.totalRevenue.toLocaleString()}`,
      icon: CreditCard,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      trend: '+15%',
      trendUp: true,
    },
    {
      name: 'Active Users',
      value: stats.activeUsers || '0',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      trend: '—',
      trendUp: null,
    },
  ]

  return (
    <DashboardLayout>
      <div className="mobile-padding">
        {/* Modern Header */}
        <div className="mb-6 sm:mb-8 animate-slide-up">
          <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">
            Client Dashboard
          </h1>
          <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
            Manage your internet service business
          </p>
        </div>

        {/* Modern Stats Grid - Mobile Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card 
                key={stat.name} 
                className="animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {stat.name}
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {stat.value}
                      </p>
                      {stat.trendUp !== null && (
                        <div className="flex items-center text-xs sm:text-sm">
                          {stat.trendUp ? (
                            <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-1" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 mr-1 rotate-180" />
                          )}
                          <span className={stat.trendUp ? 'text-green-600' : 'text-red-600'}>
                            {stat.trend}
                          </span>
                          <span className="text-gray-500 ml-1">vs last month</span>
                        </div>
                      )}
                    </div>
                    <div className={`${stat.bgColor} rounded-xl p-3 sm:p-4`}>
                      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Content Grid - Mobile Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Recent Payments */}
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle className="mobile-heading">Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {stats.recentPayments.length > 0 ? (
                  stats.recentPayments.map((payment) => (
                    <div 
                      key={payment.id}
                      className="flex items-center justify-between p-3 sm:p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                          {payment.user?.name || 'Unknown User'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                          {payment.voucher?.code || 'N/A'} - {payment.voucher?.name || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                          UGX {payment.amount.toLocaleString()}
                        </p>
                        <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'COMPLETED' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                            : payment.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No payments yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions - Modern Design */}
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle className="mobile-heading">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                <Link
                  href="/client/vouchers/create"
                  className="flex items-center p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-brand-green hover:bg-brand-green/5 transition-all duration-200 group"
                >
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-brand-green/10 group-hover:bg-brand-green/20 flex items-center justify-center mr-3 sm:mr-4 transition-colors">
                    <Ticket className="h-5 w-5 sm:h-6 sm:w-6 text-brand-green" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                      Create Voucher
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Generate new internet vouchers
                    </p>
                  </div>
                  <Plus className="h-5 w-5 text-gray-400 group-hover:text-brand-green transition-colors" />
                </Link>

                <Link
                  href="/client/vouchers"
                  className="flex items-center p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-brand-green hover:bg-brand-green/5 transition-all duration-200 group"
                >
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-brand-green/10 group-hover:bg-brand-green/20 flex items-center justify-center mr-3 sm:mr-4 transition-colors">
                    <Ticket className="h-5 w-5 sm:h-6 sm:w-6 text-brand-green" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                      Manage Vouchers
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      View and manage all vouchers
                    </p>
                  </div>
                </Link>

                <Link
                  href="/client/router"
                  className="flex items-center p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-brand-green hover:bg-brand-green/5 transition-all duration-200 group"
                >
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-brand-green/10 group-hover:bg-brand-green/20 flex items-center justify-center mr-3 sm:mr-4 transition-colors">
                    <Router className="h-5 w-5 sm:h-6 sm:w-6 text-brand-green" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                      Router Config
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Configure router settings
                    </p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
