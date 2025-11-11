import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Users, Ticket, CreditCard, TrendingUp } from 'lucide-react'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role !== 'ADMIN') {
    // Redirect based on actual role
    if (session.user.role === 'CLIENT') {
      redirect('/client/dashboard')
    } else {
      redirect('/user/dashboard')
    }
  }

  // Get statistics
  const [totalClients, totalEndUsers, totalVouchers, totalRevenue] = await Promise.all([
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.user.count({ where: { role: 'END_USER' } }),
    prisma.voucher.count(),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true }
    })
  ])

  const revenue = totalRevenue._sum.amount || 0

  const stats = [
    {
      name: 'Total Clients',
      value: totalClients,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Total End Users',
      value: totalEndUsers,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Total Vouchers',
      value: totalVouchers,
      icon: Ticket,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Total Revenue',
      value: `UGX ${revenue.toLocaleString()}`,
      icon: CreditCard,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  // Get recent clients
  const recentClients = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: {
        select: { endUsers: true }
      }
    }
  })

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Overview of your internet billing system
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.name}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 ${stat.bgColor} rounded-md p-3`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.name}
                        </dt>
                        <dd className="text-lg font-semibold text-gray-900">
                          {stat.value}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {recentClients.map((client) => (
                    <li key={client.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-brand-green/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-brand-green" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {client.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {client.email}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-sm text-gray-500">
                          {client._count.endUsers} users
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Clients</span>
                  <span className="text-sm font-semibold">{totalClients}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total End Users</span>
                  <span className="text-sm font-semibold">{totalEndUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Vouchers</span>
                  <span className="text-sm font-semibold">{totalVouchers}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-sm font-medium text-gray-900">Total Revenue</span>
                  <span className="text-sm font-bold text-brand-green">
                    UGX {revenue.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

