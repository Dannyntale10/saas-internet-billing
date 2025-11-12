'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function AdminPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (!session) {
      console.log('No session, redirecting to login')
      router.push('/auth/login?role=admin')
      return
    }

    if (!session.user) {
      console.log('No user in session, redirecting to login')
      router.push('/auth/login?role=admin')
      return
    }

    // Check role - handle both uppercase and lowercase
    const userRole = session.user.role?.toUpperCase()
    console.log('Admin page - User role:', userRole)

    // STRICT: Only ADMIN users can access admin section
    if (userRole !== 'ADMIN') {
      console.error('❌ Access denied: User role', userRole, 'cannot access admin section')
      // Sign out and redirect to appropriate login
      signOut({ redirect: false, callbackUrl: `/auth/login?role=${userRole.toLowerCase()}` }).then(() => {
        router.push(`/auth/login?role=${userRole.toLowerCase()}&error=access_denied`)
      })
      return
    }

    // User is admin, redirect to dashboard
    console.log('User is admin, redirecting to admin dashboard')
    router.push('/admin/dashboard')
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <p className="text-white">Redirecting...</p>
    </div>
  )
}
