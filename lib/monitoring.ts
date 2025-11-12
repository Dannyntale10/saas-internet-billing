import { prisma } from './prisma'
import { logger } from './logger'

interface SystemMetrics {
  timestamp: Date
  database: {
    status: 'healthy' | 'degraded' | 'down'
    responseTime: number
    connections?: number
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  uptime: number
  requests: {
    total: number
    errors: number
    averageResponseTime: number
  }
}

// In-memory metrics store (use Redis or time-series DB in production)
const metricsStore = {
  requests: [] as Array<{ timestamp: number; responseTime: number; statusCode: number }>,
  errors: [] as Array<{ timestamp: number; error: string }>,
}

export async function getSystemHealth(): Promise<SystemMetrics> {
  const startTime = Date.now()
  
  // Check database health
  let dbStatus: 'healthy' | 'degraded' | 'down' = 'healthy'
  let dbResponseTime = 0
  
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    dbResponseTime = Date.now() - dbStart
    
    if (dbResponseTime > 1000) {
      dbStatus = 'degraded'
    }
  } catch (error) {
    dbStatus = 'down'
    logger.error('Database health check failed', { error })
  }

  // Memory usage
  const memUsage = process.memoryUsage()
  const totalMemory = memUsage.heapTotal
  const usedMemory = memUsage.heapUsed
  const memoryPercentage = (usedMemory / totalMemory) * 100

  // Calculate request metrics
  const now = Date.now()
  const last5Minutes = metricsStore.requests.filter(r => now - r.timestamp < 5 * 60 * 1000)
  const totalRequests = last5Minutes.length
  const errors = last5Minutes.filter(r => r.statusCode >= 400).length
  const averageResponseTime = last5Minutes.length > 0
    ? last5Minutes.reduce((sum, r) => sum + r.responseTime, 0) / last5Minutes.length
    : 0

  return {
    timestamp: new Date(),
    database: {
      status: dbStatus,
      responseTime: dbResponseTime,
    },
    memory: {
      used: usedMemory,
      total: totalMemory,
      percentage: memoryPercentage,
    },
    uptime: process.uptime(),
    requests: {
      total: totalRequests,
      errors,
      averageResponseTime,
    },
  }
}

export function recordRequest(responseTime: number, statusCode: number) {
  const now = Date.now()
  metricsStore.requests.push({ timestamp: now, responseTime, statusCode })
  
  // Keep only last hour of data
  const oneHourAgo = now - 60 * 60 * 1000
  metricsStore.requests = metricsStore.requests.filter(r => r.timestamp > oneHourAgo)
}

export function recordError(error: string) {
  const now = Date.now()
  metricsStore.errors.push({ timestamp: now, error })
  
  // Keep only last 24 hours of errors
  const oneDayAgo = now - 24 * 60 * 60 * 1000
  metricsStore.errors = metricsStore.errors.filter(e => e.timestamp > oneDayAgo)
}

export async function getDatabaseStats() {
  try {
    const [
      totalUsers,
      totalClients,
      totalVouchers,
      totalPayments,
      activeConnections,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.voucher.count(),
      prisma.payment.count(),
      prisma.voucher.count({ where: { status: 'ACTIVE' } }),
    ])

    return {
      totalUsers,
      totalClients,
      totalVouchers,
      totalPayments,
      activeConnections,
    }
  } catch (error) {
    logger.error('Failed to get database stats', { error })
    return null
  }
}

// Performance monitoring
export function performanceMonitor(operation: string) {
  const startTime = Date.now()
  
  return {
    end: (success: boolean = true) => {
      const duration = Date.now() - startTime
      if (duration > 1000) {
        logger.warn('Slow operation detected', {
          operation,
          duration: `${duration}ms`,
          success,
        })
      } else {
        logger.debug('Operation completed', {
          operation,
          duration: `${duration}ms`,
          success,
        })
      }
      return duration
    },
  }
}

