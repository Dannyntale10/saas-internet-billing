'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useToast } from '@/hooks/useToast'
import toast from 'react-hot-toast'

export default function CreateVoucherPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const toastHook = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    dataLimit: '',
    timeLimit: '',
    speedLimit: '',
    validUntil: '',
    quantity: '1',
  })

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading..." />
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    router.push('/auth/login?role=client')
    return null
  }

  // STRICT: Only CLIENT users can access client pages
  const userRole = (session.user.role as string)?.toUpperCase()
  if (userRole !== 'CLIENT') {
    console.error('❌ Access denied: User role', userRole, 'cannot access client pages')
    signOut({ redirect: false, callbackUrl: `/auth/login?role=client` }).then(() => {
      router.push(`/auth/login?role=client&error=access_denied`)
    })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      toast.error('Please enter a valid price')
      return
    }

    if (!formData.quantity || isNaN(parseInt(formData.quantity)) || parseInt(formData.quantity) < 1) {
      toast.error('Please enter a valid quantity (at least 1)')
      return
    }

    setLoading(true)

    try {
      // Prepare data - convert empty strings to null
      const requestData: any = {
        name: formData.name.trim() || undefined,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
      }

      // Only include optional fields if they have values
      if (formData.dataLimit && formData.dataLimit.trim() !== '') {
        const dataLimit = parseFloat(formData.dataLimit)
        if (!isNaN(dataLimit) && dataLimit > 0) {
          requestData.dataLimit = dataLimit
        }
      }

      if (formData.timeLimit && formData.timeLimit.trim() !== '') {
        const timeLimit = parseInt(formData.timeLimit)
        if (!isNaN(timeLimit) && timeLimit > 0) {
          requestData.timeLimit = timeLimit
        }
      }

      if (formData.speedLimit && formData.speedLimit.trim() !== '') {
        const speedLimit = parseInt(formData.speedLimit)
        if (!isNaN(speedLimit) && speedLimit > 0) {
          requestData.speedLimit = speedLimit
        }
      }

      if (formData.validUntil && formData.validUntil.trim() !== '') {
        requestData.validUntil = formData.validUntil
      }

      const response = await fetch('/api/vouchers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.details || data.error || 'Failed to create voucher'
        throw new Error(errorMsg)
      }

      toast.success(data.message || `Successfully created ${data.vouchers?.length || requestData.quantity} voucher(s)!`)
      setTimeout(() => {
        router.push('/client/vouchers')
      }, 1000)
    } catch (error: any) {
      console.error('Voucher creation error:', error)
      toast.error(error.message || 'Failed to create voucher. Please check your input and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mobile-padding">
        <div className="mb-6 sm:mb-8">
          <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">Create Voucher</h1>
          <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
            Generate new internet access vouchers
          </p>
        </div>

        <Card className="max-w-2xl mx-auto animate-slide-up">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Voucher Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Voucher Name (Optional)
                </label>
                <Input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Daily Package"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price (UGX) *
                  </label>
                  <Input
                    type="number"
                    id="price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity *
                  </label>
                  <Input
                    type="number"
                    id="quantity"
                    required
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="1"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="dataLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data Limit (GB)
                  </label>
                  <Input
                    type="number"
                    id="dataLimit"
                    min="0"
                    step="0.1"
                    value={formData.dataLimit}
                    onChange={(e) => setFormData({ ...formData, dataLimit: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Limit (Hours)
                  </label>
                  <Input
                    type="number"
                    id="timeLimit"
                    min="0"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="speedLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Speed (Mbps)
                  </label>
                  <Input
                    type="number"
                    id="speedLimit"
                    min="0"
                    value={formData.speedLimit}
                    onChange={(e) => setFormData({ ...formData, speedLimit: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valid Until (Optional)
                </label>
                <Input
                  type="datetime-local"
                  id="validUntil"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-full sm:w-auto border-2 border-gray-400 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all border-2 border-green-400"
                >
                  {loading ? 'Creating...' : 'Create Voucher(s)'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
