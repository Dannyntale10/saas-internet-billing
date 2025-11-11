import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

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
          if (!credentials?.email || !credentials?.password) {
            console.error('Missing credentials')
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            console.error(`User not found: ${credentials.email}`)
            return null
          }

          if (!user.isActive) {
            console.error(`User account is inactive: ${credentials.email}`)
            return null
          }

          const isValid = await bcrypt.compare(credentials.password, user.password)

          if (!isValid) {
            console.error(`Invalid password for: ${credentials.email}`)
            return null
          }

          console.log(`Successful login: ${user.email} (${user.role})`)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            parentClientId: user.parentClientId,
          }
        } catch (error) {
          console.error('Authorization error:', error)
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

