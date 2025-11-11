import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateVoucherCode } from '@/lib/utils'

const voucherSchema = z.object({
  name: z.string().optional(),
  dataLimit: z.number().positive().optional().nullable(),
  timeLimit: z.number().positive().optional().nullable(),
  speedLimit: z.number().positive().optional().nullable(),
  price: z.number().positive(),
  validUntil: z.string().datetime().optional().nullable(),
  quantity: z.number().int().positive().default(1),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'CLIENT' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const data = voucherSchema.parse(body)

    const clientId = session.user.role === 'ADMIN' 
      ? (body.clientId || session.user.id)
      : session.user.id

    // Generate vouchers
    const vouchers = []
    for (let i = 0; i < data.quantity; i++) {
      let code = generateVoucherCode()
      
      // Ensure unique code
      while (await prisma.voucher.findUnique({ where: { code } })) {
        code = generateVoucherCode()
      }

      const voucher = await prisma.voucher.create({
        data: {
          code,
          name: data.name || `Voucher ${code}`,
          clientId,
          dataLimit: data.dataLimit,
          timeLimit: data.timeLimit,
          speedLimit: data.speedLimit,
          price: data.price,
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
        }
      })

      vouchers.push(voucher)
    }

    return NextResponse.json({ 
      success: true,
      vouchers,
      message: `Successfully created ${vouchers.length} voucher(s)`
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Voucher creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

