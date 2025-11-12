import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"

// Utility functions for password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Get session helper
export async function getSession() {
  return getServerSession(authOptions)
}

// Token verification (for legacy API routes - now using NextAuth)
export async function verifyToken(token: string) {
  // This is a placeholder - NextAuth handles tokens differently
  // For API routes, use getServerSession instead
  return null
}

// Legacy token generation (for backward compatibility)
export async function generateToken(userId: string, email: string, role: string): Promise<string> {
  // NextAuth handles tokens automatically, but for legacy routes we can create a simple token
  const jwt = require('jsonwebtoken')
  return jwt.sign(
    { userId, email, role },
    process.env.NEXTAUTH_SECRET || 'fallback-secret',
    { expiresIn: '30d' }
  )
}

// Legacy session creation (for backward compatibility)
export async function createSession(userId: string, token: string) {
  // NextAuth handles sessions automatically
  // This is for legacy API routes that expect session creation
  return { userId, token }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log('🔍 Authorization attempt for:', credentials?.email)
          
          if (!credentials?.email || !credentials?.password) {
            console.error('❌ Missing credentials')
            throw new Error('Email and password are required')
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email.trim().toLowerCase() }
          })

          if (!user) {
            console.error(`❌ User not found: ${credentials.email}`)
            throw new Error('Invalid email or password')
          }

          if (!user.isActive) {
            console.error(`❌ User account is inactive: ${credentials.email}`)
            throw new Error('Account is inactive. Please contact support.')
          }

          console.log('🔐 Verifying password...')
          const isValid = await bcrypt.compare(credentials.password, user.password)

          if (!isValid) {
            console.error(`❌ Invalid password for: ${credentials.email}`)
            throw new Error('Invalid email or password')
          }

          // Check if role matches the expected role from credentials (if provided)
          // This is a secondary check - the main role validation happens in the login page
          const expectedRole = credentials.role // Can be passed from login page
          if (expectedRole) {
            const userRole = user.role.toUpperCase()
            const expectedRoleUpper = expectedRole.toUpperCase()
            if (userRole !== expectedRoleUpper) {
              console.error(`❌ Role mismatch: User is ${userRole}, expected ${expectedRoleUpper}`)
              throw new Error(`Access denied. This account is for ${userRole} access.`)
            }
          }

          console.log(`✅ Successful login: ${user.email} (${user.role})`)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            parentClientId: user.parentClientId,
          }
        } catch (error: any) {
          console.error('❌ Authorization error:', error)
          // Return null for NextAuth to show generic error
          // The error message will be logged above
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.parentClientId = user.parentClientId
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.parentClientId = token.parentClientId as string | null
        session.user.email = (token.email as string) || session.user.email
        session.user.name = (token.name as string) || session.user.name
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

