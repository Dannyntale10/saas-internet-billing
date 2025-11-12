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

    // SupportTicket model not in schema - return empty array
    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching support tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
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

    // SupportTicket model not in schema
    return NextResponse.json(
      { error: 'Support ticket management not available. SupportTicket model is not in the current schema.' },
      { status: 501 }
    )
  } catch (error: any) {
    console.error('Error creating support ticket:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create support ticket' },
      { status: 500 }
    )
  }
}
