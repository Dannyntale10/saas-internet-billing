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
    const country = searchParams.get('country')

    const where: any = {}
    if (isActive !== null) where.isActive = isActive === 'true'
    if (country) where.country = country

    const taxRates = await prisma.taxRate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(taxRates)
  } catch (error) {
    console.error('Error fetching tax rates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tax rates' },
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
    const { name, rate, type, country, region, isActive } = body

    if (!name || rate === undefined || !type) {
      return NextResponse.json(
        { error: 'Name, rate, and type are required' },
        { status: 400 }
      )
    }

    const taxRate = await prisma.taxRate.create({
      data: {
        name: name.trim(),
        rate: parseFloat(rate),
        type: type.trim(),
        country: country?.trim() || null,
        region: region?.trim() || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    await logActivity(
      auth.user.id,
      'create_tax_rate',
      'TaxRate',
      taxRate.id,
      `Created tax rate: ${taxRate.name} (${taxRate.rate}%)`,
      { taxRateId: taxRate.id, name: taxRate.name, rate: taxRate.rate },
      request
    )

    return NextResponse.json(taxRate, { status: 201 })
  } catch (error: any) {
    console.error('Error creating tax rate:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create tax rate' },
      { status: 500 }
    )
  }
}

