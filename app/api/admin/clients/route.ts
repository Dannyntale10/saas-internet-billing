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

    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { endUsers: true }
        }
      },
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
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
    const { name, email, phone, password } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 }
      )
    }

    if (!email || email.trim() === '') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Create client as User with CLIENT role
    const clientEmail = email.trim().toLowerCase()
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: clientEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Create user with CLIENT role
    const clientPassword = password && password.trim() !== '' 
      ? password.trim() 
      : 'changeme123'
    const hashedPassword = await require('bcryptjs').hash(clientPassword, 10)
    
    const client = await prisma.user.create({
      data: {
        email: clientEmail,
        password: hashedPassword,
        name: name.trim(),
        role: 'CLIENT',
        phone: phone && phone.trim() !== '' ? phone.trim() : null,
        isActive: true,
      },
    })

    // Log activity
    await logActivity({
      userId: auth.user.id,
      action: 'create_client',
      entityType: 'Client',
      entityId: client.id,
      description: `Created client: ${client.name}`,
      metadata: { clientId: client.id, name: client.name },
      request,
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error: any) {
    console.error('Error creating client:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Subdomain already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create client' },
      { status: 500 }
    )
  }
}

