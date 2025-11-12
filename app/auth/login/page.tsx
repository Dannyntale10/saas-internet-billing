'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Shield, Users, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role') || 'admin'
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const isAdmin = roleParam === 'admin'
  const isClient = roleParam === 'client'

  // Check for access denied error from URL
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'access_denied') {
      setError('Access denied. Please login with the correct account type for this section.')
    }
  }, [searchParams])

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Normalize role to uppercase for consistent comparison
      const role = (session.user.role as string)?.toUpperCase()
      const expectedRole = roleParam === 'admin' ? 'ADMIN' : roleParam === 'client' ? 'CLIENT' : null
      
      console.log('Login page - Already authenticated, role:', role, 'expected:', expectedRole)
      
      // STRICT: Only allow if role matches the login section
            if (expectedRole && role !== expectedRole) {
              // Sign out and show error
              signOut({ redirect: false }).then(() => {
                setError(`Access denied. This account is for ${role} access. Please use the ${role === 'ADMIN' ? 'Admin' : role === 'CLIENT' ? 'Client' : 'User'} login page.`)
              })
              return
            }
      
      if (role === 'ADMIN') {
        router.push('/admin/dashboard')
      } else if (role === 'CLIENT') {
        router.push('/client/dashboard')
      } else {
        router.push('/user/dashboard')
      }
    }
  }, [status, session, router, roleParam, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('🔐 Attempting login with:', { email, role: roleParam })
      
      // First, verify the API endpoint is accessible
      try {
        const healthCheck = await fetch('/api/auth/providers')
        if (!healthCheck.ok) {
          throw new Error('Authentication API is not accessible')
        }
      } catch (apiError) {
        console.error('❌ API health check failed:', apiError)
        setError('Cannot connect to authentication service. Please check if the server is running.')
        setLoading(false)
        return
      }

      // Attempt sign in - pass role to help with validation
      const result = await signIn('credentials', {
        email: email.trim(),
        password: password,
        role: roleParam, // Pass role to help with validation
        redirect: false,
      })

      console.log('📋 SignIn result:', result)

      if (result?.error) {
        console.error('❌ Login error:', result.error)
        if (result.error === 'CredentialsSignin') {
          setError('Invalid email or password. Access denied. Please check your credentials and try again.')
        } else if (result.error.includes('fetch') || result.error.includes('NEXTAUTH')) {
          setError('Authentication service error. Please check server configuration.')
        } else {
          setError(`Login failed: ${result.error}. Access denied. Please try again or contact support.`)
        }
        setLoading(false)
        return
      }

      if (!result?.ok) {
        console.error('❌ Login failed - result not ok:', result)
        setError('Access denied. Invalid email or password. Please check your credentials and try again.')
        setLoading(false)
        return
      }

      // Login successful - now verify role matches the login section
      console.log('✅ Login successful, verifying role access...')
      
      // Wait for session to be established and cookies to be set
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check session and verify role
      try {
        const sessionRes = await fetch('/api/auth/session', { 
          cache: 'no-store',
          credentials: 'include'
        })
        
        if (!sessionRes.ok) {
          throw new Error(`Session check failed: ${sessionRes.status}`)
        }
        
        const sessionData = await sessionRes.json()
        console.log('👤 Session data:', sessionData)
        
        if (sessionData?.user?.role) {
          // Normalize role to uppercase for consistent comparison
          const userRole = (sessionData.user.role as string).toUpperCase()
          const expectedRole = roleParam === 'admin' ? 'ADMIN' : roleParam === 'client' ? 'CLIENT' : null
          
          console.log(`🎯 User role from session: ${userRole}, expected role: ${expectedRole}`)
          
          // STRICT ROLE VALIDATION: User must match the section they're logging into
          if (expectedRole) {
            if (userRole !== expectedRole) {
              console.error(`❌ Access denied: User role ${userRole} does not match expected role ${expectedRole}`)
              // Sign out immediately since wrong role
              signOut({ redirect: false }).then(() => {
                setError(`Access denied. This account is for ${userRole === 'ADMIN' ? 'Admin' : userRole === 'CLIENT' ? 'Client' : 'End User'} access. Please use the ${userRole === 'ADMIN' ? 'Admin' : userRole === 'CLIENT' ? 'Client' : 'User'} login page.`)
                setLoading(false)
              })
              return
            }
          }
          
          // Role matches - proceed with redirect
          let redirectUrl = '/'
          if (userRole === 'ADMIN') {
            redirectUrl = '/admin/dashboard'
            console.log('✅ Redirecting ADMIN to:', redirectUrl)
          } else if (userRole === 'CLIENT') {
            redirectUrl = '/client/dashboard'
            console.log('✅ Redirecting CLIENT to:', redirectUrl)
          } else {
            redirectUrl = '/user/dashboard'
            console.log('✅ Redirecting END_USER to:', redirectUrl)
          }
          
          // Use window.location for a hard redirect to ensure session is loaded
          window.location.href = redirectUrl
        } else {
          console.warn('⚠️ No user role in session, checking session again...')
          // Wait a bit more and check again
          await new Promise(resolve => setTimeout(resolve, 500))
          const retrySession = await fetch('/api/auth/session', { 
            cache: 'no-store',
            credentials: 'include'
          })
          const retryData = await retrySession.json()
          
          if (retryData?.user?.role) {
            const userRole = (retryData.user.role as string).toUpperCase()
            const expectedRole = roleParam === 'admin' ? 'ADMIN' : roleParam === 'client' ? 'CLIENT' : null
            
            // STRICT ROLE VALIDATION: User must match the section they're logging into
            if (expectedRole) {
              if (userRole !== expectedRole) {
                console.error(`❌ Access denied: User role ${userRole} does not match expected role ${expectedRole}`)
                signOut({ redirect: false }).then(() => {
                  setError(`Access denied. This account is for ${userRole === 'ADMIN' ? 'Admin' : userRole === 'CLIENT' ? 'Client' : 'End User'} access. Please use the ${userRole === 'ADMIN' ? 'Admin' : userRole === 'CLIENT' ? 'Client' : 'User'} login page.`)
                  setLoading(false)
                })
                return
              }
            }
            
            const redirectUrl = userRole === 'ADMIN' ? '/admin/dashboard' 
              : userRole === 'CLIENT' ? '/client/dashboard' 
              : '/user/dashboard'
            console.log(`🔄 Retry successful, redirecting ${userRole} to:`, redirectUrl)
            window.location.href = redirectUrl
          } else {
            console.error('❌ Still no role in session after retry')
            setError('Login successful but session not properly established. Please try again.')
            setLoading(false)
          }
        }
      } catch (sessionError: any) {
        console.error('❌ Error checking session:', sessionError)
        setError('Login successful but unable to verify session. Please refresh the page.')
        setLoading(false)
      }
    } catch (err: any) {
      console.error('❌ Login exception:', err)
      setError(`An error occurred: ${err.message || 'Please try again.'}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern with Green Accent */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(118, 215, 76, 0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with Green Gradient (Brand Colors) */}
          <div className="bg-gradient-to-r from-green-500 via-green-600 to-green-500 px-8 py-6">
            <div className="flex items-center justify-center mb-4">
              <div className="relative h-16 w-16">
                <Image
                  src="/logo.jpg"
                  alt="JENDA MOBILITY Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-1">JENDA MOBILITY</h1>
              <p className="text-green-100 text-sm">Internet Billing System</p>
            </div>
          </div>

          {/* Login Form */}
          <div className="px-8 py-8">
            {/* Role Badge */}
            <div className="flex items-center justify-center mb-6">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                isAdmin 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {isAdmin ? (
                  <>
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-semibold">Admin Login</span>
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-semibold">Client Login</span>
                  </>
                )}
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Welcome Back
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Sign in to access your dashboard
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} method="POST" className="space-y-6" noValidate>
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
                  </button>
                </form>

                {/* Forgot Password Link */}
                <div className="mt-4 text-center">
                  <Link 
                    href={`/auth/forgot-password?role=${roleParam}`} 
                    className="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>

                {/* Sign Up Link */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link 
                      href={`/auth/signup?role=${roleParam}`} 
                      className="font-semibold text-green-600 hover:text-green-700 transition-colors"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>

                {/* Back to Home */}
                <div className="mt-4 text-center">
                  <Link 
                    href="/" 
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ← Back to home
                  </Link>
                </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="mt-6 text-center text-sm text-white/60">
          Secure login powered by NextAuth.js
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
