import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/middleware'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; packageId: string } }
) {
  try {
    const auth = await verifyAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    // ClientPackage model not in schema - packages are managed via vouchers
    return NextResponse.json(
      { 
        message: 'Packages are managed via vouchers. Please use the vouchers API.',
        redirect: `/admin/vouchers?clientId=${params.id}`
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating client package:', error)
    return NextResponse.json(
      { error: 'Failed to update client package' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; packageId: string } }
) {
  try {
    const auth = await verifyAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    // ClientPackage model not in schema
    return NextResponse.json(
      { message: 'Packages are managed via vouchers' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching client package:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client package' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; packageId: string } }
) {
  try {
    const auth = await verifyAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    // ClientPackage model not in schema
    return NextResponse.json(
      { message: 'Packages are managed via vouchers. Please delete vouchers instead.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting client package:', error)
    return NextResponse.json(
      { error: 'Failed to delete client package' },
      { status: 500 }
    )
  }
}
