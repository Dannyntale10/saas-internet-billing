import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await prisma.user.findUnique({
      where: { id: params.id, role: 'CLIENT' },
      include: {
        vouchers: {
          where: { status: 'ACTIVE' },
          take: 10,
        },
        portal: true,
      },
    })

    if (!client || !client.isActive) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...client,
      packages: [], // Packages managed via vouchers
    })
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

