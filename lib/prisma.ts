import { PrismaClient } from '@prisma/client'
import { logger, logDatabaseQuery } from './logger'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced Prisma client with logging and connection pooling
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ]
      : [{ emit: 'event', level: 'error' }],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Log database queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    const duration = e.duration || 0
    logDatabaseQuery(e.query, duration, e.params)
  })

  prisma.$on('error' as never, (e: any) => {
    logger.error('Database error', { error: e.message, target: e.target })
  })
}

// Connection pooling and optimization
if (process.env.NODE_ENV === 'production') {
  // Optimize connection pool for production
  // SQLite doesn't support connection pooling, but we can optimize queries
  prisma.$connect().catch((error) => {
    logger.error('Failed to connect to database', { error })
  })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

