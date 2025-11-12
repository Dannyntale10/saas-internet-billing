import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    // Packages are managed via vouchers - return active vouchers as packages
    const whereClause: any = { status: 'ACTIVE' }
    if (clientId) {
      whereClause.clientId = clientId
    }

    const vouchers = await prisma.voucher.findMany({
      where: whereClause,
      orderBy: { price: 'asc' },
      take: 100, // Limit to prevent too many results
    })

    // Group by unique package characteristics to avoid duplicates
    const packageMap = new Map<string, any>()
    
    vouchers.forEach((v) => {
      const key = `${v.timeLimit || 0}-${v.dataLimit || 0}-${v.speedLimit || 0}-${v.price}`
      if (!packageMap.has(key)) {
        packageMap.set(key, {
          id: v.id,
          name: v.name || (v.timeLimit ? `${v.timeLimit}hours` : 'Package'),
          price: v.price,
          currency: v.currency || 'UGX',
          timeLimit: v.timeLimit,
          dataLimit: v.dataLimit,
          speedLimit: v.speedLimit,
          isActive: v.status === 'ACTIVE',
        })
      }
    })

    let packages = Array.from(packageMap.values())

    // If no packages found, return default packages
    if (packages.length === 0) {
      packages = [
        { id: 'default-1', name: '6hours', price: 500, currency: 'UGX', timeLimit: 6, dataLimit: null, speedLimit: null, isActive: true },
        { id: 'default-2', name: '24hours', price: 1000, currency: 'UGX', timeLimit: 24, dataLimit: null, speedLimit: null, isActive: true },
        { id: 'default-3', name: 'week', price: 5000, currency: 'UGX', timeLimit: 168, dataLimit: null, speedLimit: null, isActive: true },
        { id: 'default-4', name: 'month', price: 20000, currency: 'UGX', timeLimit: 720, dataLimit: null, speedLimit: null, isActive: true },
      ]
    }

    return NextResponse.json(packages)
  } catch (error: any) {
    console.error('Error fetching packages:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch packages',
        message: error.message || 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
