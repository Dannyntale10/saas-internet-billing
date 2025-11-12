'use client'

import Logo from '@/components/Logo'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-gradient px-4">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-lg p-8">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Something went wrong!</h2>
        <p className="text-gray-600 mb-4 text-center">
          {error.message || 'An unexpected error occurred'}
        </p>
        {error.digest && (
          <p className="text-sm text-gray-500 mb-4 text-center">
            Error ID: {error.digest}
          </p>
        )}
        <div className="space-y-2">
          <button
            onClick={reset}
            className="w-full bg-brand-green text-white px-4 py-2 rounded-md hover:bg-accent transition-colors"
          >
            Try again
          </button>
          <a
            href="/auth/login"
            className="block w-full text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    </div>
  )
}

