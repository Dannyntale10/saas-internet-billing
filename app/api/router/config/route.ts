import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const configSchema = z.object({
  routerType: z.enum(['MIKROTIK', 'FREERADIUS']).optional(),
  host: z.string().min(1),
  port: z.number().int().positive(),
  username: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  apiPort: z.number().int().positive().optional(),
  radiusSecret: z.string().optional(),
  nasId: z.string().optional(),
  apiUrl: z.string().url().optional(),
})

export async function GET(req: NextRequest) {
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
      return NextResponse.json({ config: null })
    }

    return NextResponse.json({
      config: {
        ...config,
        password: undefined, // Never return password
        radiusSecret: undefined, // Never return secret
      }
    })
  } catch (error) {
    console.error('Config fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const data = configSchema.parse(body)

    const routerType = data.routerType || 'MIKROTIK'
    
    // Prepare update/create data
    const configData: any = {
      routerType,
      host: data.host,
      port: data.port,
      apiPort: data.apiPort || data.port,
      isActive: true,
    }

    // MikroTik specific fields
    if (routerType === 'MIKROTIK') {
      if (!data.username || !data.password) {
        return NextResponse.json(
          { error: 'Username and password are required for MikroTik' },
          { status: 400 }
        )
      }
      const encryptedPassword = await bcrypt.hash(data.password, 10)
      configData.username = data.username
      configData.password = encryptedPassword
    }

    // FreeRADIUS specific fields
    if (routerType === 'FREERADIUS') {
      if (!data.radiusSecret || !data.nasId || !data.apiUrl) {
        return NextResponse.json(
          { error: 'RADIUS secret, NAS ID, and API URL are required for FreeRADIUS' },
          { status: 400 }
        )
      }
      const encryptedSecret = await bcrypt.hash(data.radiusSecret, 10)
      configData.radiusSecret = encryptedSecret
      configData.nasId = data.nasId
      configData.apiUrl = data.apiUrl
      // Store placeholder values for compatibility
      configData.username = data.nasId
      configData.password = encryptedSecret
    }

    // Upsert configuration
    const config = await prisma.routerConfig.upsert({
      where: { userId: session.user.id },
      update: configData,
      create: {
        userId: session.user.id,
        ...configData,
      }
    })

    return NextResponse.json({
      success: true,
      config: {
        ...config,
        password: undefined,
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Config save error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

