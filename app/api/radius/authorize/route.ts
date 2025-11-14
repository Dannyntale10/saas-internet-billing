import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * FreeRADIUS Authorization Endpoint (Pre-Authentication)
 * 
 * This endpoint is called by FreeRADIUS before authentication
 * to check if a user should be allowed to proceed.
 * Useful for checking account status, limits, etc.
 * 
 * Request format:
 * {
 *   "username": "user@example.com",
 *   "nas_id": "hotspot01",
 *   "calling_station_id": "A4:3C:1E:92:11:AA"
 * }
 * 
 * Response format:
 * {
 *   "status": "OK" | "DENY",
 *   "message": "Reason for decision"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, nas_id, calling_station_id } = body

    console.log('🔍 FreeRADIUS Authorization Check:', {
      username,
      nas_id,
      mac: calling_station_id
    })

    if (!username) {
      return NextResponse.json(
        { status: 'DENY', message: 'Username is required' },
        { status: 400 }
      )
    }

    // Try to find user
    let user = await prisma.user.findUnique({
      where: { email: username.toLowerCase().trim() },
      include: {
        subscriptions: {
          where: {
            status: 'active',
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } }
            ]
          },
          take: 1
        }
      }
    })

    // If not found by email, try voucher code
    if (!user) {
      const voucher = await prisma.voucher.findFirst({
        where: {
          code: username.toUpperCase().trim(),
          status: 'ACTIVE',
          OR: [
            { validUntil: null },
            { validUntil: { gte: new Date() } }
          ]
        }
      })

      if (voucher) {
        return NextResponse.json({
          status: 'OK',
          message: 'Voucher code valid'
        }, { status: 200 })
      }

      return NextResponse.json(
        { status: 'DENY', message: 'User or voucher not found' },
        { status: 200 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { status: 'DENY', message: 'Account is inactive' },
        { status: 200 }
      )
    }

    // Check if user has active subscription or valid voucher
    const hasActiveSubscription = user.subscriptions && user.subscriptions.length > 0

    if (!hasActiveSubscription) {
      // Check for valid voucher
      const voucher = await prisma.voucher.findFirst({
        where: {
          code: username.toUpperCase().trim(),
          status: 'ACTIVE',
          OR: [
            { validUntil: null },
            { validUntil: { gte: new Date() } }
          ]
        }
      })

      if (!voucher) {
        return NextResponse.json(
          { status: 'DENY', message: 'No active subscription or valid voucher' },
          { status: 200 }
        )
      }
    }

    return NextResponse.json({
      status: 'OK',
      message: 'User authorized'
    }, { status: 200 })

  } catch (error: any) {
    console.error('❌ FreeRADIUS Authorization Error:', error)
    return NextResponse.json(
      { status: 'DENY', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

