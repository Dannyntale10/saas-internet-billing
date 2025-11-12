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

    // Packages are managed via vouchers - return unique packages from vouchers
    const vouchers = await prisma.voucher.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Group by unique package characteristics
    const packageMap = new Map<string, any>()
    
    vouchers.forEach((v) => {
      const key = `${v.timeLimit || 0}-${v.dataLimit || 0}-${v.speedLimit || 0}-${v.price}`
      if (!packageMap.has(key)) {
        packageMap.set(key, {
          id: v.id,
          name: v.name || `${v.timeLimit || 0} hours`,
          price: v.price,
          currency: 'UGX',
          timeLimit: v.timeLimit,
          dataLimit: v.dataLimit,
          speedLimit: v.speedLimit,
          isActive: v.status === 'ACTIVE',
          createdAt: v.createdAt,
        })
      }
    })

    const packages = Array.from(packageMap.values())

    return NextResponse.json(packages)
  } catch (error) {
    console.error('Error fetching packages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
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

    // Package model not in schema - packages are created as vouchers
    // Redirect to voucher creation
    return NextResponse.json(
      { error: 'Packages are managed via vouchers. Please use the vouchers API to create packages.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error creating package:', error)
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    )
  }
}
