import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/middleware'
import { logActivity } from '@/lib/activity-log'
import crypto from 'crypto'

function generateApiKey(): string {
  return `sk_${crypto.randomBytes(32).toString('hex')}`
}

function generateApiSecret(): string {
  return crypto.randomBytes(64).toString('hex')
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (userId) where.userId = userId
    if (isActive !== null) where.isActive = isActive === 'true'

    // API Key model not in schema - return empty array for now
    // TODO: Add ApiKey model to schema if needed
    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const { userId, name, permissions, expiresAt, isActive } = body

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'User ID and name are required' },
        { status: 400 }
      )
    }

    // API Key model not in schema - return error
    return NextResponse.json(
      { error: 'API Key feature not available. Please add ApiKey model to schema.' },
      { status: 501 }
    )
  } catch (error: any) {
    console.error('Error creating API key:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create API key' },
      { status: 500 }
    )
  }
}

