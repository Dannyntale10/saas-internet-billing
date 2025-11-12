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
    const userId = searchParams.get('userId')

    const where: any = {}
    if (status) where.status = status
    if (userId) where.userId = userId

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
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
    const { userId, name, price, currency, billingCycle, dataLimit, timeLimit, speedLimit, startDate, endDate } = body

    if (!userId || !name || price === undefined || !startDate) {
      return NextResponse.json(
        { error: 'User, name, price, and start date are required' },
        { status: 400 }
      )
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        name,
        price: parseFloat(price),
        currency: currency || 'UGX',
        billingCycle: billingCycle || 'monthly',
        dataLimit: dataLimit ? parseFloat(dataLimit) : null,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        speedLimit: speedLimit ? parseInt(speedLimit) : null,
        status: 'active',
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        nextBillingDate: billingCycle === 'monthly' && endDate ? new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)) : null,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    })

    await logActivity({
      userId: auth.user.id,
      action: 'create_subscription',
      entityType: 'Subscription',
      entityId: subscription.id,
      description: `Created subscription for user: ${subscription.user.email}`,
      metadata: { subscriptionId: subscription.id, userId, name },
      request,
    })

    return NextResponse.json(subscription, { status: 201 })
  } catch (error: any) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
