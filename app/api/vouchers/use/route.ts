import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Voucher code is required' },
        { status: 400 }
      )
    }

    // Find voucher
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    if (!voucher) {
      return NextResponse.json(
        { error: 'Invalid voucher code' },
        { status: 404 }
      )
    }

    if (voucher.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Voucher is ${voucher.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Check if expired
    if (voucher.validUntil && new Date(voucher.validUntil) < new Date()) {
      // Update status to expired
      await prisma.voucher.update({
        where: { id: voucher.id },
        data: { status: 'EXPIRED' }
      })
      return NextResponse.json(
        { error: 'Voucher has expired' },
        { status: 400 }
      )
    }

    // Mark voucher as used
    await prisma.voucher.update({
      where: { id: voucher.id },
      data: { 
        status: 'USED',
        usedAt: new Date()
      }
    })

    // Create payment record
    await prisma.payment.create({
      data: {
        userId: voucher.clientId,
        voucherId: voucher.id,
        amount: voucher.price,
        currency: voucher.currency,
        status: 'COMPLETED',
        method: 'VOUCHER',
      }
    })

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: voucher.clientId,
          action: 'VOUCHER_USED',
          entityType: 'Voucher',
          entityId: voucher.id,
          description: `Voucher ${voucher.code} was used`,
          metadata: JSON.stringify({
            voucherId: voucher.id,
            voucherCode: voucher.code,
          })
        }
      })
    } catch (logError) {
      // ActivityLog might fail, continue anyway
      console.log('Activity log creation skipped:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Voucher activated successfully! You can now access the internet.',
      voucher: {
        code: voucher.code,
        name: voucher.name,
        timeLimit: voucher.timeLimit,
        dataLimit: voucher.dataLimit,
        speedLimit: voucher.speedLimit,
      }
    })
  } catch (error: any) {
    console.error('Error using voucher:', error)
    return NextResponse.json(
      { 
        error: 'Failed to activate voucher',
        message: error.message || 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
