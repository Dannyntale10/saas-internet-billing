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

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        client: { select: { id: true, name: true } },
        transactions: {
          include: {
            package: true,
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
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
    const { status, amount, currency, dueDate, notes, paidAt } = body

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (currency !== undefined) updateData.currency = currency
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (notes !== undefined) updateData.notes = notes
    if (paidAt !== undefined) updateData.paidAt = paidAt ? new Date(paidAt) : null

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: { select: { id: true, email: true, name: true } },
        client: { select: { id: true, name: true } },
        transactions: true,
      },
    })

    await logActivity(
      auth.user.id,
      'update_invoice',
      'Invoice',
      invoice.id,
      `Updated invoice: ${invoice.invoiceNumber}`,
      { invoiceId: invoice.id, changes: updateData },
      request
    )

    return NextResponse.json(invoice)
  } catch (error: any) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

