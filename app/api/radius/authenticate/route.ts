import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * FreeRADIUS Authentication Endpoint
 * 
 * This endpoint is called by FreeRADIUS when a user tries to authenticate.
 * FreeRADIUS sends user credentials and we respond with access decision and limits.
 * 
 * Request format (from FreeRADIUS via rlm_rest module):
 * {
 *   "username": "user@example.com",
 *   "password": "userpassword",
 *   "mac": "A4:3C:1E:92:11:AA",
 *   "nas_id": "hotspot01",
 *   "nas_ip": "192.168.1.1",
 *   "called_station_id": "00:11:22:33:44:55",
 *   "calling_station_id": "A4:3C:1E:92:11:AA"
 * }
 * 
 * Response format (RADIUS attributes):
 * {
 *   "status": "OK" | "DENY",
 *   "session_time": 3600,  // seconds
 *   "download_limit": 512000,  // bytes per second (kbps)
 *   "upload_limit": 256000,  // bytes per second (kbps)
 *   "data_limit": 1073741824,  // bytes (1GB)
 *   "message": "Access granted"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, mac, nas_id, nas_ip, called_station_id, calling_station_id } = body

    console.log('🔐 FreeRADIUS Authentication Request:', {
      username,
      mac,
      nas_id,
      nas_ip,
      timestamp: new Date().toISOString()
    })

    // Validate required fields
    if (!username) {
      return NextResponse.json(
        { status: 'DENY', message: 'Username is required' },
        { status: 400 }
      )
    }

    // Try to find user by email or voucher code
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
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        vouchers: {
          where: {
            code: username.toUpperCase().trim(),
            status: 'ACTIVE',
            OR: [
              { validUntil: null },
              { validUntil: { gte: new Date() } }
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
        },
        include: {
          client: true
        }
      })

      if (voucher) {
        // Create temporary user for voucher or use voucher's client
        // For now, we'll use the voucher's client as the user
        user = voucher.client
        if (user) {
          // Attach voucher to user object for later use
          ;(user as any).activeVoucher = voucher
        }
      }
    }

    // User not found
    if (!user) {
      console.log('❌ User not found:', username)
      return NextResponse.json(
        { status: 'DENY', message: 'Invalid username or voucher code' },
        { status: 200 } // Return 200 so FreeRADIUS gets the DENY status
      )
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ User account is inactive:', username)
      return NextResponse.json(
        { status: 'DENY', message: 'Account is inactive' },
        { status: 200 }
      )
    }

    // Verify password (if provided and user has password)
    if (password && user.password) {
      const isValid = await bcrypt.compare(password, user.password)
      if (!isValid) {
        console.log('❌ Invalid password for:', username)
        return NextResponse.json(
          { status: 'DENY', message: 'Invalid password' },
          { status: 200 }
        )
      }
    }

    // For vouchers, check if already used
    const activeVoucher = (user as any).activeVoucher
    if (activeVoucher) {
      if (activeVoucher.usedBy && activeVoucher.usedBy !== user.id) {
        console.log('❌ Voucher already used:', username)
        return NextResponse.json(
          { status: 'DENY', message: 'Voucher already used' },
          { status: 200 }
        )
      }
    }

    // Get active subscription or voucher limits
    let sessionTime = 3600 // Default: 1 hour
    let downloadLimit = 512000 // Default: 512 kbps
    let uploadLimit = 256000 // Default: 256 kbps
    let dataLimit = 1073741824 // Default: 1GB in bytes

    // Check subscription limits
    if (user.subscriptions && user.subscriptions.length > 0) {
      const subscription = user.subscriptions[0]
      if (subscription.timeLimit) {
        sessionTime = subscription.timeLimit * 3600 // Convert hours to seconds
      }
      if (subscription.speedLimit) {
        downloadLimit = subscription.speedLimit * 125000 // Convert Mbps to bytes/sec (Mbps * 125000)
        uploadLimit = subscription.speedLimit * 125000
      }
      if (subscription.dataLimit) {
        dataLimit = subscription.dataLimit * 1073741824 // Convert GB to bytes
      }
    }

    // Check voucher limits (override subscription if voucher exists)
    if (activeVoucher) {
      if (activeVoucher.timeLimit) {
        sessionTime = activeVoucher.timeLimit * 3600 // Convert hours to seconds
      }
      if (activeVoucher.speedLimit) {
        downloadLimit = activeVoucher.speedLimit * 125000 // Convert Mbps to bytes/sec
        uploadLimit = activeVoucher.speedLimit * 125000
      }
      if (activeVoucher.dataLimit) {
        dataLimit = activeVoucher.dataLimit * 1073741824 // Convert GB to bytes
      }
    }

    // Create or update session record
    const sessionId = `radius_${user.id}_${Date.now()}`
    await prisma.session.upsert({
      where: { sessionToken: sessionId },
      update: {
        expires: new Date(Date.now() + sessionTime * 1000),
        updatedAt: new Date()
      },
      create: {
        sessionToken: sessionId,
        userId: user.id,
        expires: new Date(Date.now() + sessionTime * 1000)
      }
    })

    // Mark voucher as used if it's a voucher login
    if (activeVoucher && !activeVoucher.usedBy) {
      await prisma.voucher.update({
        where: { id: activeVoucher.id },
        data: {
          usedBy: user.id,
          usedAt: new Date(),
          status: 'USED'
        }
      })
    }

    console.log('✅ Authentication successful:', {
      username,
      sessionTime,
      downloadLimit,
      uploadLimit,
      dataLimit
    })

    // Return access-accept with limits
    return NextResponse.json({
      status: 'OK',
      session_time: sessionTime,
      download_limit: downloadLimit,
      upload_limit: uploadLimit,
      data_limit: dataLimit,
      message: 'Access granted',
      // Additional RADIUS attributes
      session_id: sessionId,
      user_id: user.id
    }, { status: 200 })

  } catch (error: any) {
    console.error('❌ FreeRADIUS Authentication Error:', error)
    return NextResponse.json(
      { status: 'DENY', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

