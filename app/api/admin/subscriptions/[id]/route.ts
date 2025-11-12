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
        package: true,
        client: { select: { id: true, name: true } },
        transactions: true,
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
    const { status, billingCycle, autoRenew, expiresAt, nextBillingDate } = body

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (billingCycle !== undefined) updateData.billingCycle = billingCycle
    if (autoRenew !== undefined) updateData.autoRenew = autoRenew
    if (expiresAt !== undefined) updateData.expiresAt = new Date(expiresAt)
    if (nextBillingDate !== undefined) updateData.nextBillingDate = nextBillingDate ? new Date(nextBillingDate) : null

    const subscription = await prisma.subscription.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: { select: { id: true, email: true, name: true } },
        package: true,
        client: { select: { id: true, name: true } },
      },
    })

    await logActivity(
      auth.user.id,
      'update_subscription',
      'Subscription',
      subscription.id,
      `Updated subscription: ${subscription.id}`,
      { subscriptionId: subscription.id, changes: updateData },
      request
    )

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

    await logActivity(
      auth.user.id,
      'delete_subscription',
      'Subscription',
      params.id,
      `Deleted subscription: ${params.id}`,
      { subscriptionId: params.id },
      request
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subscription:', error)
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    )
  }
}

