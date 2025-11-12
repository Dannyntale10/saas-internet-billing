import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/middleware'
import { logActivity } from '@/lib/activity-log'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (isActive !== null) where.isActive = isActive === 'true'

    // Currency model not in schema - return default currency
    const currencies = [{
      id: 'ugx',
      code: 'UGX',
      name: 'Ugandan Shilling',
      symbol: 'UGX',
      exchangeRate: 1,
      isActive: true,
      isBase: true,
    }]

    return NextResponse.json(currencies)
  } catch (error) {
    console.error('Error fetching currencies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch currencies' },
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

    const body = await request.json()
    const { code, name, symbol, exchangeRate, isActive, isBase } = body

    if (!code || !name || !symbol) {
      return NextResponse.json(
        { error: 'Code, name, and symbol are required' },
        { status: 400 }
      )
    }

    // Currency model not in schema - return error
    return NextResponse.json(
      { error: 'Currency management not available. Using default UGX currency.' },
      { status: 501 }
    )
  } catch (error: any) {
    console.error('Error creating currency:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Currency code already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create currency' },
      { status: 500 }
    )
  }
}

