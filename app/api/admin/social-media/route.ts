import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET social media handles
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get social media from first admin user or create default
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
      }
    })

    // For now, we'll use localStorage on client side, but in production you'd store this in a SystemSettings table
    // This is a simple implementation - you can enhance it later with a proper SystemSettings model
    
    return NextResponse.json({
      success: true,
      socialMedia: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
        youtube: '',
        whatsapp: '',
        website: '',
      }
    })
  } catch (error) {
    console.error('Error fetching social media:', error)
    return NextResponse.json(
      { error: 'Failed to fetch social media' },
      { status: 500 }
    )
  }
}

// POST/PUT social media handles
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { facebook, twitter, instagram, linkedin, youtube, whatsapp, website } = body

    // In production, save to SystemSettings table
    // For now, we'll return success and the client will save to localStorage
    // You can enhance this later with a proper database model
    
    return NextResponse.json({
      success: true,
      message: 'Social media handles saved successfully',
      socialMedia: {
        facebook: facebook || '',
        twitter: twitter || '',
        instagram: instagram || '',
        linkedin: linkedin || '',
        youtube: youtube || '',
        whatsapp: whatsapp || '',
        website: website || '',
      }
    })
  } catch (error) {
    console.error('Error saving social media:', error)
    return NextResponse.json(
      { error: 'Failed to save social media' },
      { status: 500 }
    )
  }
}

