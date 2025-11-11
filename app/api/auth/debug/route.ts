import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    }

    // Check session
    const session = await getServerSession(authOptions)

    // Check database connection
    let dbCheck = { connected: false, error: null as string | null }
    try {
      await prisma.$queryRaw`SELECT 1`
      dbCheck.connected = true
    } catch (error: any) {
      dbCheck.error = error.message
    }

    // Check admin user
    let adminCheck = { exists: false, count: 0, error: null as string | null }
    try {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
      adminCheck.exists = adminCount > 0
      adminCheck.count = adminCount
    } catch (error: any) {
      adminCheck.error = error.message
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      session: {
        authenticated: !!session,
        user: session?.user || null,
      },
      database: dbCheck,
      admin: adminCheck,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

