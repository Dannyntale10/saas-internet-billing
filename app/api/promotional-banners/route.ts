import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    const now = new Date()
    const where: any = {
      isActive: true,
      AND: [
        {
          OR: [
            { clientId: null }, // Global banners
            ...(clientId ? [{ clientId }] : []),
          ],
        },
        {
          OR: [
            { startsAt: null, expiresAt: null },
            { startsAt: { lte: now }, expiresAt: null },
            { startsAt: null, expiresAt: { gte: now } },
            { startsAt: { lte: now }, expiresAt: { gte: now } },
          ],
        },
      ],
    }

    // PromotionalBanner model not in schema - return empty array
    const banners: any[] = []
    /* const banners = await prisma.promotionalBanner.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    }) */

    return NextResponse.json(banners)
  } catch (error) {
    console.error('Error fetching promotional banners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promotional banners' },
      { status: 500 }
    )
  }
}

