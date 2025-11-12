import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const startTime = Date.now()
  const url = request.nextUrl.clone()

  // Security headers (additional to next.config.js)
  const response = NextResponse.next()
  
  // Add request ID for tracing
  const requestId = crypto.randomUUID()
  response.headers.set('X-Request-ID', requestId)

  // Log response time
  const responseTime = Date.now() - startTime
  response.headers.set('X-Response-Time', `${responseTime}ms`)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

