import { prisma } from './prisma'
import { NextRequest } from 'next/server'
import { logger } from './logger'

interface LogActivityParams {
  userId: string
  action: string
  entityType: string
  entityId?: string | null
  description: string
  metadata?: any
  request?: NextRequest
}

/**
 * Log user activity for audit trail
 */
export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  description,
  metadata,
  request,
}: LogActivityParams) {
  try {
    const ipAddress = request?.headers.get('x-forwarded-for') || 
                     request?.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request?.headers.get('user-agent') || 'unknown'

    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId: entityId || null,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    // Don't throw - logging failures shouldn't break the app
    console.error('Failed to log activity:', error)
  }
}

/**
 * Get activity logs for a user
 */
export async function getActivityLogs(
  userId: string,
  options: {
    limit?: number
    offset?: number
    action?: string
    entityType?: string
  } = {}
) {
  const { limit = 50, offset = 0, action, entityType } = options

  const where: any = { userId }
  if (action) where.action = action
  if (entityType) where.entityType = entityType

  return prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })
}
