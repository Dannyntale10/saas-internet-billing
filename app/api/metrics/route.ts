import { NextRequest, NextResponse } from 'next/server'
import { getSystemHealth, getDatabaseStats } from '@/lib/monitoring'
import { verifyAdmin } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const health = await getSystemHealth()
    const dbStats = await getDatabaseStats()

    return NextResponse.json({
      system: {
        uptime: health.uptime,
        memory: health.memory,
        database: health.database,
      },
      requests: health.requests,
      database: dbStats,
      timestamp: health.timestamp,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

