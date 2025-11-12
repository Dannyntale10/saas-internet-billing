import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { packageId, paymentMethod, clientId } = await req.json()

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      )
    }

    // Handle default packages (they don't exist in DB yet)
    if (packageId.startsWith('default-')) {
      const defaultPackages: Record<string, any> = {
        'default-1': { price: 500, timeLimit: 6, name: '6hours' },
        'default-2': { price: 1000, timeLimit: 24, name: '24hours' },
        'default-3': { price: 5000, timeLimit: 168, name: 'week' },
        'default-4': { price: 20000, timeLimit: 720, name: 'month' },
      }

      const defaultPkg = defaultPackages[packageId]
      if (!defaultPkg) {
        return NextResponse.json(
          { error: 'Invalid default package' },
          { status: 400 }
        )
      }

      // For default packages, we need a client to create the payment
      // If no clientId provided, try to get the first client
      let targetClientId = clientId
      if (!targetClientId) {
        const firstClient = await prisma.user.findFirst({
          where: { role: 'CLIENT', isActive: true },
        })
        if (!firstClient) {
          return NextResponse.json(
            { error: 'No client found. Please contact support.' },
            { status: 404 }
          )
        }
        targetClientId = firstClient.id
      }

      // Get client portal to fetch payment numbers
      const clientPortal = await prisma.clientPortal.findUnique({
        where: { clientId: targetClientId },
        select: {
          mtnMobileMoneyNumber: true,
          airtelMoneyNumber: true,
        }
      })

      // Get payment number based on method
      const paymentNumber = paymentMethod === 'MTN_MOBILE_MONEY'
        ? clientPortal?.mtnMobileMoneyNumber
        : clientPortal?.airtelMoneyNumber

      // Check if payment number is configured
      if (!paymentNumber) {
        return NextResponse.json(
          { 
            error: `${paymentMethod === 'MTN_MOBILE_MONEY' ? 'MTN Mobile Money' : 'Airtel Money'} number is not configured. Please contact support.`,
            requiresConfiguration: true
          },
          { status: 400 }
        )
      }

      // Create a payment record for default package
      const payment = await prisma.payment.create({
        data: {
          userId: targetClientId,
          amount: defaultPkg.price,
          currency: 'UGX',
          status: 'PENDING',
          method: paymentMethod || 'MTN_MOBILE_MONEY',
          phoneNumber: paymentNumber,
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Payment initiated. Please complete payment via mobile money.',
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.method,
          status: payment.status,
        },
        package: {
          name: defaultPkg.name,
          price: defaultPkg.price,
          timeLimit: defaultPkg.timeLimit,
        },
        paymentNumber: paymentNumber,
        instructions: paymentMethod === 'MTN_MOBILE_MONEY' 
          ? `Send ${defaultPkg.price} UGX to MTN Mobile Money number: ${paymentNumber}`
          : `Send ${defaultPkg.price} UGX to Airtel Money number: ${paymentNumber}`
      })
    }

    // Handle real vouchers from database
    const voucher = await prisma.voucher.findUnique({
      where: { id: packageId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    if (!voucher) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    if (voucher.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Package is ${voucher.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Get client portal to fetch payment numbers
    const clientPortal = await prisma.clientPortal.findUnique({
      where: { clientId: voucher.clientId },
      select: {
        mtnMobileMoneyNumber: true,
        airtelMoneyNumber: true,
      }
    })

    // Get payment number based on method
    const paymentNumber = paymentMethod === 'MTN_MOBILE_MONEY'
      ? clientPortal?.mtnMobileMoneyNumber
      : clientPortal?.airtelMoneyNumber

    // Check if payment number is configured
    if (!paymentNumber) {
      return NextResponse.json(
        { 
          error: `${paymentMethod === 'MTN_MOBILE_MONEY' ? 'MTN Mobile Money' : 'Airtel Money'} number is not configured. Please contact support.`,
          requiresConfiguration: true
        },
        { status: 400 }
      )
    }

    // Create pending payment
    const payment = await prisma.payment.create({
      data: {
        userId: clientId || voucher.clientId,
        voucherId: voucher.id,
        amount: voucher.price,
        currency: voucher.currency || 'UGX',
        status: 'PENDING',
        method: paymentMethod || 'MTN_MOBILE_MONEY',
        phoneNumber: paymentNumber,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment initiated. Please complete payment via mobile money.',
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
      },
      package: {
        name: voucher.name,
        price: voucher.price,
        timeLimit: voucher.timeLimit,
      },
      paymentNumber: paymentNumber,
      instructions: paymentMethod === 'MTN_MOBILE_MONEY' 
        ? `Send ${voucher.price} UGX to MTN Mobile Money number: ${paymentNumber}`
        : `Send ${voucher.price} UGX to Airtel Money number: ${paymentNumber}`
    })
  } catch (error: any) {
    console.error('Error processing package purchase:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to process purchase',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

