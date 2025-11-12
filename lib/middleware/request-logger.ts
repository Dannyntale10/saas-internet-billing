import { NextRequest, NextResponse } from 'next/server'
import { logger, logRequest } from '@/lib/logger'

export function requestLogger(request: NextRequest) {
  const startTime = Date.now()
  
  // Log request details
  const requestData = {
    method: request.method,
    url: request.url,
    pathname: new URL(request.url).pathname,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
  }

  logger.debug('Incoming request', requestData)

  return {
    logResponse: (response: NextResponse) => {
      const responseTime = Date.now() - startTime
      logRequest(
        {
          method: request.method,
          url: request.url,
          ip: requestData.ip,
          headers: Object.fromEntries(request.headers.entries()),
        } as any,
        {
          statusCode: response.status,
        } as any,
        responseTime
      )
    },
  }
}

