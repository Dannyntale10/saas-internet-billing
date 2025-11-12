import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'

/**
 * Unified authentication middleware using NextAuth
 * Replaces legacy token-based authentication
 */
export async function verifyAuth(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return { error: 'Unauthorized', status: 401 }
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, role: true, isActive: true, parentClientId: true }
    })

    if (!user) {
      return { error: 'User not found', status: 401 }
    }

    if (!user.isActive) {
      return { error: 'Account is inactive', status: 403 }
    }

    return { 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        parentClientId: user.parentClientId,
      },
      session 
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { error: 'Authentication failed', status: 401 }
  }
}

/**
 * Verify admin access
 */
export async function verifyAdmin(request: NextRequest) {
  const auth = await verifyAuth(request)
  
  if ('error' in auth) {
    return auth
  }

  if (auth.user.role !== 'ADMIN') {
    return { error: 'Access denied. Admin privileges required.', status: 403 }
  }

  return auth
}

/**
 * Verify client access
 */
export async function verifyClient(request: NextRequest) {
  const auth = await verifyAuth(request)
  
  if ('error' in auth) {
    return auth
  }

  if (auth.user.role !== 'CLIENT') {
    return { error: 'Access denied. Client privileges required.', status: 403 }
  }

  return auth
}

/**
 * Verify end-user access
 */
export async function verifyEndUser(request: NextRequest) {
  const auth = await verifyAuth(request)
  
  if ('error' in auth) {
    return auth
  }

  if (auth.user.role !== 'END_USER') {
    return { error: 'Access denied. End-user privileges required.', status: 403 }
  }

  return auth
}

/**
 * Verify client or admin access
 */
export async function verifyClientOrAdmin(request: NextRequest) {
  const auth = await verifyAuth(request)
  
  if ('error' in auth) {
    return auth
  }

  if (auth.user.role !== 'CLIENT' && auth.user.role !== 'ADMIN') {
    return { error: 'Access denied. Client or Admin privileges required.', status: 403 }
  }

  return auth
}

/**
 * Standardized error response helper
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { error: message, timestamp: new Date().toISOString() },
    { status }
  )
}

/**
 * Standardized success response helper
 */
export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status })
}

/**
 * Standardized unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return errorResponse(message, 401)
}

/**
 * Standardized forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden') {
  return errorResponse(message, 403)
}

/**
 * Standardized not found response
 */
export function notFoundResponse(message: string = 'Resource not found') {
  return errorResponse(message, 404)
}

/**
 * Standardized server error response
 */
export function serverErrorResponse(message: string = 'Internal server error') {
  return errorResponse(message, 500)
}
