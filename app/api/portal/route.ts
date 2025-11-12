import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    let portal
    let packages: any[] = []

    if (clientId) {
      // Get specific client's portal
      portal = await prisma.clientPortal.findUnique({
        where: { clientId },
      })

      if (portal) {
        // Get packages for this client (if they have custom packages)
        // For now, get all active packages
        packages = await prisma.voucher.findMany({
          where: {
            clientId,
            status: 'ACTIVE',
          },
          select: {
            id: true,
            name: true,
            price: true,
            timeLimit: true,
            dataLimit: true,
            speedLimit: true,
          },
          orderBy: { price: 'asc' },
          take: 10,
        })
      }
    } else {
      // Get default portal (first client or create default)
      portal = await prisma.clientPortal.findFirst({
        orderBy: { createdAt: 'desc' },
      })

      if (portal) {
        packages = await prisma.voucher.findMany({
          where: {
            clientId: portal.clientId,
            status: 'ACTIVE',
          },
          select: {
            id: true,
            name: true,
            price: true,
            timeLimit: true,
            dataLimit: true,
            speedLimit: true,
          },
          orderBy: { price: 'asc' },
          take: 10,
        })
      }
    }

    // If no portal found, return default
    if (!portal) {
      return NextResponse.json({
        portal: {
          companyName: 'JENDA MOBILITY WiFi',
          showFreeTrial: true,
          freeTrialText: 'Free trial available, click here.',
          showVoucherInput: true,
          showPackages: true,
          showPaymentMethods: true,
          primaryColor: '#76D74C',
          secondaryColor: '#1e293b',
          backgroundColor: '#0f172a',
          footerText: 'Powered by JENDA MOBILITY',
          showPoweredBy: true,
        },
        packages: [],
      })
    }

    return NextResponse.json({
      portal: {
        ...portal,
        currency: 'UGX', // Default currency
      },
      packages: packages.map(pkg => ({
        id: pkg.id,
        name: pkg.name || `${pkg.timeLimit || 0} hours`,
        price: pkg.price,
        currency: 'UGX',
        timeLimit: pkg.timeLimit,
        dataLimit: pkg.dataLimit,
        speedLimit: pkg.speedLimit,
      })),
    })
  } catch (error) {
    console.error('Error fetching portal:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portal data' },
      { status: 500 }
    )
  }
}

