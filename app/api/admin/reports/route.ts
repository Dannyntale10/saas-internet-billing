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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'revenue'
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const dateFilter: any = {}
    if (from) {
      dateFilter.gte = new Date(from)
    }
    if (to) {
      dateFilter.lte = new Date(to)
    }

    if (type === 'revenue') {
      // Revenue by date - using Payments instead of Transactions
      const payments = await prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        orderBy: { createdAt: 'desc' },
      })

      const revenueByDate = payments.reduce((acc: any, p) => {
        const date = p.createdAt.toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = { date, count: 0, revenue: 0 }
        }
        acc[date].count++
        acc[date].revenue += p.amount
        return acc
      }, {})

      return NextResponse.json({
        transactions: Object.values(revenueByDate).reverse(),
      })
    }

    if (type === 'clients') {
      // Revenue by client - using Payments instead of Transactions
      const payments = await prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        include: {
          user: { select: { email: true, name: true } },
        },
      })

      const clientRevenue = payments.reduce((acc: any, p) => {
        const clientId = p.userId
        if (!acc[clientId]) {
          acc[clientId] = {
            name: p.user?.name || p.user?.email || 'Guest',
            totalTransactions: 0,
            totalRevenue: 0,
          }
        }
        acc[clientId].totalTransactions++
        acc[clientId].totalRevenue += p.amount
        return acc
      }, {})

      return NextResponse.json({
        clients: Object.values(clientRevenue),
      })
    }

    if (type === 'packages') {
      // Revenue by package - using Payments with Vouchers instead of Transactions
      const payments = await prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        include: {
          voucher: { select: { name: true, code: true } },
        },
      })

      const packageRevenue = payments.reduce((acc: any, p) => {
        const packageKey = p.voucher?.name || p.voucher?.code || 'Unknown'
        if (!acc[packageKey]) {
          acc[packageKey] = {
            name: packageKey,
            count: 0,
            revenue: 0,
          }
        }
        acc[packageKey].count++
        acc[packageKey].revenue += p.amount
        return acc
      }, {})

      return NextResponse.json({
        packages: Object.values(packageRevenue),
      })
    }

    if (type === 'vouchers') {
      // Voucher usage report
      const vouchers = await prisma.voucher.findMany({
        where: {
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      })

      return NextResponse.json({
        vouchers: vouchers.map((v) => ({
          code: v.code,
          package: v.name || `${v.timeLimit || 0} hours`,
          status: v.status === 'USED' ? 'Used' : v.status === 'ACTIVE' ? 'Available' : v.status,
          createdAt: v.createdAt.toISOString(),
        })),
      })
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

