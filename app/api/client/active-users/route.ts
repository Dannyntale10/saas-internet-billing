import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const clientId = session.user.id

    // Get active users - users who have used vouchers in the last 24 hours
    // or have active usage logs
    const activeUsageLogs = await prisma.usageLog.findMany({
      where: {
        voucher: {
          clientId: clientId,
        },
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        voucher: {
          select: {
            id: true,
            code: true,
            name: true,
            timeLimit: true,
            dataLimit: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 100,
    })

    // Group by user to get unique active users
    const activeUsersMap = new Map()
    activeUsageLogs.forEach((log) => {
      if (log.user) {
        const userId = log.user.id
        if (!activeUsersMap.has(userId)) {
          activeUsersMap.set(userId, {
            user: log.user,
            voucher: log.voucher,
            lastActivity: log.timestamp,
            dataUsed: log.dataUsed,
            duration: log.duration,
            ipAddress: log.ipAddress,
            macAddress: log.macAddress,
          })
        } else {
          // Update if this is more recent
          const existing = activeUsersMap.get(userId)
          if (new Date(log.timestamp) > new Date(existing.lastActivity)) {
            existing.lastActivity = log.timestamp
            existing.dataUsed = log.dataUsed
            existing.duration = log.duration
            existing.ipAddress = log.ipAddress
            existing.macAddress = log.macAddress
            existing.voucher = log.voucher
          }
        }
      }
    })

    const activeUsers = Array.from(activeUsersMap.values())

    // Also get users with active vouchers (USED status but not expired)
    const activeVouchers = await prisma.voucher.findMany({
      where: {
        clientId: clientId,
        status: 'USED',
        usedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Used in last 7 days
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        usedAt: 'desc',
      },
      take: 50,
    })

    // Combine and deduplicate
    const allActiveUsers = new Map()
    
    // Add from usage logs
    activeUsers.forEach((item) => {
      if (item.user) {
        allActiveUsers.set(item.user.id, item)
      }
    })

    // Add from active vouchers
    activeVouchers.forEach((voucher) => {
      if (voucher.user && !allActiveUsers.has(voucher.user.id)) {
        allActiveUsers.set(voucher.user.id, {
          user: voucher.user,
          voucher: {
            id: voucher.id,
            code: voucher.code,
            name: voucher.name,
            timeLimit: voucher.timeLimit,
            dataLimit: voucher.dataLimit,
          },
          lastActivity: voucher.usedAt,
          dataUsed: 0,
          duration: 0,
        })
      }
    })

    return NextResponse.json({
      activeUsers: Array.from(allActiveUsers.values()),
      totalActive: allActiveUsers.size,
    })
  } catch (error) {
    console.error('Error fetching active users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch active users' },
      { status: 500 }
    )
  }
}

