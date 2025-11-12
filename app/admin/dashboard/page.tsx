'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Users, Ticket, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { useToast } from '@/hooks/useToast'

interface Stats {
  totalClients: number
  totalEndUsers: number
  totalVouchers: number
  totalRevenue: number
  recentClients: Array<{
    id: string
    name: string
    email: string
    createdAt: string
    endUsersCount: number
  }>
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const toast = useToast()

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (!session) {
      console.log('No session, redirecting to login')
      router.push('/auth/login?role=admin')
      return
    }

    if (!session.user) {
      console.log('No user in session, redirecting to login')
      router.push('/auth/login?role=admin')
      return
    }

    // Check role - handle both uppercase and lowercase
    const userRole = session.user.role?.toUpperCase()
    console.log('Admin dashboard - User role:', userRole)

    // STRICT: Only ADMIN users can access admin dashboard
    if (userRole !== 'ADMIN') {
      console.error('❌ Access denied: User role', userRole, 'cannot access admin dashboard')
      // Sign out and redirect to login
      signOut({ redirect: false, callbackUrl: `/auth/login?role=admin` }).then(() => {
        router.push(`/auth/login?role=admin&error=access_denied`)
      })
      return
    }

    console.log('Session valid, fetching stats...')
    fetchStats()
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/stats')
      
      if (!res.ok) {
        throw new Error(`Failed to fetch stats: ${res.statusText}`)
      }
      
      const data = await res.json()
      setStats({
        totalClients: data.clients?.total || 0,
        totalEndUsers: data.clients?.active || 0,
        totalVouchers: data.vouchers?.total || 0,
        totalRevenue: data.revenue?.total || 0,
        recentClients: data.recentClients || []
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load dashboard data')
      setError(error)
      toast.showError(error.message)
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="mobile-padding">
          <ErrorDisplay error={error} onRetry={fetchStats} />
        </div>
      </DashboardLayout>
    )
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <ErrorDisplay error="Failed to load dashboard data" onRetry={fetchStats} />
        </div>
      </DashboardLayout>
    )
  }

  const statCards = [
    {
      name: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      trend: '+12%',
      trendUp: true,
    },
    {
      name: 'Total End Users',
      value: stats.totalEndUsers,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      trend: '+8%',
      trendUp: true,
    },
    {
      name: 'Total Vouchers',
      value: stats.totalVouchers,
      icon: Ticket,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      trend: '+5%',
      trendUp: true,
    },
    {
      name: 'Total Revenue',
      value: `UGX ${stats.totalRevenue.toLocaleString()}`,
      icon: CreditCard,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      trend: '+15%',
      trendUp: true,
    },
  ]

  // Mock chart data - replace with real data
  const revenueData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 5000 },
    { name: 'Thu', revenue: 4500 },
    { name: 'Fri', revenue: 6000 },
    { name: 'Sat', revenue: 5500 },
    { name: 'Sun', revenue: 7000 },
  ]

  const COLORS = ['#76D74C', '#4CAF50', '#8BC34A', '#CDDC39']

  return (
    <DashboardLayout>
      <div className="mobile-padding">
        {/* Modern Header */}
        <div className="mb-6 sm:mb-8 animate-slide-up">
          <h1 className="mobile-heading font-bold" style={{ color: '#111827' }}>
            Admin Dashboard
          </h1>
          <p className="mt-2 mobile-text" style={{ color: '#4b5563' }}>
            Overview of your internet billing system
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
                      <div className="flex items-center text-xs sm:text-sm">
                        {stat.trendUp ? (
                          <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 mr-1" />
                        )}
                        <span className={stat.trendUp ? 'text-green-600' : 'text-red-600'}>
                          {stat.trend}
                        </span>
                        <span className="text-gray-500 ml-1">vs last month</span>
                      </div>
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

        {/* Charts and Data Grid - Mobile Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Revenue Chart */}
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle className="mobile-heading">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#76D74C" 
                    strokeWidth={3}
                    dot={{ fill: '#76D74C', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Clients */}
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle className="mobile-heading">Recent Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {stats.recentClients.length > 0 ? (
                  stats.recentClients.map((client) => (
                    <div 
                      key={client.id} 
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-brand-green to-green-500 flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-sm sm:text-base">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                            {client.name}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                            {client.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          {client.endUsersCount || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">users</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No clients yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Mobile Optimized */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="mobile-heading">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <a
                href="/admin/clients/new"
                className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-green hover:bg-brand-green/5 transition-all duration-200 group"
              >
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-brand-green/10 group-hover:bg-brand-green/20 flex items-center justify-center mb-2 sm:mb-3 transition-colors">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-brand-green" />
                </div>
                <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white text-center">
                  Add Client
                </p>
              </a>
              <a
                href="/admin/vouchers"
                className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-green hover:bg-brand-green/5 transition-all duration-200 group"
              >
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-brand-green/10 group-hover:bg-brand-green/20 flex items-center justify-center mb-2 sm:mb-3 transition-colors">
                  <Ticket className="h-5 w-5 sm:h-6 sm:w-6 text-brand-green" />
                </div>
                <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white text-center">
                  Manage Vouchers
                </p>
              </a>
              <a
                href="/admin/transactions"
                className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-green hover:bg-brand-green/5 transition-all duration-200 group"
              >
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-brand-green/10 group-hover:bg-brand-green/20 flex items-center justify-center mb-2 sm:mb-3 transition-colors">
                  <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-brand-green" />
                </div>
                <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white text-center">
                  View Transactions
                </p>
              </a>
              <a
                href="/admin/reports"
                className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-green hover:bg-brand-green/5 transition-all duration-200 group"
              >
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-brand-green/10 group-hover:bg-brand-green/20 flex items-center justify-center mb-2 sm:mb-3 transition-colors">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-brand-green" />
                </div>
                <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white text-center">
                  View Reports
                </p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
