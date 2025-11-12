import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    // Get popular packages from vouchers (most used)
    const vouchers = await prisma.voucher.findMany({
      where: {
        status: 'ACTIVE',
        ...(clientId ? { clientId } : {}),
      },
      orderBy: { price: 'asc' },
      take: 10,
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
        })
      }
    })

    const packages = Array.from(packageMap.values()).slice(0, 5)

    return NextResponse.json(packages)
  } catch (error) {
    console.error('Error fetching popular packages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch popular packages' },
      { status: 500 }
    )
  }
}
