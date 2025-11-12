'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { CreditCard, Smartphone } from 'lucide-react'

export default function BuyVoucherPage() {
  const { data: session } = useSession()
  const [vouchers, setVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'MTN_MOBILE_MONEY' | 'AIRTEL_MONEY' | null>(null)
  const [processing, setProcessing] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)

  useEffect(() => {
    fetchAvailableVouchers()
  }, [])

  // Poll payment status if payment is pending
  useEffect(() => {
    if (paymentId) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/payments/status?paymentId=${paymentId}`)
          const data = await response.json()
          
          if (data.status === 'COMPLETED') {
            toast.success('Payment completed! Your voucher is now active.')
            clearInterval(interval)
            setPaymentId(null)
            setSelectedVoucher(null)
            setPaymentMethod(null)
            fetchAvailableVouchers()
          } else if (data.status === 'FAILED') {
            toast.error('Payment failed. Please try again.')
            clearInterval(interval)
            setPaymentId(null)
          }
        } catch (error) {
          console.error('Status check error:', error)
        }
      }, 3000) // Check every 3 seconds

      return () => clearInterval(interval)
    }
  }, [paymentId])

  const fetchAvailableVouchers = async () => {
    try {
      const response = await fetch('/api/vouchers/available')
      const data = await response.json()
      setVouchers(data.vouchers || [])
    } catch (error) {
      console.error('Error fetching vouchers:', error)
      toast.error('Failed to load vouchers')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!selectedVoucher || !phoneNumber || !paymentMethod) {
      toast.error('Please fill all fields')
      return
    }

    setProcessing(true)

    try {
      const response = await fetch('/api/payments/mobile-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherId: selectedVoucher,
          phoneNumber,
          method: paymentMethod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed')
      }

      setPaymentId(data.paymentId)
      toast.success(data.message || 'Payment request sent. Please approve on your phone.')
    } catch (error: any) {
      toast.error(error.message || 'Payment initiation failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">Loading vouchers...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Buy Internet Voucher</h1>
          <p className="mt-2 text-sm text-gray-600">
            Purchase internet access vouchers using mobile money
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vouchers.map((voucher) => (
                <Card 
                  key={voucher.id}
                  className={`cursor-pointer transition-all ${
                    selectedVoucher === voucher.id 
                      ? 'ring-2 ring-indigo-500 border-indigo-500' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedVoucher(voucher.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{voucher.name || voucher.code}</CardTitle>
                    <p className="text-2xl font-bold text-indigo-600 mt-2">
                      UGX {voucher.price.toLocaleString()}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {voucher.dataLimit && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Data:</span>
                          <span className="font-semibold">{voucher.dataLimit} GB</span>
                        </div>
                      )}
                      {voucher.timeLimit && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-semibold">{voucher.timeLimit} hours</span>
                        </div>
                      )}
                      {voucher.speedLimit && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Speed:</span>
                          <span className="font-semibold">{voucher.speedLimit} Mbps</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {vouchers.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No vouchers available at the moment.</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedVoucher ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        placeholder="+256..."
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('MTN_MOBILE_MONEY')}
                          className={`w-full flex items-center px-4 py-3 border rounded-md transition-colors ${
                            paymentMethod === 'MTN_MOBILE_MONEY'
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Smartphone className="h-5 w-5 mr-2" />
                          <span>MTN Mobile Money</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('AIRTEL_MONEY')}
                          className={`w-full flex items-center px-4 py-3 border rounded-md transition-colors ${
                            paymentMethod === 'AIRTEL_MONEY'
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Smartphone className="h-5 w-5 mr-2" />
                          <span>Airtel Money</span>
                        </button>
                      </div>
                    </div>

                    <Button
                      onClick={handlePayment}
                      disabled={processing || !phoneNumber || !paymentMethod}
                      className="w-full"
                    >
                      {processing ? (
                        'Processing...'
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Now
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Select a voucher to proceed
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

