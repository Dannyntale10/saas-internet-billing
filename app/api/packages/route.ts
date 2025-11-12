import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Packages are managed via vouchers - return active vouchers as packages
    const vouchers = await prisma.voucher.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { price: 'asc' },
      take: 50, // Limit to prevent too many results
    })

    // Group by unique package characteristics to avoid duplicates
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
