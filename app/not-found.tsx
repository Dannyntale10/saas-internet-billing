'use client'

import Link from 'next/link'
import Logo from '@/components/Logo'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-gradient px-4">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist.
        </p>
        <Link
          href="/auth/login"
          className="inline-block w-full bg-brand-green text-white px-6 py-3 rounded-md hover:bg-accent transition-colors font-medium"
        >
          Go to Login
        </Link>
      </div>
    </div>
  )
}

