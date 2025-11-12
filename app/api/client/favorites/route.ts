import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyClient } from '@/lib/client-middleware'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyClient(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    // FavoritePackage model not in schema - return empty array
    const favorites: any[] = []
    return NextResponse.json(favorites)
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyClient(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const { packageId } = body

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      )
    }

    // FavoritePackage model not in schema - return error
    return NextResponse.json(
      { error: 'Favorite packages not available. Please add FavoritePackage model to schema.' },
      { status: 501 }
    )
  } catch (error: any) {
    console.error('Error adding favorite:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Package already in favorites' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to add favorite' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyClient(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const packageId = searchParams.get('packageId')

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      )
    }

    // FavoritePackage model not in schema - return error
    return NextResponse.json(
      { error: 'Favorite packages not available. Please add FavoritePackage model to schema.' },
      { status: 501 }
    )
  } catch (error) {
    console.error('Error removing favorite:', error)
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    )
  }
}

