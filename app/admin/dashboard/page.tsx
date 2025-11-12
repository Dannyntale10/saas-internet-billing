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
        {/* Enhanced Header with Gradient */}
        <div className="mb-8 sm:mb-10 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 font-medium ml-15">
            Comprehensive overview of your internet billing system
          </p>
        </div>

        {/* Enhanced Stats Grid - 2025 Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card 
                key={stat.name} 
                className="group relative overflow-hidden border-2 hover:border-green-500/50 dark:hover:border-green-400/50 transition-all duration-300 animate-scale-in shadow-lg hover:shadow-2xl transform hover:scale-[1.02]"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Gradient Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-750 dark:to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <CardContent className="p-5 sm:p-6 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                        {stat.name}
                      </p>
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white mb-3 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        {stat.value}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm bg-gray-100 dark:bg-gray-700/50 px-2.5 py-1 rounded-full w-fit">
                        {stat.trendUp ? (
                          <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                        )}
                        <span className={`font-bold ${stat.trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {stat.trend}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">vs last month</span>
                      </div>
                    </div>
                    <div className={`${stat.bgColor} rounded-2xl p-4 sm:p-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Enhanced Charts and Data Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10">
          {/* Enhanced Revenue Chart */}
          <Card className="animate-slide-up border-2 shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500"></div>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                  Revenue Overview
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Last 7 days performance</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="opacity-30 dark:opacity-20" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs"
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    className="text-xs"
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ color: '#111827', fontWeight: 'bold' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#76D74C" 
                    strokeWidth={4}
                    dot={{ fill: '#76D74C', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, stroke: '#76D74C', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Enhanced Recent Clients */}
          <Card className="animate-slide-up border-2 shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500"></div>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                  Recent Clients
                </CardTitle>
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Latest registered clients</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {stats.recentClients.length > 0 ? (
                  stats.recentClients.map((client, index) => (
                    <div 
                      key={client.id} 
                      className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-750 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="flex-shrink-0 relative">
                          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <span className="text-white font-black text-lg sm:text-xl">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate mb-1">
                            {client.name}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate font-mono">
                            {client.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">
                          {client.endUsersCount || 0}
                        </p>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">users</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Users className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="text-sm font-medium">No clients yet</p>
                    <p className="text-xs mt-1">Start by adding your first client</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Quick Actions - 2025 Design */}
        <Card className="animate-slide-up border-2 shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"></div>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              Quick Actions
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Frequently used actions</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <a
                href="/admin/clients/new"
                className="group relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-white via-blue-50 to-white dark:from-gray-800 dark:via-blue-900/20 dark:to-gray-800 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <Users className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white text-center relative z-10">
                  Add Client
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 relative z-10">Create new client account</p>
              </a>
              <a
                href="/admin/transactions"
                className="group relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-white via-green-50 to-white dark:from-gray-800 dark:via-green-900/20 dark:to-gray-800 border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 via-green-500/5 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <CreditCard className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white text-center relative z-10">
                  View Transactions
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 relative z-10">Monitor all payments</p>
              </a>
              <a
                href="/admin/reports"
                className="group relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-white via-purple-50 to-white dark:from-gray-800 dark:via-purple-900/20 dark:to-gray-800 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <TrendingUp className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white text-center relative z-10">
                  View Reports
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 relative z-10">Analytics & insights</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
