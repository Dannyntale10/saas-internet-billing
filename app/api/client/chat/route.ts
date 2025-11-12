import { NextRequest, NextResponse } from 'next/server'
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

    // ChatMessage model not in schema - return empty array
    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyClient(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    // ChatMessage model not in schema
    return NextResponse.json(
      { error: 'Chat functionality not available. ChatMessage model is not in the current schema.' },
      { status: 501 }
    )
  } catch (error: any) {
    console.error('Error sending chat message:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    )
  }
}
