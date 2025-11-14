import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')

    const activities = []

    // Get recent payments
    const recentPayments = await prisma.payment.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    })

    recentPayments.forEach((payment) => {
      activities.push({
        id: `payment-${payment.id}`,
        type: 'payment',
        action: `Payment ${payment.status === 'COMPLETED' ? 'completed' : payment.status.toLowerCase()}`,
        user: payment.user.name || payment.user.email,
        details: `${payment.amount} ${payment.currency}`,
        timestamp: payment.createdAt,
        status: payment.status === 'COMPLETED' ? 'success' : payment.status === 'FAILED' ? 'error' : 'info',
      })
    })

    // Get recent vouchers
    const recentVouchers = await prisma.voucher.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    recentVouchers.forEach((voucher) => {
      activities.push({
        id: `voucher-${voucher.id}`,
        type: 'voucher',
        action: `Voucher ${voucher.status === 'ACTIVE' ? 'created' : voucher.status.toLowerCase()}`,
        user: voucher.client.name || voucher.client.email,
        details: `Code: ${voucher.code}`,
        timestamp: voucher.createdAt,
        status: voucher.status === 'ACTIVE' ? 'success' : 'warning',
      })
    })

    // Get recent users
    const recentUsers = await prisma.user.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    recentUsers.forEach((user) => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user',
        action: `User ${user.isActive ? 'created' : 'deactivated'}`,
        user: user.name || user.email,
        details: `Role: ${user.role}`,
        timestamp: user.createdAt,
        status: user.isActive ? 'success' : 'warning',
      })
    })

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    activities.splice(limit)

    return NextResponse.json({ activities })

  } catch (error: any) {
    console.error('Activity fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities', activities: [] },
      { status: 500 }
    )
  }
}

