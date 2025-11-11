import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const configSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().positive(),
  username: z.string().min(1),
  password: z.string().min(1),
  apiPort: z.number().int().positive().optional(),
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

    // Encrypt password
    const encryptedPassword = await bcrypt.hash(data.password, 10)

    // Upsert configuration
    const config = await prisma.routerConfig.upsert({
      where: { userId: session.user.id },
      update: {
        host: data.host,
        port: data.port,
        username: data.username,
        password: encryptedPassword,
        apiPort: data.apiPort || data.port,
        isActive: true,
      },
      create: {
        userId: session.user.id,
        host: data.host,
        port: data.port,
        username: data.username,
        password: encryptedPassword,
        apiPort: data.apiPort || data.port,
        isActive: true,
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

