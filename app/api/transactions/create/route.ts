import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const { voucherId, amount, currency, method, phoneNumber } = body

    if (!voucherId || !amount || !method) {
      return NextResponse.json(
        { error: 'Voucher ID, amount, and payment method are required' },
        { status: 400 }
      )
    }

    // Create payment (transactions are payments in current schema)
    const payment = await prisma.payment.create({
      data: {
        userId: auth.user.id,
        voucherId,
        amount: parseFloat(amount),
        currency: currency || 'UGX',
        method,
        phoneNumber: phoneNumber || null,
        status: 'PENDING',
      },
      include: {
        voucher: { select: { code: true, name: true } },
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
