import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/middleware'
import { logActivity } from '@/lib/activity-log'

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
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
    const referrerId = searchParams.get('referrerId')
    const status = searchParams.get('status')
    const code = searchParams.get('code')

    const where: any = {}
    if (referrerId) where.referrerId = referrerId
    if (status) where.status = status
    if (code) where.code = code

    const referrals = await prisma.referral.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(referrals)
  } catch (error) {
    console.error('Error fetching referrals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referrals' },
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
    const { referrerId, rewardType, rewardValue } = body

    if (!referrerId || !rewardType || rewardValue === undefined) {
      return NextResponse.json(
        { error: 'Referrer ID, reward type, and reward value are required' },
        { status: 400 }
      )
    }

    let code = generateReferralCode()
    // Ensure unique code
    let existing = await prisma.referral.findUnique({ where: { code } })
    while (existing) {
      code = generateReferralCode()
      existing = await prisma.referral.findUnique({ where: { code } })
    }

    const referral = await prisma.referral.create({
      data: {
        referrerId,
        code,
        rewardType,
        rewardValue: parseFloat(rewardValue),
        status: 'pending',
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    })

    await logActivity(
      auth.user.id,
      'create_referral',
      'Referral',
      referral.id,
      `Created referral code: ${referral.code}`,
      { referralId: referral.id, code: referral.code },
      request
    )

    return NextResponse.json(referral, { status: 201 })
  } catch (error: any) {
    console.error('Error creating referral:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create referral' },
      { status: 500 }
    )
  }
}

