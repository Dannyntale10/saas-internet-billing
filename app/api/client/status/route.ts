import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyClient } from '@/lib/client-middleware'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyClient(request)
    if ('error' in auth) {
      // Not logged in, return guest status
      return NextResponse.json({
        isLoggedIn: false,
        hasActiveConnection: false,
      })
    }

    const userId = auth.user.id

    // Check for active subscriptions (Subscription model not in schema, skip for now)
    const activeSubscription = null

    // Check for active payments (transactions are payments in current schema)
    // Active connection is determined by active vouchers
    const activeVoucher = await prisma.voucher.findFirst({
      where: {
        usedBy: userId,
        status: 'ACTIVE',
        OR: [
          { validUntil: { gt: new Date() } },
          { validUntil: null },
        ],
      },
      orderBy: { usedAt: 'desc' },
    })

    // Get usage statistics
    const usageLogs = await prisma.usageLog.findMany({
      where: {
        userId,
        timestamp: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    })

    const totalBytesToday = usageLogs.reduce((sum, log) => {
      const upload = Number(log.uploadBytes || 0)
      const download = Number(log.downloadBytes || 0)
      return sum + upload + download
    }, 0)

    return NextResponse.json({
      isLoggedIn: true,
      hasActiveConnection: !!(activeSubscription || activeVoucher),
      activeSubscription: activeSubscription ? {
        id: activeSubscription.id,
        package: activeSubscription.package?.name || 'Unknown',
        expiresAt: activeSubscription.expiresAt,
        timeRemaining: Math.max(0, Math.floor((new Date(activeSubscription.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))), // Hours
      } : null,
      activeVoucher: activeVoucher ? {
        id: activeVoucher.id,
        package: activeVoucher.name || activeVoucher.code,
        expiresAt: activeVoucher.validUntil,
        timeRemaining: activeVoucher.validUntil
          ? Math.max(0, Math.floor((new Date(activeVoucher.validUntil).getTime() - Date.now()) / (1000 * 60 * 60)))
          : null,
      } : null,
      usageToday: {
        bytes: totalBytesToday,
        formatted: formatBytes(totalBytesToday),
        sessions: usageLogs.length,
      },
    })
  } catch (error) {
    console.error('Error fetching client status:', error)
    return NextResponse.json({
      isLoggedIn: false,
      hasActiveConnection: false,
    })
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

