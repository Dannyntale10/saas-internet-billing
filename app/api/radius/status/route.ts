import { NextResponse } from 'next/server'

/**
 * Health check endpoint for FreeRADIUS integration
 */
export async function GET() {
  return NextResponse.json({
    status: 'OK',
    service: 'FreeRADIUS Integration',
    endpoints: {
      authorize: '/api/radius/authorize',
      authenticate: '/api/radius/authenticate',
      accounting: '/api/radius/accounting'
    },
    timestamp: new Date().toISOString()
  })
}

