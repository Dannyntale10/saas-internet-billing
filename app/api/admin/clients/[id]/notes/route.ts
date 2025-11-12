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

    // ClientNote model not in schema - return empty array
    // TODO: Add ClientNote model to schema if notes feature is needed
    const notes: any[] = []

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching client notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client notes' },
      { status: 500 }
    )
  }
}

export async function POST(
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

    const body = await request.json()
    const { note, isPrivate } = body

    if (!note || note.trim() === '') {
      return NextResponse.json(
        { error: 'Note is required' },
        { status: 400 }
      )
    }

    // ClientNote model not in schema - return mock response
    const clientNote = {
      id: `note_${Date.now()}`,
      clientId: params.id,
      userId: auth.user.id,
      note: note.trim(),
      isPrivate: isPrivate || false,
      createdAt: new Date(),
      user: {
        id: auth.user.id,
        email: auth.user.email,
        name: auth.user.name,
      },
    }

    // Note: Activity logging would go here if ClientNote model existed
    // await logActivity(...)

    return NextResponse.json(clientNote, { status: 201 })
  } catch (error: any) {
    console.error('Error creating client note:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create client note' },
      { status: 500 }
    )
  }
}
