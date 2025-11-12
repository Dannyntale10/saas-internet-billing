import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get client IP and MAC from headers (set by router/captive portal)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               request.ip ||
               'Unknown'

    const mac = request.headers.get('x-mac-address') || 'Unknown'

    return NextResponse.json({
      ip,
      mac,
    })
  } catch (error) {
    console.error('Error fetching user info:', error)
    return NextResponse.json(
      { ip: 'Unknown', mac: 'Unknown' },
      { status: 200 }
    )
  }
}

