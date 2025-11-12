import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/middleware'
import { logActivity } from '@/lib/activity-log'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const { name, permissions, isActive, expiresAt } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (permissions !== undefined) updateData.permissions = permissions ? JSON.stringify(permissions) : null
    if (isActive !== undefined) updateData.isActive = isActive
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null

    // API Key model not in schema
    return NextResponse.json(
      { error: 'API Key feature not available' },
      { status: 501 }
    )
  } catch (error: any) {
    console.error('Error updating API key:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update API key' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    // API Key model not in schema
    return NextResponse.json(
      { error: 'API Key feature not available' },
      { status: 501 }
    )
  } catch (error) {
    console.error('Error deleting API key:', error)
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    )
  }
}

