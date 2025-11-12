import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateVoucherCode } from '@/lib/utils'

const voucherSchema = z.object({
  name: z.string().optional(),
  dataLimit: z.number().positive().optional().nullable(),
  timeLimit: z.number().int().positive().optional().nullable(),
  speedLimit: z.number().int().positive().optional().nullable(),
  price: z.number().positive(),
  validUntil: z.string().optional().nullable(),
  quantity: z.number().int().positive().default(1),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only CLIENT users can create vouchers (not admins)
    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Unauthorized. Only clients can create vouchers.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    
    // Clean up the body - convert empty strings to null/undefined
    const cleanedBody = {
      ...body,
      name: body.name?.trim() || undefined,
      dataLimit: body.dataLimit === '' || body.dataLimit === null ? null : (body.dataLimit ? Number(body.dataLimit) : null),
      timeLimit: body.timeLimit === '' || body.timeLimit === null ? null : (body.timeLimit ? Number(body.timeLimit) : null),
      speedLimit: body.speedLimit === '' || body.speedLimit === null ? null : (body.speedLimit ? Number(body.speedLimit) : null),
      price: Number(body.price),
      validUntil: body.validUntil === '' || body.validUntil === null ? null : body.validUntil,
      quantity: body.quantity ? Number(body.quantity) : 1,
    }

    // Validate price
    if (!cleanedBody.price || isNaN(cleanedBody.price) || cleanedBody.price <= 0) {
      return NextResponse.json(
        { error: 'Price is required and must be a positive number' },
        { status: 400 }
      )
    }

    const data = voucherSchema.parse(cleanedBody)

    // Client ID is always the logged-in client's ID
    const clientId = session.user.id

    // Generate vouchers
    const vouchers = []
    for (let i = 0; i < data.quantity; i++) {
      let code = generateVoucherCode()
      
      // Ensure unique code
      while (await prisma.voucher.findUnique({ where: { code } })) {
        code = generateVoucherCode()
      }

      // Convert validUntil string to Date if provided
      let validUntilDate: Date | null = null
      if (data.validUntil) {
        try {
          validUntilDate = new Date(data.validUntil)
          // Check if date is valid
          if (isNaN(validUntilDate.getTime())) {
            validUntilDate = null
          }
        } catch {
          validUntilDate = null
        }
      }

      const voucher = await prisma.voucher.create({
        data: {
          code,
          name: data.name || `Voucher ${code}`,
          clientId,
          dataLimit: data.dataLimit ?? null,
          timeLimit: data.timeLimit ?? null,
          speedLimit: data.speedLimit ?? null,
          price: data.price,
          validUntil: validUntilDate,
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
      console.error('Validation error:', error.errors)
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      )
    }

    console.error('Voucher creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

