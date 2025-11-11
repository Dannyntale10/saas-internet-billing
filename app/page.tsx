import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function Home() {
  // Check if required environment variables are set
  if (!process.env.DATABASE_URL || !process.env.NEXTAUTH_SECRET) {
    redirect('/setup-check')
  }

  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      redirect('/auth/login')
    }

    // Redirect based on role
    if (session.user.role === 'ADMIN') {
      redirect('/admin/dashboard')
    } else if (session.user.role === 'CLIENT') {
      redirect('/client/dashboard')
    } else {
      redirect('/user/dashboard')
    }
  } catch (error) {
    // If there's an error (likely database connection), redirect to setup check
    console.error('Home page error:', error)
    redirect('/setup-check')
  }
}

