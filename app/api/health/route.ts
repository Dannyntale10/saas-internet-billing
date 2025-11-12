import { NextRequest, NextResponse } from 'next/server'
import { getSystemHealth, getDatabaseStats } from '@/lib/monitoring'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const health = await getSystemHealth()
    const dbStats = await getDatabaseStats()

    const isHealthy = 
      health.database.status === 'healthy' &&
      health.memory.percentage < 90 &&
      health.requests.errors / Math.max(health.requests.total, 1) < 0.1

    const statusCode = isHealthy ? 200 : 503

    return NextResponse.json(
      {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: health.timestamp,
        uptime: health.uptime,
        database: {
          status: health.database.status,
          responseTime: health.database.responseTime,
          stats: dbStats,
        },
        memory: {
          used: `${(health.memory.used / 1024 / 1024).toFixed(2)} MB`,
          total: `${(health.memory.total / 1024 / 1024).toFixed(2)} MB`,
          percentage: `${health.memory.percentage.toFixed(2)}%`,
        },
        requests: {
          total: health.requests.total,
          errors: health.requests.errors,
          errorRate: `${((health.requests.errors / Math.max(health.requests.total, 1)) * 100).toFixed(2)}%`,
          averageResponseTime: `${health.requests.averageResponseTime.toFixed(2)}ms`,
        },
      },
      { status: statusCode }
    )
  } catch (error) {
    logger.error('Health check failed', { error })
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
      },
      { status: 503 }
    )
  }
}

