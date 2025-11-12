'use client'

import { useState, useCallback } from 'react'
import { useToast } from './useToast'

interface UseAsyncOptions {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  showErrorToast?: boolean
  showSuccessToast?: boolean
  successMessage?: string
}

export function useAsync<T = any>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<T | null>(null)
  const toast = useToast()

  const execute = useCallback(
    async (
      asyncFunction: () => Promise<T>,
      options: UseAsyncOptions = {}
    ) => {
      const {
        onSuccess,
        onError,
        showErrorToast = true,
        showSuccessToast = false,
        successMessage,
      } = options

      setLoading(true)
      setError(null)

      try {
        const result = await asyncFunction()
        setData(result)

        if (showSuccessToast && successMessage) {
          toast.showSuccess(successMessage)
        }

        if (onSuccess) {
          onSuccess(result)
        }

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An error occurred')
        setError(error)

        if (showErrorToast) {
          toast.showError(error.message || 'Something went wrong')
        }

        if (onError) {
          onError(error)
        }

        throw error
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setData(null)
  }, [])

  return {
    loading,
    error,
    data,
    execute,
    reset,
  }
}

