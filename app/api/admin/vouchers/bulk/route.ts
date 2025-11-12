import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/middleware'
import { logActivity } from '@/lib/activity-log'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const { packageId, count, prefix, expiresAt } = body

    if (!packageId || !count) {
      return NextResponse.json(
        { error: 'Package ID and count are required' },
        { status: 400 }
      )
    }

    // Package model not in schema - get package details from voucher if available
    // For bulk generation, we'll use the provided packageId as voucher template
    // In production, you'd have a package template system
    const voucherTemplate = await prisma.voucher.findFirst({
      where: { id: packageId },
    })

    if (!voucherTemplate) {
      return NextResponse.json(
        { error: 'Package template not found. Please create a voucher first to use as template.' },
        { status: 404 }
      )
    }

    const vouchers = []
    const baseCode = prefix ? prefix.toUpperCase() : (voucherTemplate.name || 'VOUCHER').toUpperCase()

    for (let i = 0; i < parseInt(count); i++) {
      const code = `${baseCode}-${String(i + 1).padStart(6, '0')}`
      
      const voucher = await prisma.voucher.create({
        data: {
          code,
          clientId: voucherTemplate.clientId,
          name: voucherTemplate.name,
          price: voucherTemplate.price,
          timeLimit: voucherTemplate.timeLimit,
          dataLimit: voucherTemplate.dataLimit,
          speedLimit: voucherTemplate.speedLimit,
          status: 'ACTIVE',
          validFrom: new Date(),
          validUntil: expiresAt ? new Date(expiresAt) : null,
        },
      })

      vouchers.push(voucher)
    }

    // Log activity
    await logActivity(
      auth.user.id,
      'bulk_generate_vouchers',
      'Voucher',
      null,
      `Generated ${count} vouchers based on template`,
      { templateId: packageId, count, prefix },
      request
    )

    return NextResponse.json({ success: true, count: vouchers.length, vouchers }, { status: 201 })
  } catch (error: any) {
    console.error('Error generating vouchers:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Voucher code already exists. Try a different prefix.' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to generate vouchers' },
      { status: 500 }
    )
  }
}

