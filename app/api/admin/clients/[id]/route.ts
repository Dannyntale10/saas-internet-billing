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

    // Get portal data if exists
    const portal = await prisma.clientPortal.findUnique({
      where: { clientId: client.id },
    })

    return NextResponse.json({
      ...client,
      phone1: portal?.phone1 || client.phone || null,
      phone2: portal?.phone2 || null,
      whatsapp: portal?.whatsapp || null,
      address: portal?.address || null,
      logo: portal?.logoUrl || null,
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

    // Update User model fields
    const userUpdateData: any = {}
    if (name !== undefined) userUpdateData.name = name
    if (email !== undefined) userUpdateData.email = email
    if (phone1 !== undefined) userUpdateData.phone = phone1 || null // User model has 'phone' not 'phone1'
    if (isActive !== undefined) userUpdateData.isActive = isActive

    // Update or create ClientPortal for portal-specific fields
    const portalUpdateData: any = {}
    if (phone1 !== undefined) portalUpdateData.phone1 = phone1 || null
    if (phone2 !== undefined) portalUpdateData.phone2 = phone2 || null
    if (whatsapp !== undefined) portalUpdateData.whatsapp = whatsapp || null
    if (address !== undefined) portalUpdateData.address = address || null
    if (logo !== undefined) portalUpdateData.logoUrl = logo || null
    if (name !== undefined) portalUpdateData.companyName = name

    // Update user
    const client = await prisma.user.update({
      where: { id: params.id, role: 'CLIENT' },
      data: userUpdateData,
      include: {
        portal: true,
      },
    })

    // Update or create ClientPortal
    if (Object.keys(portalUpdateData).length > 0) {
      if (client.portal) {
        // Update existing portal
        await prisma.clientPortal.update({
          where: { id: client.portal.id },
          data: portalUpdateData,
        })
      } else {
        // Create new portal
        await prisma.clientPortal.create({
          data: {
            clientId: client.id,
            companyName: name || client.name,
            ...portalUpdateData,
          },
        })
      }
    }

    // Fetch updated client with portal
    const updatedClient = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        portal: true,
      },
    })

    // Log activity
    await logActivity({
      userId: auth.user.id,
      action: 'update_client',
      entityType: 'Client',
      entityId: client.id,
      description: `Updated client: ${client.name}`,
      metadata: { clientId: client.id, changes: { ...userUpdateData, ...portalUpdateData } },
      request,
    })

    // Return client data in expected format
    return NextResponse.json({
      ...updatedClient,
      phone1: updatedClient?.portal?.phone1 || updatedClient?.phone || null,
      phone2: updatedClient?.portal?.phone2 || null,
      whatsapp: updatedClient?.portal?.whatsapp || null,
      address: updatedClient?.portal?.address || null,
      logo: updatedClient?.portal?.logoUrl || null,
    })
  } catch (error: any) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update client' },
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

