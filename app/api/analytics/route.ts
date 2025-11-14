import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get('range') || '30d'

    // Calculate date range
    const now = new Date()
    const daysAgo = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - daysAgo)

    // Previous period for comparison
    const previousStartDate = new Date(startDate)
    previousStartDate.setDate(previousStartDate.getDate() - daysAgo)

    // Revenue data
    const payments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
    })

    const previousPayments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: previousStartDate,
          lt: startDate,
        },
      },
    })

    // Group revenue by date
    const revenueByDate = new Map<string, number>()
    payments.forEach((payment) => {
      const date = payment.createdAt.toISOString().split('T')[0]
      revenueByDate.set(date, (revenueByDate.get(date) || 0) + payment.amount)
    })

    const revenue = Array.from(revenueByDate.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Users data
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: startDate },
      },
    })

    const previousUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: previousStartDate,
          lt: startDate,
        },
      },
    })

    // Group users by date
    const usersByDate = new Map<string, number>()
    users.forEach((user) => {
      const date = user.createdAt.toISOString().split('T')[0]
      usersByDate.set(date, (usersByDate.get(date) || 0) + 1)
    })

    const usersData = Array.from(usersByDate.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Voucher status
    const vouchers = await prisma.voucher.findMany({
      where: {
        createdAt: { gte: startDate },
      },
    })

    const voucherStatus = vouchers.reduce((acc, voucher) => {
      acc[voucher.status] = (acc[voucher.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const voucherData = Object.entries(voucherStatus).map(([status, count]) => ({
      status,
      count,
    }))

    // Payment methods
    const paymentMethods = payments.reduce((acc, payment) => {
      acc[payment.method] = (acc[payment.method] || 0) + payment.amount
      return acc
    }, {} as Record<string, number>)

    const paymentData = Object.entries(paymentMethods).map(([method, amount]) => ({
      method,
      amount,
    }))

    // Summary
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
    const previousRevenue = previousPayments.reduce((sum, p) => sum + p.amount, 0)
    const revenueChange = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0

    const usersChange = previousUsers.length > 0
      ? ((users.length - previousUsers.length) / previousUsers.length) * 100
      : 0

    const activeVouchers = await prisma.voucher.count({
      where: { status: 'ACTIVE' },
    })

    return NextResponse.json({
      revenue,
      users: usersData,
      vouchers: voucherData,
      payments: paymentData,
      summary: {
        totalRevenue,
        totalUsers: users.length,
        activeVouchers,
        totalPayments: payments.length,
        revenueChange: Math.round(revenueChange * 10) / 10,
        usersChange: Math.round(usersChange * 10) / 10,
      },
    })

  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

