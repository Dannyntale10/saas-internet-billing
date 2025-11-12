import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/middleware'
import { logActivity } from '@/lib/activity-log'

function generateInvoiceNumber(): string {
  const prefix = 'INV'
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}-${timestamp}-${random}`
}

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
    const clientId = searchParams.get('clientId')
    const userId = searchParams.get('userId')

    const where: any = {}
    if (status) where.status = status
    if (clientId) where.clientId = clientId
    if (userId) where.userId = userId

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
        client: { select: { id: true, name: true } },
        transactions: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
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
    const { userId, clientId, amount, currency, dueDate, notes, status } = body

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'User and amount are required' },
        { status: 400 }
      )
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        userId,
        clientId: clientId || null,
        amount: parseFloat(amount),
        currency: currency || 'UGX',
        status: status || 'draft',
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        client: { select: { id: true, name: true } },
      },
    })

    await logActivity(
      auth.user.id,
      'create_invoice',
      'Invoice',
      invoice.id,
      `Created invoice: ${invoice.invoiceNumber}`,
      { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, amount: invoice.amount },
      request
    )

    return NextResponse.json(invoice, { status: 201 })
  } catch (error: any) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice' },
      { status: 500 }
    )
  }
}

