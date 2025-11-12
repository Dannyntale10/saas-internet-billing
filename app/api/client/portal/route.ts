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

    // Upsert portal settings
    const portal = await prisma.clientPortal.upsert({
      where: { clientId },
      update: {
        companyName: body.companyName,
        logoUrl: body.logoUrl,
        phone1: body.phone1,
        phone2: body.phone2,
        whatsapp: body.whatsapp,
        email: body.email,
        facebook: body.facebook,
        twitter: body.twitter,
        instagram: body.instagram,
        linkedin: body.linkedin,
        website: body.website,
        welcomeMessage: body.welcomeMessage,
        showFreeTrial: body.showFreeTrial,
        freeTrialText: body.freeTrialText,
        showVoucherInput: body.showVoucherInput,
        showPackages: body.showPackages,
        showPaymentMethods: body.showPaymentMethods,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        backgroundColor: body.backgroundColor,
        footerText: body.footerText,
        showPoweredBy: body.showPoweredBy,
        mtnMobileMoneyNumber: body.mtnMobileMoneyNumber,
        airtelMoneyNumber: body.airtelMoneyNumber,
      },
      create: {
        clientId,
        companyName: body.companyName || 'My WiFi',
        logoUrl: body.logoUrl,
        phone1: body.phone1,
        phone2: body.phone2,
        whatsapp: body.whatsapp,
        email: body.email,
        facebook: body.facebook,
        twitter: body.twitter,
        instagram: body.instagram,
        linkedin: body.linkedin,
        website: body.website,
        welcomeMessage: body.welcomeMessage,
        showFreeTrial: body.showFreeTrial ?? true,
        freeTrialText: body.freeTrialText,
        showVoucherInput: body.showVoucherInput ?? true,
        showPackages: body.showPackages ?? true,
        showPaymentMethods: body.showPaymentMethods ?? true,
        primaryColor: body.primaryColor || '#76D74C',
        secondaryColor: body.secondaryColor || '#1e293b',
        backgroundColor: body.backgroundColor || '#0f172a',
        footerText: body.footerText || 'Powered by JENDA MOBILITY',
        showPoweredBy: body.showPoweredBy ?? true,
        mtnMobileMoneyNumber: body.mtnMobileMoneyNumber,
        airtelMoneyNumber: body.airtelMoneyNumber,
      },
    })

    return NextResponse.json({ portal })
  } catch (error) {
    console.error('Error updating portal:', error)
    return NextResponse.json(
      { error: 'Failed to update portal' },
      { status: 500 }
    )
  }
}

