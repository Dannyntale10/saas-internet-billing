import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
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

    return NextResponse.json({
      stats: {
        totalEndUsers,
        activeVouchers,
        totalRevenue: revenue,
      },
      recentPayments: recentPayments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt.toISOString(),
        user: payment.user,
        voucher: payment.voucher
      }))
    })
  } catch (error) {
    console.error('Error fetching client dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
