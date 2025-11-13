import { PrismaClient } from '@prisma/client'
import { logger, logDatabaseQuery } from './logger'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure DATABASE_URL is set and resolve path correctly
function getDatabaseUrl(): string {
  let dbUrl = process.env.DATABASE_URL
  
  if (!dbUrl) {
    // Fallback: construct path relative to project root
    const projectRoot = process.cwd()
    const dbPath = path.join(projectRoot, 'prisma', 'dev.db')
    dbUrl = `file:${dbPath}`
    console.warn('⚠️  DATABASE_URL not set, using fallback:', dbUrl)
  } else if (dbUrl.startsWith('file:./')) {
    // Resolve relative paths
    const projectRoot = process.cwd()
    const relativePath = dbUrl.replace('file:', '')
    const absolutePath = path.resolve(projectRoot, relativePath)
    dbUrl = `file:${absolutePath}`
  }
  
  return dbUrl
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
        url: getDatabaseUrl(),
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

