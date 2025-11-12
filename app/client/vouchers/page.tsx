import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Ticket, Plus } from 'lucide-react'

export default async function VouchersPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'CLIENT') {
    redirect('/auth/login')
  }

  const vouchers = await prisma.voucher.findMany({
    where: { clientId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vouchers</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your internet access vouchers
            </p>
          </div>
          <Link href="/client/vouchers/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Voucher
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vouchers.map((voucher) => (
            <Card key={voucher.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{voucher.name || voucher.code}</CardTitle>
                    <p className="text-sm text-gray-500 font-mono mt-1">{voucher.code}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    voucher.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    voucher.status === 'USED' ? 'bg-blue-100 text-blue-800' :
                    voucher.status === 'EXPIRED' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {voucher.status}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold">UGX {voucher.price.toLocaleString()}</span>
                  </div>
                  {voucher.dataLimit && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Data Limit:</span>
                      <span className="font-semibold">{voucher.dataLimit} GB</span>
                    </div>
                  )}
                  {voucher.timeLimit && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Time Limit:</span>
                      <span className="font-semibold">{voucher.timeLimit} hours</span>
                    </div>
                  )}
                  {voucher.speedLimit && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Speed:</span>
                      <span className="font-semibold">{voucher.speedLimit} Mbps</span>
                    </div>
                  )}
                  {voucher.usedAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Used:</span>
                      <span className="font-semibold">
                        {new Date(voucher.usedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {vouchers.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Ticket className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No vouchers</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new voucher.
              </p>
              <div className="mt-6">
                <Link href="/client/vouchers/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Voucher
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

