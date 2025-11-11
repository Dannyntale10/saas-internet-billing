import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function Home() {
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
}

