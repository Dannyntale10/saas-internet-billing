import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/middleware'

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
    const clientId = searchParams.get('clientId')
    const transactionId = searchParams.get('transactionId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = {}
    if (userId) where.userId = userId
    if (clientId) where.clientId = clientId
    if (transactionId) where.transactionId = transactionId
    if (from || to) {
      where.startTime = {}
      if (from) where.startTime.gte = new Date(from)
      if (to) where.startTime.lte = new Date(to)
    }

    const usageLogs = await prisma.usageLog.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
        client: { select: { id: true, name: true } },
        transaction: {
          include: {
            package: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
      take: limit,
    })

    return NextResponse.json(usageLogs)
  } catch (error) {
    console.error('Error fetching usage logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage logs' },
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
    const { userId, clientId, transactionId, bytesUsed, duration, startTime, endTime, ipAddress, deviceInfo } = body

    if (!userId || !startTime) {
      return NextResponse.json(
        { error: 'User ID and start time are required' },
        { status: 400 }
      )
    }

    const usageLog = await prisma.usageLog.create({
      data: {
        userId,
        clientId: clientId || null,
        transactionId: transactionId || null,
        bytesUsed: BigInt(bytesUsed || 0),
        duration: duration || 0,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        ipAddress: ipAddress || null,
        deviceInfo: deviceInfo || null,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        client: { select: { id: true, name: true } },
        transaction: {
          include: {
            package: true,
          },
        },
      },
    })

    return NextResponse.json(usageLog, { status: 201 })
  } catch (error: any) {
    console.error('Error creating usage log:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create usage log' },
      { status: 500 }
    )
  }
}

