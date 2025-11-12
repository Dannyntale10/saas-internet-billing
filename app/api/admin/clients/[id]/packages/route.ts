import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/middleware'

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
    const { packageId } = body

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      )
    }

    // ClientPackage and Package models not in schema
    // Packages are managed via vouchers
    // Return success message directing to voucher management
    return NextResponse.json(
      { 
        message: 'Packages are managed via vouchers. Please create vouchers for this client instead.',
        redirect: `/admin/vouchers?clientId=${params.id}`
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error assigning package:', error)
    return NextResponse.json(
      { error: 'Failed to assign package' },
      { status: 500 }
    )
  }
}
