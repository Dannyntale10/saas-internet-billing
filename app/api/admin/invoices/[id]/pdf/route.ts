import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/middleware'
import { generateInvoicePDF } from '@/lib/pdf-generator'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

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
        user: { select: { email: true, name: true } },
        client: true,
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

    // Generate PDF data
    const pdfData = {
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.createdAt.toISOString().split('T')[0],
      dueDate: invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : null,
      clientName: invoice.client?.name || invoice.user.name || null,
      clientEmail: invoice.client?.email || invoice.user.email || null,
      clientAddress: invoice.client?.address || null,
      items: invoice.transactions.map(t => ({
        description: t.package.name,
        quantity: 1,
        price: t.amount,
        total: t.amount,
      })),
      subtotal: invoice.subtotal || invoice.amount,
      taxRate: invoice.taxRate || 0,
      taxAmount: invoice.taxAmount || 0,
      total: invoice.amount,
      currency: invoice.currency,
      status: invoice.status,
      notes: invoice.notes,
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(pdfData)

    // Save PDF to disk
    const uploadsDir = join(process.cwd(), 'uploads', 'invoices')
    await mkdir(uploadsDir, { recursive: true })
    const filename = `invoice-${invoice.invoiceNumber}-${Date.now()}.pdf`
    const filepath = join(uploadsDir, filename)
    await writeFile(filepath, pdfBuffer)

    // Update invoice with PDF path
    const pdfPath = `/uploads/invoices/${filename}`
    await prisma.invoice.update({
      where: { id: params.id },
      data: { pdfPath },
    })

    // Return PDF as response
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    )
  }
}

