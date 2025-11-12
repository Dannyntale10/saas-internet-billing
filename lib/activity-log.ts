import { prisma } from './prisma'
import { NextRequest } from 'next/server'

export async function logActivity(
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  description: string,
  metadata?: any,
  request?: NextRequest
) {
  try {
    const ipAddress = request?.headers.get('x-forwarded-for') || 
                     request?.headers.get('x-real-ip') || 
                     null
    const userAgent = request?.headers.get('user-agent') || null

    await prisma.activityLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: entityId || null,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    })
  } catch (error) {
    console.error('Error logging activity:', error)
    // Don't throw - activity logging shouldn't break the main flow
  }
}

