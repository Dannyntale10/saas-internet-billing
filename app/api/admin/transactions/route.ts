import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Transactions are stored as Payments in current schema
    const payments = await prisma.payment.findMany({
      include: {
        user: { select: { email: true, name: true } },
        voucher: { 
          select: { 
            name: true, 
            code: true,
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          } 
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000, // Increased limit to get all transactions for grouping
    })

    // Group transactions by client
    const clientTotals = new Map<string, {
      clientId: string
      clientName: string
      clientEmail: string
      totalAmount: number
      completedAmount: number
      pendingAmount: number
      transactionCount: number
      completedCount: number
      transactions: typeof payments
    }>()

    payments.forEach((payment) => {
      // Get client from voucher or from user if user is a client
      const client = payment.voucher?.client || (payment.user?.name && payment.user?.email ? { id: payment.user.email, name: payment.user.name, email: payment.user.email } : null)
      
      if (!client) return

      const clientId = client.id
      if (!clientTotals.has(clientId)) {
        clientTotals.set(clientId, {
          clientId,
          clientName: client.name || 'Unknown Client',
          clientEmail: client.email || '',
          totalAmount: 0,
          completedAmount: 0,
          pendingAmount: 0,
          transactionCount: 0,
          completedCount: 0,
          transactions: [],
        })
      }

      const clientData = clientTotals.get(clientId)!
      clientData.totalAmount += payment.amount
      clientData.transactionCount += 1
      clientData.transactions.push(payment)

      if (payment.status === 'COMPLETED') {
        clientData.completedAmount += payment.amount
        clientData.completedCount += 1
      } else if (payment.status === 'PENDING') {
        clientData.pendingAmount += payment.amount
      }
    })

    return NextResponse.json({
      transactions: payments,
      clientTotals: Array.from(clientTotals.values()).sort((a, b) => b.completedAmount - a.completedAmount),
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

