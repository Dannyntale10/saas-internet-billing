import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/middleware'
import { logActivity } from '@/lib/activity-log'

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
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const userId = searchParams.get('userId')

    const where: any = {}
    if (status) where.status = status
    if (clientId) where.clientId = clientId
    if (userId) where.userId = userId

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
        package: true,
        client: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(subscriptions)
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
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
    const { userId, packageId, clientId, billingCycle, autoRenew, startsAt, expiresAt } = body

    if (!userId || !packageId || !startsAt || !expiresAt) {
      return NextResponse.json(
        { error: 'User, package, start date, and expiry date are required' },
        { status: 400 }
      )
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        packageId,
        clientId: clientId || null,
        status: 'active',
        billingCycle: billingCycle || 'monthly',
        autoRenew: autoRenew !== undefined ? autoRenew : true,
        startsAt: new Date(startsAt),
        expiresAt: new Date(expiresAt),
        nextBillingDate: billingCycle === 'monthly' ? new Date(new Date(startsAt).setMonth(new Date(startsAt).getMonth() + 1)) : null,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        package: true,
        client: { select: { id: true, name: true } },
      },
    })

    await logActivity(
      auth.user.id,
      'create_subscription',
      'Subscription',
      subscription.id,
      `Created subscription for user: ${subscription.user.email}`,
      { subscriptionId: subscription.id, userId, packageId },
      request
    )

    return NextResponse.json(subscription, { status: 201 })
  } catch (error: any) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

