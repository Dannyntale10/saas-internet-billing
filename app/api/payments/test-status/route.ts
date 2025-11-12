import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MTNMobileMoney } from '@/lib/payments/mtn'
import { AirtelMoney } from '@/lib/payments/airtel'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const transactionId = searchParams.get('transactionId')
    const method = searchParams.get('method') || 'MTN_MOBILE_MONEY'

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    try {
      let statusResponse

      if (method === 'MTN_MOBILE_MONEY') {
        const mtn = new MTNMobileMoney()
        statusResponse = await mtn.checkPaymentStatus(transactionId)
      } else {
        const airtel = new AirtelMoney()
        statusResponse = await airtel.checkPaymentStatus(transactionId)
      }

      return NextResponse.json({
        success: true,
        status: statusResponse.status,
        details: statusResponse,
      })
    } catch (error: any) {
      console.error('Status check error:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Status check failed',
          details: error.response?.data || error.message,
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Test status route error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

