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

    // DiscountCode model not in schema
    return NextResponse.json(
      { error: 'Discount code not found. DiscountCode model is not in the current schema.' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error fetching discount code:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discount code' },
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

    // DiscountCode model not in schema
    return NextResponse.json(
      { error: 'Discount code management not available' },
      { status: 501 }
    )
  } catch (error: any) {
    console.error('Error updating discount code:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update discount code' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // DiscountCode model not in schema
    return NextResponse.json(
      { error: 'Discount code management not available' },
      { status: 501 }
    )
  } catch (error) {
    console.error('Error deleting discount code:', error)
    return NextResponse.json(
      { error: 'Failed to delete discount code' },
      { status: 500 }
    )
  }
}
