import { NextRequest, NextResponse } from 'next/server'
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

    // Referral model not in schema - return empty array
    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching referrals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referrals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    // Referral model not in schema
    return NextResponse.json(
      { error: 'Referral management not available. Referral model is not in the current schema.' },
      { status: 501 }
    )
  } catch (error: any) {
    console.error('Error creating referral:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create referral' },
      { status: 500 }
    )
  }
}
