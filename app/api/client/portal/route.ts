import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const portal = await prisma.clientPortal.findUnique({
      where: { clientId: session.user.id },
    })

    return NextResponse.json({ portal })
  } catch (error) {
    console.error('Error fetching portal:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portal' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const clientId = session.user.id

    // Prepare update data - only include fields that are provided
    const updateData: any = {
      companyName: body.companyName || 'My WiFi',
    }

    // Helper function to convert empty strings to null
    const toNullIfEmpty = (value: any): string | null => {
      if (value === undefined) return undefined as any
      return value === '' || value === null ? null : value
    }

    // Only update fields that are provided (not undefined)
    // Convert empty strings to null to avoid database issues
    if (body.logoUrl !== undefined) updateData.logoUrl = toNullIfEmpty(body.logoUrl)
    if (body.backgroundImageUrl !== undefined) updateData.backgroundImageUrl = toNullIfEmpty(body.backgroundImageUrl)
    if (body.phone1 !== undefined) updateData.phone1 = toNullIfEmpty(body.phone1)
    if (body.phone2 !== undefined) updateData.phone2 = toNullIfEmpty(body.phone2)
    if (body.whatsapp !== undefined) updateData.whatsapp = toNullIfEmpty(body.whatsapp)
    if (body.email !== undefined) updateData.email = toNullIfEmpty(body.email)
    if (body.facebook !== undefined) updateData.facebook = toNullIfEmpty(body.facebook)
    if (body.twitter !== undefined) updateData.twitter = toNullIfEmpty(body.twitter)
    if (body.instagram !== undefined) updateData.instagram = toNullIfEmpty(body.instagram)
    if (body.linkedin !== undefined) updateData.linkedin = toNullIfEmpty(body.linkedin)
    if (body.website !== undefined) updateData.website = toNullIfEmpty(body.website)
    if (body.welcomeMessage !== undefined) updateData.welcomeMessage = toNullIfEmpty(body.welcomeMessage)
    if (body.showFreeTrial !== undefined) updateData.showFreeTrial = body.showFreeTrial
    if (body.freeTrialText !== undefined) updateData.freeTrialText = toNullIfEmpty(body.freeTrialText)
    if (body.showVoucherInput !== undefined) updateData.showVoucherInput = body.showVoucherInput
    if (body.showPackages !== undefined) updateData.showPackages = body.showPackages
    if (body.showPaymentMethods !== undefined) updateData.showPaymentMethods = body.showPaymentMethods
    if (body.primaryColor !== undefined) updateData.primaryColor = body.primaryColor || '#76D74C'
    if (body.secondaryColor !== undefined) updateData.secondaryColor = body.secondaryColor || '#1e293b'
    if (body.backgroundColor !== undefined) updateData.backgroundColor = body.backgroundColor || '#0f172a'
    if (body.footerText !== undefined) updateData.footerText = body.footerText || 'Powered by JENDA MOBILITY'
    if (body.showPoweredBy !== undefined) updateData.showPoweredBy = body.showPoweredBy
    if (body.mtnMobileMoneyNumber !== undefined) updateData.mtnMobileMoneyNumber = toNullIfEmpty(body.mtnMobileMoneyNumber)
    if (body.airtelMoneyNumber !== undefined) updateData.airtelMoneyNumber = toNullIfEmpty(body.airtelMoneyNumber)

    // Prepare create data (same structure as update)
    const createData: any = {
      clientId,
      companyName: body.companyName || 'My WiFi',
      logoUrl: body.logoUrl && body.logoUrl !== '' ? body.logoUrl : null,
      backgroundImageUrl: body.backgroundImageUrl && body.backgroundImageUrl !== '' ? body.backgroundImageUrl : null,
      phone1: body.phone1 && body.phone1 !== '' ? body.phone1 : null,
      phone2: body.phone2 && body.phone2 !== '' ? body.phone2 : null,
      whatsapp: body.whatsapp && body.whatsapp !== '' ? body.whatsapp : null,
      email: body.email && body.email !== '' ? body.email : null,
      facebook: body.facebook && body.facebook !== '' ? body.facebook : null,
      twitter: body.twitter && body.twitter !== '' ? body.twitter : null,
      instagram: body.instagram && body.instagram !== '' ? body.instagram : null,
      linkedin: body.linkedin && body.linkedin !== '' ? body.linkedin : null,
      website: body.website && body.website !== '' ? body.website : null,
      welcomeMessage: body.welcomeMessage && body.welcomeMessage !== '' ? body.welcomeMessage : null,
      showFreeTrial: body.showFreeTrial ?? true,
      freeTrialText: body.freeTrialText && body.freeTrialText !== '' ? body.freeTrialText : null,
      showVoucherInput: body.showVoucherInput ?? true,
      showPackages: body.showPackages ?? true,
      showPaymentMethods: body.showPaymentMethods ?? true,
      primaryColor: body.primaryColor || '#76D74C',
      secondaryColor: body.secondaryColor || '#1e293b',
      backgroundColor: body.backgroundColor || '#0f172a',
      footerText: body.footerText || 'Powered by JENDA MOBILITY',
      showPoweredBy: body.showPoweredBy ?? true,
      mtnMobileMoneyNumber: body.mtnMobileMoneyNumber && body.mtnMobileMoneyNumber !== '' ? body.mtnMobileMoneyNumber : null,
      airtelMoneyNumber: body.airtelMoneyNumber && body.airtelMoneyNumber !== '' ? body.airtelMoneyNumber : null,
    }

    // Upsert portal settings
    const portal = await prisma.clientPortal.upsert({
      where: { clientId },
      update: updateData,
      create: createData,
    })

    return NextResponse.json({ portal })
  } catch (error: any) {
    console.error('Error updating portal:', error)
    // Provide more detailed error message
    const errorMessage = error?.message || 'Failed to update portal'
    console.error('Detailed error:', {
      message: errorMessage,
      code: error?.code,
      meta: error?.meta,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    })
    
    // Check for specific Prisma errors
    let hint = undefined
    if (error?.code === 'P2002') {
      hint = 'A portal already exists for this client. This should not happen.'
    } else if (error?.code === 'P2025') {
      hint = 'Record not found. Try refreshing the page.'
    } else if (error?.message?.includes('Unknown arg')) {
      hint = 'Database schema may need migration. Run: npx prisma db push'
    } else if (error?.message?.includes('String too long') || error?.message?.includes('too large')) {
      hint = 'The image file is too large. Please use a smaller image (max 5MB) or compress it.'
    } else if (error?.message?.includes('Invalid value')) {
      hint = 'One of the field values is invalid. Please check your input.'
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update portal',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        hint: hint,
        code: error?.code,
      },
      { status: 500 }
    )
  }
}

