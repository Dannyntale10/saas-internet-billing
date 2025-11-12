import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, password, role = 'END_USER', companyName } = body

    // Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      )
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Either email or phone number is required' },
        { status: 400 }
      )
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (phone && !/^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Include country code (e.g., +256702772200)' },
        { status: 400 }
      )
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain uppercase, lowercase, and a number' },
        { status: 400 }
      )
    }

    if (role === 'CLIENT' && !companyName) {
      return NextResponse.json(
        { error: 'Company name is required for client accounts' },
        { status: 400 }
      )
    }

    // Check if user already exists
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        logger.warn('Duplicate signup attempt', {
          type: 'duplicate_signup_attempt',
          email,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
        })
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        )
      }
    }

    // For phone-based signup, generate email from phone
    const userEmail = email || `phone_${phone.replace(/\s/g, '')}@temp.local`
    
    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userEmail,
        password: hashedPassword,
        name: name.trim(),
        phone: phone || null,
        role: role === 'CLIENT' ? 'CLIENT' : 'END_USER',
        isActive: true,
      },
    })

    // If client, create portal configuration
    if (role === 'CLIENT') {
      await prisma.clientPortal.create({
        data: {
          clientId: user.id,
          companyName: companyName.trim(),
        },
      })
    }

    logger.info('User account created', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    logger.error('Signup error', {
      error: error.message,
      stack: error.stack,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    })

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An account with this email or phone already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 500 }
    )
  }
}

