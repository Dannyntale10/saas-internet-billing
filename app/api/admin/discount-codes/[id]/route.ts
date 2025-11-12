import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/middleware'
import { logActivity } from '@/lib/activity-log'

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

    // DiscountCode model not in schema - return error
    return NextResponse.json(
      { error: 'Discount code not found. Discount codes are not available in the current schema.' },
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

    const body = await request.json()
    const { code, type, value, minAmount, maxDiscount, usageLimit, isActive, startsAt, expiresAt } = body

    const updateData: any = {}
    if (code !== undefined) updateData.code = code.trim().toUpperCase()
    if (type !== undefined) updateData.type = type
    if (value !== undefined) updateData.value = parseFloat(value)
    if (minAmount !== undefined) updateData.minAmount = minAmount ? parseFloat(minAmount) : null
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit ? parseInt(usageLimit) : null
    if (isActive !== undefined) updateData.isActive = isActive
    if (startsAt !== undefined) updateData.startsAt = startsAt ? new Date(startsAt) : null
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null

    // DiscountCode model not in schema
    return NextResponse.json(
      { error: 'Discount code management not available' },
      { status: 501 }
    )
  } catch (error: any) {
    console.error('Error updating discount code:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Discount code already exists' },
        { status: 400 }
      )
    }
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

