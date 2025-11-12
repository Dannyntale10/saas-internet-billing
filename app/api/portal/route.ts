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
        // Get unique packages for this client (group by price/timeLimit to avoid duplicates)
        const allVouchers = await prisma.voucher.findMany({
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
        })

        // Group by unique package characteristics
        const packageMap = new Map<string, any>()
        allVouchers.forEach((v) => {
          const key = `${v.price}-${v.timeLimit || 0}-${v.dataLimit || 0}`
          if (!packageMap.has(key)) {
            packageMap.set(key, v)
          }
        })
        packages = Array.from(packageMap.values()).slice(0, 10)
      }
    } else {
      // Get default portal (first client or create default)
      portal = await prisma.clientPortal.findFirst({
        orderBy: { createdAt: 'desc' },
      })

      if (portal) {
        // Get unique packages for this client
        const allVouchers = await prisma.voucher.findMany({
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
        })

        // Group by unique package characteristics
        const packageMap = new Map<string, any>()
        allVouchers.forEach((v) => {
          const key = `${v.price}-${v.timeLimit || 0}-${v.dataLimit || 0}`
          if (!packageMap.has(key)) {
            packageMap.set(key, v)
          }
        })
        packages = Array.from(packageMap.values()).slice(0, 10)
      }
    }

    // Default packages if none exist (matching screenshot)
    const defaultPackages = [
      { id: 'default-1', name: '6hours', price: 500, currency: 'UGX', timeLimit: 6, dataLimit: null, speedLimit: null },
      { id: 'default-2', name: '24hours', price: 1000, currency: 'UGX', timeLimit: 24, dataLimit: null, speedLimit: null },
      { id: 'default-3', name: 'week', price: 5000, currency: 'UGX', timeLimit: 168, dataLimit: null, speedLimit: null },
      { id: 'default-4', name: 'month', price: 20000, currency: 'UGX', timeLimit: 720, dataLimit: null, speedLimit: null },
    ]

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
        packages: packages.length > 0 ? packages.map(pkg => ({
          id: pkg.id,
          name: pkg.name || `${pkg.timeLimit || 0} hours`,
          price: pkg.price,
          currency: 'UGX',
          timeLimit: pkg.timeLimit,
          dataLimit: pkg.dataLimit,
          speedLimit: pkg.speedLimit,
        })) : defaultPackages,
      })
    }

    // Use default packages if none found for this client
    const finalPackages = packages.length > 0 
      ? packages.map(pkg => ({
          id: pkg.id,
          name: pkg.name || `${pkg.timeLimit || 0} hours`,
          price: pkg.price,
          currency: 'UGX',
          timeLimit: pkg.timeLimit,
          dataLimit: pkg.dataLimit,
          speedLimit: pkg.speedLimit,
        }))
      : defaultPackages

    return NextResponse.json({
      portal: {
        ...portal,
        currency: 'UGX', // Default currency
      },
      packages: finalPackages,
    })
  } catch (error: any) {
    console.error('Error fetching portal:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch portal data',
        message: error.message || 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

