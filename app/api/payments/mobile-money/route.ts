import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MTNMobileMoney } from '@/lib/payments/mtn'
import { AirtelMoney } from '@/lib/payments/airtel'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const paymentSchema = z.object({
  voucherId: z.string(),
  phoneNumber: z.string().min(10),
  method: z.enum(['MTN_MOBILE_MONEY', 'AIRTEL_MONEY']),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const data = paymentSchema.parse(body)

    // Get voucher
    const voucher = await prisma.voucher.findUnique({
      where: { id: data.voucherId },
      include: { client: true }
    })

    if (!voucher) {
      return NextResponse.json(
        { error: 'Voucher not found' },
        { status: 404 }
      )
    }

    if (voucher.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Voucher is not active' },
        { status: 400 }
      )
    }

    // Check if voucher is expired
    if (voucher.validUntil && new Date(voucher.validUntil) < new Date()) {
      await prisma.voucher.update({
        where: { id: voucher.id },
        data: { status: 'EXPIRED' }
      })
      return NextResponse.json(
        { error: 'Voucher has expired' },
        { status: 400 }
      )
    }

    // Create payment record
    const transactionId = randomUUID()
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        voucherId: voucher.id,
        amount: voucher.price,
        method: data.method,
        status: 'PENDING',
        phoneNumber: data.phoneNumber,
        transactionId,
        reference: `VOUCHER-${voucher.code}`,
      }
    })

    // Initiate mobile money payment
    try {
      let paymentResponse
      
      if (data.method === 'MTN_MOBILE_MONEY') {
        const mtn = new MTNMobileMoney()
        paymentResponse = await mtn.requestPayment(
          data.phoneNumber,
          voucher.price,
          transactionId,
          `Payment for voucher ${voucher.code}`,
          'Internet voucher purchase'
        )
      } else {
        const airtel = new AirtelMoney()
        paymentResponse = await airtel.requestPayment(
          data.phoneNumber,
          voucher.price,
          `VOUCHER-${voucher.code}`,
          transactionId
        )
      }

      // Update payment with transaction details
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: paymentResponse.transactionId || transactionId,
        }
      })

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        transactionId: paymentResponse.transactionId || transactionId,
        message: 'Payment request initiated. Please approve on your phone.',
      })
    } catch (error: any) {
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      })

      return NextResponse.json(
        { error: error.message || 'Payment initiation failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

