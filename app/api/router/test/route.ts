import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MikroTikRouter } from '@/lib/router/mikrotik'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const config = await prisma.routerConfig.findUnique({
      where: { userId: session.user.id }
    })

    if (!config) {
      return NextResponse.json(
        { error: 'Router configuration not found' },
        { status: 404 }
      )
    }

    // Note: In production, you would decrypt the password
    // For now, we'll use a placeholder - you'll need to implement proper decryption
    // or use a different approach for password storage
    
    // This is a simplified test - in production, implement actual RouterOS connection
    const router = new MikroTikRouter({
      host: config.host,
      port: config.port,
      username: config.username,
      password: '', // Would need to decrypt
    })

    const connected = await router.connect()

    return NextResponse.json({
      connected,
      message: connected 
        ? 'Successfully connected to router' 
        : 'Failed to connect to router'
    })
  } catch (error) {
    console.error('Router test error:', error)
    return NextResponse.json(
      { error: 'Internal server error', connected: false },
      { status: 500 }
    )
  }
}

