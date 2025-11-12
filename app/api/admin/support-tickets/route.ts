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
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const clientId = searchParams.get('clientId')
    const assignedTo = searchParams.get('assignedTo')

    const where: any = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (clientId) where.clientId = clientId
    if (assignedTo) where.assignedTo = assignedTo

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
        client: { select: { id: true, name: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Error fetching support tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
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
    const { userId, clientId, subject, description, priority, assignedTo } = body

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      )
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: userId || null,
        clientId: clientId || null,
        subject: subject.trim(),
        description: description.trim(),
        status: 'open',
        priority: priority || 'medium',
        assignedTo: assignedTo || null,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        client: { select: { id: true, name: true } },
      },
    })

    await logActivity(
      auth.user.id,
      'create_support_ticket',
      'SupportTicket',
      ticket.id,
      `Created support ticket: ${ticket.subject}`,
      { ticketId: ticket.id, subject: ticket.subject },
      request
    )

    return NextResponse.json(ticket, { status: 201 })
  } catch (error: any) {
    console.error('Error creating support ticket:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create support ticket' },
      { status: 500 }
    )
  }
}

