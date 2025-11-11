import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MTNMobileMoney } from '@/lib/payments/mtn'
import { AirtelMoney } from '@/lib/payments/airtel'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const testPaymentSchema = z.object({
  phoneNumber: z.string().min(10),
  amount: z.number().min(100),
  method: z.enum(['MTN_MOBILE_MONEY', 'AIRTEL_MONEY']),
  testMode: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const data = testPaymentSchema.parse(body)

    const transactionId = randomUUID()

    try {
      let paymentResponse: any
      let providerTransactionId: string = transactionId

      if (data.method === 'MTN_MOBILE_MONEY') {
        const mtn = new MTNMobileMoney()
        paymentResponse = await mtn.requestPayment(
          data.phoneNumber,
          data.amount,
          transactionId,
          `Test payment for ${data.amount} UGX`,
          'Sandbox test payment'
        )
        providerTransactionId = paymentResponse.financialTransactionId || transactionId
      } else {
        const airtel = new AirtelMoney()
        paymentResponse = await airtel.requestPayment(
          data.phoneNumber,
          data.amount,
          `TEST-${transactionId}`,
          transactionId
        )
        providerTransactionId = paymentResponse.transactionId || transactionId
      }

      return NextResponse.json({
        success: true,
        transactionId: providerTransactionId,
        message: 'Test payment request initiated successfully',
        details: paymentResponse,
      })
    } catch (error: any) {
      console.error('Test payment error:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Payment test failed',
          details: error.response?.data || error.message,
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Test payment route error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

