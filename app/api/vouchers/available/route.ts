import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const vouchers = await prisma.voucher.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } }
        ]
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: { price: 'asc' },
    })

    return NextResponse.json({ vouchers })
  } catch (error) {
    console.error('Error fetching vouchers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

