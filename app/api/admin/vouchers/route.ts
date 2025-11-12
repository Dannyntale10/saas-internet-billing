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
      include: {
        client: { select: { id: true, name: true, email: true } },
        payment: { select: { id: true, status: true, amount: true } },
      },
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

    const { code, name, clientId, price, dataLimit, timeLimit, speedLimit, validUntil } = await request.json()

    if (!code || !clientId || price === undefined) {
      return NextResponse.json(
        { error: 'Code, client ID, and price are required' },
        { status: 400 }
      )
    }

    const voucher = await prisma.voucher.create({
      data: {
        code: code.toUpperCase(),
        name: name || null,
        clientId,
        price: parseFloat(price),
        dataLimit: dataLimit ? parseFloat(dataLimit) : null,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        speedLimit: speedLimit ? parseInt(speedLimit) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
      },
    })

    // Log activity
    await logActivity({
      userId: auth.user.id,
      action: 'create_voucher',
      entityType: 'Voucher',
      entityId: voucher.id,
      description: `Created voucher: ${voucher.code}`,
      metadata: { voucherId: voucher.id, code: voucher.code, clientId },
      request,
    })

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

