import { NextRequest, NextResponse } from 'next/server'
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Invoice model not in schema - return payments as invoices
    const payments = await require('@/lib/prisma').prisma.payment.findMany({
      where: {
        userId: auth.user.id,
        ...(status ? { status: status.toUpperCase() } : {}),
      },
      include: {
        voucher: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Transform payments to invoice-like format
    const invoices = payments.map((payment: any, index: number) => ({
      id: payment.id,
      invoiceNumber: `INV-${payment.id.slice(0, 8).toUpperCase()}`,
      userId: payment.userId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status === 'COMPLETED' ? 'paid' : payment.status === 'PENDING' ? 'pending' : 'unpaid',
      dueDate: payment.completedAt || payment.createdAt,
      createdAt: payment.createdAt,
      items: payment.voucher ? [{
        description: payment.voucher.name || payment.voucher.code,
        quantity: 1,
        price: payment.amount,
      }] : [],
    }))

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Error fetching client invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}
