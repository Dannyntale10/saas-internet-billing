import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    if (!query.trim()) {
      return NextResponse.json({ results: [] })
    }

    const results = []

    // Search users
    if (session.user.role === 'ADMIN' || session.user.role === 'CLIENT') {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5,
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      })

      users.forEach((user) => {
        results.push({
          id: user.id,
          type: 'user',
          title: user.name || user.email,
          subtitle: user.email,
          url: session.user.role === 'ADMIN' 
            ? `/admin/users/${user.id}` 
            : `/client/users/${user.id}`
        })
      })
    }

    // Search vouchers
    const vouchers = await prisma.voucher.findMany({
      where: {
        OR: [
          { code: { contains: query.toUpperCase(), mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5,
      include: {
        client: true
      }
    })

    vouchers.forEach((voucher) => {
      results.push({
        id: voucher.id,
        type: 'voucher',
        title: voucher.code,
        subtitle: voucher.name || `Status: ${voucher.status}`,
        url: session.user.role === 'ADMIN'
          ? `/admin/vouchers/${voucher.id}`
          : `/client/vouchers/${voucher.id}`
      })
    })

    // Search payments
    if (session.user.role === 'ADMIN' || session.user.role === 'CLIENT') {
      const payments = await prisma.payment.findMany({
        where: {
          OR: [
            { transactionId: { contains: query, mode: 'insensitive' } },
            { reference: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5,
        include: {
          user: {
            select: {
              email: true,
              name: true
            }
          }
        }
      })

      payments.forEach((payment) => {
        results.push({
          id: payment.id,
          type: 'payment',
          title: `Payment ${payment.transactionId || payment.id}`,
          subtitle: `${payment.amount} ${payment.currency} - ${payment.user.name || payment.user.email}`,
          url: session.user.role === 'ADMIN'
            ? `/admin/transactions/${payment.id}`
            : `/client/transactions/${payment.id}`
        })
      })
    }

    return NextResponse.json({ results })

  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed', results: [] },
      { status: 500 }
    )
  }
}

