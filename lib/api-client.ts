import toast from 'react-hot-toast'

interface ApiOptions extends RequestInit {
  showToast?: boolean
  errorMessage?: string
  successMessage?: string
}

export async function apiClient<T>(
  url: string,
  options: ApiOptions = {}
): Promise<T> {
  const {
    showToast = true,
    errorMessage,
    successMessage,
    ...fetchOptions
  } = options

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      const errorMsg = errorMessage || data.error || data.message || 'An error occurred'
      
      if (showToast) {
        toast.error(errorMsg)
      }
      
      throw new Error(errorMsg)
    }

    if (successMessage && showToast) {
      toast.success(successMessage)
    }

    return data as T
  } catch (error: any) {
    if (showToast && !errorMessage) {
      toast.error(error.message || 'Network error. Please try again.')
    }
    throw error
  }
}

// Convenience methods
export const api = {
  get: <T>(url: string, options?: ApiOptions) =>
    apiClient<T>(url, { ...options, method: 'GET' }),
  
  post: <T>(url: string, data?: any, options?: ApiOptions) =>
    apiClient<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  put: <T>(url: string, data?: any, options?: ApiOptions) =>
    apiClient<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: <T>(url: string, options?: ApiOptions) =>
    apiClient<T>(url, { ...options, method: 'DELETE' }),
}

