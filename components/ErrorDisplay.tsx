'use client'

import { AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface ErrorDisplayProps {
  error: Error | string | null
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  title?: string
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  className,
  title = 'An error occurred',
}: ErrorDisplayProps) {
  if (!error) return null

  const errorMessage = typeof error === 'string' ? error : error.message

  return (
    <div
      className={cn(
        'rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4',
        className
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            {title}
          </h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            {errorMessage}
          </p>
          {onRetry && (
            <div className="mt-3">
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/40"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
        {onDismiss && (
          <div className="ml-auto flex-shrink-0">
            <button
              onClick={onDismiss}
              className="inline-flex rounded-md text-red-400 hover:text-red-600 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

