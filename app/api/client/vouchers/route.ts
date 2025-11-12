import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const clientId = session.user.id

    // Get all vouchers for this client
    const vouchers = await prisma.voucher.findMany({
      where: {
        clientId: clientId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Separate vouchers by status
    const activeVouchers = vouchers.filter(v => v.status === 'ACTIVE')
    const usedVouchers = vouchers.filter(v => v.status === 'USED')
    const expiredVouchers = vouchers.filter(v => v.status === 'EXPIRED')
    const cancelledVouchers = vouchers.filter(v => v.status === 'CANCELLED')

    return NextResponse.json({
      all: vouchers,
      active: activeVouchers,
      used: usedVouchers,
      expired: expiredVouchers,
      cancelled: cancelledVouchers,
      stats: {
        total: vouchers.length,
        active: activeVouchers.length,
        used: usedVouchers.length,
        expired: expiredVouchers.length,
        cancelled: cancelledVouchers.length,
      },
    })
  } catch (error) {
    console.error('Error fetching vouchers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vouchers' },
      { status: 500 }
    )
  }
}

