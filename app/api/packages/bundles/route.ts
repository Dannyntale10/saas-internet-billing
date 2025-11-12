import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    // Package bundles not in schema - return empty array
    // TODO: Implement package bundles if needed
    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching package bundles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch package bundles' },
      { status: 500 }
    )
  }
}
