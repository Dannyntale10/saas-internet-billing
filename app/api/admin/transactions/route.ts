import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Transactions are stored as Payments in current schema
    const payments = await prisma.payment.findMany({
      include: {
        user: { select: { email: true, name: true } },
        voucher: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 payments
    })
    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

