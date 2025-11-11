import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Ticket, ShoppingCart, Activity } from 'lucide-react'

export default async function UserDashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const userId = session.user.id

  // Get user's vouchers and payments
  const [myVouchers, myPayments] = await Promise.all([
    prisma.voucher.findMany({
      where: { usedBy: userId },
      orderBy: { usedAt: 'desc' },
      take: 5,
      include: {
        client: {
          select: { name: true }
        }
      }
    }),
    prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        voucher: {
          select: { code: true, name: true }
        }
      }
    })
  ])

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back, {session.user.name}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <Link href="/user/buy-voucher">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-brand-green/10 rounded-md p-3">
                    <ShoppingCart className="h-6 w-6 text-brand-green" />
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Buy Voucher</p>
                    <p className="text-lg font-semibold text-gray-900">Purchase Internet</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-brand-green/10 rounded-md p-3">
                  <Ticket className="h-6 w-6 text-brand-green" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">My Vouchers</p>
                  <p className="text-lg font-semibold text-gray-900">{myVouchers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Active Sessions</p>
                  <p className="text-lg font-semibold text-gray-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>My Vouchers</CardTitle>
            </CardHeader>
            <CardContent>
              {myVouchers.length > 0 ? (
                <div className="space-y-4">
                  {myVouchers.map((voucher) => (
                    <div key={voucher.id} className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <p className="font-medium">{voucher.name || voucher.code}</p>
                        <p className="text-sm text-gray-500">
                          {voucher.client.name} • {voucher.usedAt ? new Date(voucher.usedAt).toLocaleDateString() : ''}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        voucher.status === 'USED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {voucher.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Ticket className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No vouchers yet</p>
                  <Link href="/user/buy-voucher">
                    <Button className="mt-4">Buy Voucher</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {myPayments.length > 0 ? (
                <div className="space-y-4">
                  {myPayments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <p className="font-medium">{payment.voucher?.name || payment.voucher?.code}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">UGX {payment.amount.toLocaleString()}</p>
                        <p className={`text-xs ${
                          payment.status === 'COMPLETED' ? 'text-green-600' : 
                          payment.status === 'PENDING' ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {payment.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No payments yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

