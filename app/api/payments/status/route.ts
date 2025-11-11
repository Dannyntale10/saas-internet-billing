import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MTNMobileMoney } from '@/lib/payments/mtn'
import { AirtelMoney } from '@/lib/payments/airtel'
import { PaymentStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID required' },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { voucher: true }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Check payment status with provider
    if (payment.status === 'PENDING' && payment.transactionId) {
      try {
        let statusResponse
        
        if (payment.method === 'MTN_MOBILE_MONEY') {
          const mtn = new MTNMobileMoney()
          statusResponse = await mtn.checkPaymentStatus(payment.transactionId)
        } else {
          const airtel = new AirtelMoney()
          statusResponse = await airtel.checkPaymentStatus(payment.transactionId)
        }

        // Update payment status based on response
        let newStatus: PaymentStatus = payment.status
        if (statusResponse.status === 'SUCCESSFUL' || statusResponse.status === 'COMPLETED') {
          newStatus = 'COMPLETED'
          
          // Update voucher status and mark as used
          await prisma.voucher.update({
            where: { id: payment.voucherId! },
            data: {
              status: 'USED',
              usedBy: payment.userId,
              usedAt: new Date(),
            }
          })

          // Create router user if needed
          // This would integrate with the router API
        } else if (statusResponse.status === 'FAILED') {
          newStatus = 'FAILED'
        }

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: newStatus,
            completedAt: newStatus === 'COMPLETED' ? new Date() : null,
          }
        })

        return NextResponse.json({
          status: newStatus,
          payment,
        })
      } catch (error) {
        console.error('Status check error:', error)
        // Return current status if check fails
      }
    }

    return NextResponse.json({
      status: payment.status,
      payment,
    })
  } catch (error) {
    console.error('Payment status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

