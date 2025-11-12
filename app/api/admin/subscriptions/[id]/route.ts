import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/middleware'
import { logActivity } from '@/lib/activity-log'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const { status, billingCycle, endDate, nextBillingDate } = body

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (billingCycle !== undefined) updateData.billingCycle = billingCycle
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    if (nextBillingDate !== undefined) updateData.nextBillingDate = nextBillingDate ? new Date(nextBillingDate) : null

    const subscription = await prisma.subscription.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    })

    await logActivity({
      userId: auth.user.id,
      action: 'update_subscription',
      entityType: 'Subscription',
      entityId: subscription.id,
      description: `Updated subscription: ${subscription.id}`,
      metadata: { subscriptionId: subscription.id, changes: updateData },
      request,
    })

    return NextResponse.json(subscription)
  } catch (error: any) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: params.id },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    await prisma.subscription.delete({
      where: { id: params.id },
    })

    await logActivity({
      userId: auth.user.id,
      action: 'delete_subscription',
      entityType: 'Subscription',
      entityId: params.id,
      description: `Deleted subscription: ${params.id}`,
      metadata: { subscriptionId: params.id },
      request,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subscription:', error)
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    )
  }
}
