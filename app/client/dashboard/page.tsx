import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Users, Ticket, CreditCard, Activity } from 'lucide-react'

export default async function ClientDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'CLIENT') {
    redirect('/auth/login')
  }

  const clientId = session.user.id

  // Get statistics for this client
  const [totalEndUsers, activeVouchers, totalRevenue, recentPayments] = await Promise.all([
    prisma.user.count({ where: { parentClientId: clientId } }),
    prisma.voucher.count({ 
      where: { 
        clientId,
        status: 'ACTIVE'
      } 
    }),
    prisma.payment.aggregate({
      where: { 
        status: 'COMPLETED',
        voucher: {
          clientId
        }
      },
      _sum: { amount: true }
    }),
    prisma.payment.findMany({
      where: {
        voucher: { clientId }
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        },
        voucher: {
          select: { code: true, name: true }
        }
      }
    })
  ])

  const revenue = totalRevenue._sum.amount || 0

  const stats = [
    {
      name: 'End Users',
      value: totalEndUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Active Vouchers',
      value: activeVouchers,
      icon: Ticket,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Total Revenue',
      value: `UGX ${revenue.toLocaleString()}`,
      icon: CreditCard,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Active Sessions',
      value: '0', // TODO: Implement real-time tracking
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your internet service business
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
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {recentPayments.length > 0 ? (
                    recentPayments.map((payment) => (
                      <li key={payment.id} className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {payment.user.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {payment.voucher?.code} - {payment.voucher?.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              UGX {payment.amount.toLocaleString()}
                            </p>
                            <p className={`text-xs ${
                              payment.status === 'COMPLETED' ? 'text-green-600' : 
                              payment.status === 'PENDING' ? 'text-yellow-600' : 
                              'text-red-600'
                            }`}>
                              {payment.status}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="py-4 text-center text-sm text-gray-500">
                      No payments yet
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <a
                  href="/client/vouchers/create"
                  className="block w-full text-left px-4 py-3 border border-gray-300 rounded-md hover:bg-brand-green/5 hover:border-brand-green transition-colors"
                >
                  <div className="flex items-center">
                    <Ticket className="h-5 w-5 text-brand-green mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Create Voucher</p>
                      <p className="text-xs text-gray-500">Generate new internet vouchers</p>
                    </div>
                  </div>
                </a>
                <a
                  href="/client/users"
                  className="block w-full text-left px-4 py-3 border border-gray-300 rounded-md hover:bg-brand-green/5 hover:border-brand-green transition-colors"
                >
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-brand-green mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Manage Users</p>
                      <p className="text-xs text-gray-500">View and manage end users</p>
                    </div>
                  </div>
                </a>
                <a
                  href="/client/router"
                  className="block w-full text-left px-4 py-3 border border-gray-300 rounded-md hover:bg-brand-green/5 hover:border-brand-green transition-colors"
                >
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 text-brand-green mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Router Config</p>
                      <p className="text-xs text-gray-500">Configure router settings</p>
                    </div>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

