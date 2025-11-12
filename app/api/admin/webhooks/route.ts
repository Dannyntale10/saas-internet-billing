import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/middleware'
import { logActivity } from '@/lib/activity-log'
import crypto from 'crypto'

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
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (isActive !== null) where.isActive = isActive === 'true'

    const webhooks = await prisma.webhook.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Don't return secrets
    const safeWebhooks = webhooks.map(webhook => ({
      ...webhook,
      secret: webhook.secret.substring(0, 8) + '...',
    }))

    return NextResponse.json(safeWebhooks)
  } catch (error) {
    console.error('Error fetching webhooks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
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
    const { name, url, events, isActive } = body

    if (!name || !url || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Name, URL, and events array are required' },
        { status: 400 }
      )
    }

    // Generate webhook secret
    const secret = crypto.randomBytes(32).toString('hex')

    const webhook = await prisma.webhook.create({
      data: {
        name: name.trim(),
        url: url.trim(),
        events: JSON.stringify(events),
        secret,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    await logActivity(
      auth.user.id,
      'create_webhook',
      'Webhook',
      webhook.id,
      `Created webhook: ${webhook.name}`,
      { webhookId: webhook.id, name: webhook.name },
      request
    )

    // Return full secret on creation
    return NextResponse.json({
      ...webhook,
      secret, // Full secret on creation
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create webhook' },
      { status: 500 }
    )
  }
}

