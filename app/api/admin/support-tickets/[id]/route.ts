import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      { error: 'Support ticket not found. SupportTicket model is not in the current schema.' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error fetching support ticket:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support ticket' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      { error: 'Support ticket management not available' },
      { status: 501 }
    )
  } catch (error: any) {
    console.error('Error updating support ticket:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update support ticket' },
      { status: 500 }
    )
  }
}
