import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyClient } from '@/lib/client-middleware'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyClient(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { userId: auth.user.id }
    if (status) where.status = status

    // Transactions are stored as Payments in current schema
    const payments = await prisma.payment.findMany({
      where: { userId: auth.user.id },
      include: {
        voucher: { select: { name: true, code: true, price: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching client transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

