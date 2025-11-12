import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    // Get all statistics
    const [
      totalClients,
      activeClients,
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      totalRevenue,
      todayRevenue,
      totalVouchers,
      activeVouchers,
      usedVouchers,
      totalPackages,
      activePackages,
      todayTransactions,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.user.count({ where: { role: 'CLIENT', isActive: true } }),
      prisma.payment.count(),
      prisma.payment.count({ where: { status: 'COMPLETED' } }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { amount: true },
      }),
      prisma.voucher.count(),
      prisma.voucher.count({ where: { status: 'ACTIVE' } }),
      prisma.voucher.count({ where: { status: 'USED' } }),
      prisma.user.count({ where: { role: 'END_USER' } }),
      prisma.user.count({ where: { role: 'END_USER', isActive: true } }),
      prisma.payment.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ])

    // Get recent payments
    const recentPayments = await prisma.payment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, name: true } },
        voucher: { select: { code: true, name: true } },
      },
    })

    // Get revenue by date (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const payments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    })

    // Group by date
    const revenueByDateMap = new Map<string, { amount: number; count: number }>()
    
    // Initialize all 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      revenueByDateMap.set(dateStr, { amount: 0, count: 0 })
    }

    // Aggregate payments by date
    payments.forEach((payment) => {
      const dateStr = payment.createdAt.toISOString().split('T')[0]
      const existing = revenueByDateMap.get(dateStr) || { amount: 0, count: 0 }
      revenueByDateMap.set(dateStr, {
        amount: existing.amount + payment.amount,
        count: existing.count + 1,
      })
    })

    const revenueByDate = Array.from(revenueByDateMap.entries()).map(([date, data]) => ({
      date,
      amount: data.amount,
      count: data.count,
    }))

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

    return NextResponse.json({
      clients: {
        total: totalClients,
        active: activeClients,
        inactive: totalClients - activeClients,
      },
      transactions: {
        total: totalTransactions,
        completed: completedTransactions,
        pending: pendingTransactions,
        failed: totalTransactions - completedTransactions - pendingTransactions,
        today: todayTransactions,
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
        today: todayRevenue._sum.amount || 0,
        byDate: revenueByDate,
      },
      vouchers: {
        total: totalVouchers,
        active: activeVouchers,
        used: usedVouchers,
        usageRate: totalVouchers > 0 ? (usedVouchers / totalVouchers) * 100 : 0,
      },
      packages: {
        total: totalPackages,
        active: activePackages,
        inactive: totalPackages - activePackages,
      },
      recentPayments,
      recentClients: recentClients.map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        createdAt: client.createdAt.toISOString(),
        endUsersCount: client._count.endUsers
      })),
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

