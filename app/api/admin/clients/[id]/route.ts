import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/middleware'
import { logActivity } from '@/lib/activity-log'

export async function GET(
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

    const client = await prisma.user.findUnique({
      where: { id: params.id, role: 'CLIENT' },
      include: {
        vouchers: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { endUsers: true, vouchers: true, payments: true },
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...client,
      packages: [], // Packages are managed via vouchers
    })
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

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
    const { name, logo, phone1, phone2, whatsapp, email, address, isActive } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (logo !== undefined) updateData.logo = logo || null
    if (phone1 !== undefined) updateData.phone1 = phone1 || null
    if (phone2 !== undefined) updateData.phone2 = phone2 || null
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp || null
    if (email !== undefined) updateData.email = email || null
    if (address !== undefined) updateData.address = address || null
    if (isActive !== undefined) updateData.isActive = isActive

    const client = await prisma.user.update({
      where: { id: params.id, role: 'CLIENT' },
      data: updateData,
    })

    // Log activity
    await logActivity({
      userId: auth.user.id,
      action: 'update_client',
      entityType: 'Client',
      entityId: client.id,
      description: `Updated client: ${client.name}`,
      metadata: { clientId: client.id, changes: updateData },
      request,
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
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

    const client = await prisma.user.findUnique({
      where: { id: params.id, role: 'CLIENT' },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    // Log activity
    await logActivity({
      userId: auth.user.id,
      action: 'delete_client',
      entityType: 'Client',
      entityId: params.id,
      description: `Deleted client: ${client.name}`,
      metadata: { clientId: params.id, name: client.name },
      request,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}

