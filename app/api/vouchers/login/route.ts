import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Voucher code is required' },
        { status: 400 }
      )
    }

    // Find voucher
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!voucher) {
      return NextResponse.json(
        { error: 'Invalid voucher code' },
        { status: 404 }
      )
    }

    if (voucher.status === 'USED') {
      return NextResponse.json(
        { error: 'Voucher has already been used' },
        { status: 400 }
      )
    }

    if (voucher.validUntil && voucher.validUntil < new Date()) {
      return NextResponse.json(
        { error: 'Voucher has expired' },
        { status: 400 }
      )
    }

    // Get or create user for voucher
    let user = voucher.usedBy
      ? await prisma.user.findUnique({ where: { id: voucher.usedBy } })
      : null

    if (!user) {
      // Create a temporary user for voucher login
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('temp', 10)
      user = await prisma.user.create({
        data: {
          email: `voucher_${voucher.code}@temp.com`,
          password: hashedPassword,
          role: 'END_USER',
        },
      })
    }

    // Mark voucher as used
    const expiresAt = voucher.validUntil || (() => {
      const date = new Date()
      if (voucher.timeLimit) {
        date.setHours(date.getHours() + voucher.timeLimit)
      } else {
        date.setDate(date.getDate() + 30) // Default 30 days
      }
      return date
    })()

    await prisma.voucher.update({
      where: { id: voucher.id },
      data: {
        status: 'USED',
        usedAt: new Date(),
        usedBy: user.id,
      },
    })

    // Create payment record
    await prisma.payment.create({
      data: {
        userId: user.id,
        voucherId: voucher.id,
        amount: voucher.price,
        currency: 'UGX',
        method: 'VOUCHER',
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })

    // Generate session token
    const token = await generateToken(user.id, user.email, user.role)
    await createSession(user.id, token)

    return NextResponse.json({
      success: true,
      message: 'Voucher redeemed successfully',
      token,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('Error redeeming voucher:', error)
    return NextResponse.json(
      { error: 'Failed to redeem voucher' },
      { status: 500 }
    )
  }
}

