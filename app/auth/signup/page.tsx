'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Mail, Phone, Lock, User, Building2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role') || 'client'
  const toast = useToast()

  const [signupMethod, setSignupMethod] = useState<'email' | 'phone'>('email')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    acceptTerms: false,
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (signupMethod === 'email') {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }
    } else {
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required'
      } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Please enter a valid phone number (e.g., +256702772200)'
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and a number'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (roleParam === 'client' && !formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required for client accounts'
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.showError('Please fix the errors in the form')
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: signupMethod === 'email' ? formData.email : undefined,
          phone: signupMethod === 'phone' ? formData.phone : formData.phone || undefined,
          password: formData.password,
          role: roleParam === 'client' ? 'CLIENT' : 'END_USER',
          companyName: roleParam === 'client' ? formData.companyName : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      toast.showSuccess('Account created successfully! Please login.')
      router.push(`/auth/login?role=${roleParam}`)
    } catch (error: any) {
      console.error('Signup error:', error)
      toast.showError(error.message || 'Failed to create account. Please try again.')
      setErrors({ submit: error.message || 'Signup failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-gradient px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl">
        <div className="flex flex-col items-center">
          <Logo size="lg" className="mb-4" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {roleParam === 'client' ? 'Sign up as a client' : 'Sign up as an end user'}
          </p>
        </div>

        {/* Signup Method Toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setSignupMethod('email')
              setErrors({})
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              signupMethod === 'email'
                ? 'bg-white dark:bg-gray-600 text-brand-green shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Mail className="h-4 w-4 inline mr-2" />
            Email
          </button>
          <button
            type="button"
            onClick={() => {
              setSignupMethod('phone')
              setErrors({})
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              signupMethod === 'phone'
                ? 'bg-white dark:bg-gray-600 text-brand-green shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Phone className="h-4 w-4 inline mr-2" />
            Phone
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{errors.submit}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  required
                  className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (errors.name) setErrors({ ...errors, name: '' })
                  }}
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Email or Phone */}
            {signupMethod === 'email' ? (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    required
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (errors.email) setErrors({ ...errors, email: '' })
                    }}
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
            ) : (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    required
                    className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                    placeholder="+256702772200"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value })
                      if (errors.phone) setErrors({ ...errors, phone: '' })
                    }}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                <p className="mt-1 text-xs text-gray-500">Include country code (e.g., +256 for Uganda)</p>
              </div>
            )}

            {/* Company Name (for clients) */}
            {roleParam === 'client' && (
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="companyName"
                    type="text"
                    required
                    className={`pl-10 ${errors.companyName ? 'border-red-500' : ''}`}
                    placeholder="Your Company Name"
                    value={formData.companyName}
                    onChange={(e) => {
                      setFormData({ ...formData, companyName: e.target.value })
                      if (errors.companyName) setErrors({ ...errors, companyName: '' })
                    }}
                  />
                </div>
                {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    if (errors.password) setErrors({ ...errors, password: '' })
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              <p className="mt-1 text-xs text-gray-500">At least 8 characters with uppercase, lowercase, and a number</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value })
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' })
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                id="acceptTerms"
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => {
                  setFormData({ ...formData, acceptTerms: e.target.checked })
                  if (errors.acceptTerms) setErrors({ ...errors, acceptTerms: '' })
                }}
                className="h-4 w-4 text-brand-green focus:ring-brand-green border-gray-300 rounded mt-1"
              />
              <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                I agree to the{' '}
                <Link href="/terms" className="text-brand-green hover:underline">
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-brand-green hover:underline">
                  Privacy Policy
                </Link>
                *
              </label>
            </div>
            {errors.acceptTerms && <p className="text-sm text-red-600">{errors.acceptTerms}</p>}
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              variant="gradient"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href={`/auth/login?role=${roleParam}`} className="font-medium text-brand-green hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-brand-gradient">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}

