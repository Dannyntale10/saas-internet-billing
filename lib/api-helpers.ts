import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin, verifyClient, verifyAuth, errorResponse, successResponse } from './middleware'
import { logActivity } from './activity-log'

/**
 * Standard API route wrapper with authentication and error handling
 */
export async function withAuth<T>(
  request: NextRequest,
  handler: (auth: { user: any; session: any }, request: NextRequest) => Promise<T>,
  options: {
    requireAdmin?: boolean
    requireClient?: boolean
    logActivity?: {
      action: string
      entityType: string
      getEntityId?: (result: T) => string | null
      getDescription?: (result: T) => string
    }
  } = {}
) {
  try {
    // Authenticate
    let auth
    if (options.requireAdmin) {
      auth = await verifyAdmin(request)
    } else if (options.requireClient) {
      auth = await verifyClient(request)
    } else {
      auth = await verifyAuth(request)
    }

    if ('error' in auth) {
      return errorResponse(auth.error || 'Authentication failed', auth.status)
    }

    // Execute handler
    const result = await handler(auth, request)

    // Log activity if configured
    if (options.logActivity) {
      const entityId = options.logActivity.getEntityId?.(result) || null
      const description = options.logActivity.getDescription?.(result) || 
                         `${options.logActivity.action} ${options.logActivity.entityType}`

      await logActivity({
        userId: auth.user.id,
        action: options.logActivity.action,
        entityType: options.logActivity.entityType,
        entityId,
        description,
        request,
      })
    }

    return successResponse(result)
  } catch (error: any) {
    console.error('API Error:', error)
    return errorResponse(
      error.message || 'Internal server error',
      error.statusCode || 500
    )
  }
}

/**
 * Validate request body with Zod schema
 */
export function validateRequest<T>(
  request: NextRequest,
  schema: any
): Promise<T> {
  return request.json().then((data) => {
    const result = schema.safeParse(data)
    if (!result.success) {
      throw new Error(`Validation error: ${result.error.message}`)
    }
    return result.data as T
  })
}

/**
 * Get pagination parameters from request
 */
export function getPagination(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

/**
 * Get date range from request
 */
export function getDateRange(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  return {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  }
}

