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
    const voucherId = searchParams.get('voucherId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = {}
    if (userId) where.userId = userId
    if (voucherId) where.voucherId = voucherId
    if (from || to) {
      where.timestamp = {}
      if (from) where.timestamp.gte = new Date(from)
      if (to) where.timestamp.lte = new Date(to)
    }

    const usageLogs = await prisma.usageLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
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
    const { userId, voucherId, dataUsed, duration, uploadBytes, downloadBytes, ipAddress, macAddress } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const usageLog = await prisma.usageLog.create({
      data: {
        userId,
        voucherId: voucherId || null,
        dataUsed: dataUsed ? parseFloat(dataUsed) : 0,
        duration: duration || 0,
        uploadBytes: uploadBytes ? String(uploadBytes) : '0',
        downloadBytes: downloadBytes ? String(downloadBytes) : '0',
        ipAddress: ipAddress || null,
        macAddress: macAddress || null,
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
