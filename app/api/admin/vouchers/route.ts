import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/middleware'
import { logActivity } from '@/lib/activity-log'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const vouchers = await prisma.voucher.findMany({
      include: { package: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(vouchers)
  } catch (error) {
    console.error('Error fetching vouchers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vouchers' },
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

    const { code, packageId, expiresAt } = await request.json()

    if (!code || !packageId) {
      return NextResponse.json(
        { error: 'Code and package ID are required' },
        { status: 400 }
      )
    }

    const voucher = await prisma.voucher.create({
      data: {
        code: code.toUpperCase(),
        packageId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: { package: true },
    })

    // Log activity
    await logActivity(
      auth.user.id,
      'create_voucher',
      'Voucher',
      voucher.id,
      `Created voucher: ${voucher.code}`,
      { voucherId: voucher.id, code: voucher.code, packageId },
      request
    )

    return NextResponse.json(voucher, { status: 201 })
  } catch (error: any) {
    console.error('Error creating voucher:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Voucher code already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create voucher' },
      { status: 500 }
    )
  }
}

