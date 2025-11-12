import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Voucher code is required' },
        { status: 400 }
      )
    }

    // Find voucher
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!voucher) {
      return NextResponse.json(
        { error: 'Invalid voucher code' },
        { status: 404 }
      )
    }

    if (voucher.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Voucher is not active' },
        { status: 400 }
      )
    }

    // Check if expired
    if (voucher.validUntil && new Date(voucher.validUntil) < new Date()) {
      await prisma.voucher.update({
        where: { id: voucher.id },
        data: { status: 'EXPIRED' },
      })
      return NextResponse.json(
        { error: 'Voucher has expired' },
        { status: 400 }
      )
    }

    // Mark as used (in production, you'd create a session here)
    await prisma.voucher.update({
      where: { id: voucher.id },
      data: {
        status: 'USED',
        usedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Voucher activated successfully',
      voucher: {
        id: voucher.id,
        name: voucher.name,
        timeLimit: voucher.timeLimit,
        dataLimit: voucher.dataLimit,
        speedLimit: voucher.speedLimit,
      },
    })
  } catch (error) {
    console.error('Error using voucher:', error)
    return NextResponse.json(
      { error: 'Failed to activate voucher' },
      { status: 500 }
    )
  }
}

