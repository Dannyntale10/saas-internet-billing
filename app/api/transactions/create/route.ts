import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { packageId, paymentMethod, discountCode, amount } = await request.json()

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      )
    }

    // Find package (stored as voucher in current schema)
    const pkg = await prisma.voucher.findUnique({
      where: { id: packageId },
    })

    if (!pkg || pkg.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Package not found or inactive' },
        { status: 404 }
      )
    }

    // Validate discount code if provided
    let discountCodeRecord = null
    if (discountCode) {
      discountCodeRecord = await prisma.discountCode.findUnique({
        where: { code: discountCode.toUpperCase() },
      })

      if (!discountCodeRecord || !discountCodeRecord.isActive) {
        return NextResponse.json(
          { error: 'Invalid or inactive discount code' },
          { status: 400 }
        )
      }

      // Check expiration
      if (discountCodeRecord.expiresAt && discountCodeRecord.expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Discount code has expired' },
          { status: 400 }
        )
      }

      // Check usage limit
      if (discountCodeRecord.usageLimit && discountCodeRecord.usedCount >= discountCodeRecord.usageLimit) {
        return NextResponse.json(
          { error: 'Discount code has reached its usage limit' },
          { status: 400 }
        )
      }
    }

    // Calculate final amount
    let finalAmount = amount || pkg.price
    if (discountCodeRecord) {
      let discountAmount = 0
      if (discountCodeRecord.type === 'percentage') {
        discountAmount = (pkg.price * discountCodeRecord.value) / 100
        if (discountCodeRecord.maxDiscount) {
          discountAmount = Math.min(discountAmount, discountCodeRecord.maxDiscount)
        }
      } else {
        discountAmount = discountCodeRecord.value
      }
      finalAmount = Math.max(0, pkg.price - discountAmount)
    }

    // Create payment (transactions are payments in current schema)
    const payment = await prisma.payment.create({
      data: {
        userId: pkg.clientId, // Use client ID for now
        voucherId: pkg.id,
        amount: finalAmount,
        currency: 'UGX',
        method: paymentMethod || 'VOUCHER',
        status: 'PENDING',
      },
    })

    // Update discount code usage count if used
    // Skipped - DiscountCode model not in schema

    // In production, you would redirect to payment gateway here
    // For now, we'll return the payment with payment instructions
    return NextResponse.json({
      success: true,
      transaction: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        package: pkg.name || `${pkg.timeLimit || 0} hours`,
      },
      paymentInstructions: {
        airtelMoney: `Send UGX ${finalAmount.toLocaleString()} to +256702772200`,
        mtnMomo: `Send UGX ${finalAmount.toLocaleString()} to +256753908001`,
      },
      discountApplied: discountCodeRecord ? {
        code: discountCodeRecord.code,
        savings: pkg.price - finalAmount,
      } : null,
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}

