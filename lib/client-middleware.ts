import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getSession } from './auth'

export async function verifyClient(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('clientToken')?.value ||
                  new URL(request.url).searchParams.get('token')

    if (!token) {
      return { error: 'Unauthorized', status: 401 }
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return { error: 'Invalid token', status: 401 }
    }

    const session = await getSession(token)
    if (!session || session.expiresAt < new Date()) {
      return { error: 'Session expired', status: 401 }
    }

    // Check if user is active
    if (!session.user.isActive) {
      return { error: 'Account is inactive', status: 403 }
    }

    return { user: session.user, session }
  } catch (error) {
    return { error: 'Authentication failed', status: 401 }
  }
}

