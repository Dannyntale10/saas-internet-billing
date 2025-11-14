import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return mock notifications
    // In production, you'd store these in a database
    const notifications = [
      {
        id: '1',
        type: 'success',
        title: 'Payment Received',
        message: 'Payment of 10,000 UGX has been received',
        timestamp: new Date(),
        read: false,
      },
      {
        id: '2',
        type: 'info',
        title: 'New User Registered',
        message: 'A new user has registered',
        timestamp: new Date(Date.now() - 3600000),
        read: false,
      },
    ]

    const unreadCount = notifications.filter((n) => !n.read).length

    return NextResponse.json({
      notifications,
      unreadCount,
    })

  } catch (error: any) {
    console.error('Notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications', notifications: [], unreadCount: 0 },
      { status: 500 }
    )
  }
}

