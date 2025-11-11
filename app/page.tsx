import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function Home() {
  // Check if required environment variables are set
  if (!process.env.DATABASE_URL || !process.env.NEXTAUTH_SECRET) {
    console.error('Missing required environment variables')
    redirect('/setup-check')
  }

  try {
    const session = await getServerSession(authOptions)
    
    console.log('Home page - Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
    })

    if (!session || !session.user) {
      console.log('No session found, redirecting to login')
      redirect('/auth/login')
    }

    // Redirect based on role
    const role = session.user.role
    
    console.log(`Redirecting user ${session.user.email} (${role}) to dashboard`)
    
    if (role === 'ADMIN') {
      redirect('/admin/dashboard')
    } else if (role === 'CLIENT') {
      redirect('/client/dashboard')
    } else {
      redirect('/user/dashboard')
    }
  } catch (error: any) {
    // If there's an error (likely database connection), redirect to setup check
    console.error('Home page error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    })
    // Don't redirect to setup-check if user is logged in - redirect to login instead
    redirect('/auth/login')
  }
}

