'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Wifi, Smartphone, Clock, DollarSign, Facebook, Twitter, Instagram, Linkedin, Globe, MessageCircle, Phone } from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { useToast } from '@/hooks/useToast'

interface ClientPortal {
  companyName: string
  logoUrl?: string
  phone1?: string
  phone2?: string
  whatsapp?: string
  email?: string
  facebook?: string
  twitter?: string
  instagram?: string
  linkedin?: string
  website?: string
  welcomeMessage?: string
  showFreeTrial: boolean
  freeTrialText?: string
  showVoucherInput: boolean
  showPackages: boolean
  showPaymentMethods: boolean
  primaryColor?: string
  secondaryColor?: string
  backgroundColor?: string
  footerText?: string
  showPoweredBy: boolean
}

interface Package {
  id: string
  name: string
  price: number
  currency: string
  timeLimit?: number
  dataLimit?: number
  speedLimit?: number
}

function PortalContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || null
  const [portal, setPortal] = useState<ClientPortal | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [voucherCode, setVoucherCode] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'MTN_MOBILE_MONEY' | 'AIRTEL_MONEY' | null>(null)
  const [userInfo, setUserInfo] = useState<{ ip?: string; mac?: string }>({})
  const toast = useToast()

  useEffect(() => {
    fetchPortalData()
    fetchUserInfo()
  }, [clientId])

  const fetchPortalData = async () => {
    try {
      setLoading(true)
      const url = clientId 
        ? `/api/portal?clientId=${clientId}`
        : '/api/portal'
      
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load portal')
      
      const data = await res.json()
      setPortal(data.portal)
      setPackages(data.packages || [])
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load portal')
      setError(error)
      toast.showError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserInfo = async () => {
    try {
      const res = await fetch('/api/portal/user-info')
      if (res.ok) {
        const data = await res.json()
        setUserInfo({ ip: data.ip, mac: data.mac })
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err)
    }
  }

  const handleVoucherLogin = async () => {
    if (!voucherCode.trim()) {
      toast.showError('Please enter a voucher code')
      return
    }

    try {
      const res = await fetch('/api/vouchers/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode }),
      })

      if (res.ok) {
        toast.showSuccess('Voucher activated successfully!')
        // Redirect or show success
        setTimeout(() => {
          window.location.href = '/success'
        }, 1500)
      } else {
        const data = await res.json()
        toast.showError(data.error || 'Invalid voucher code')
      }
    } catch (err) {
      toast.showError('Failed to activate voucher')
    }
  }

  const handleBuyPackage = async (packageId: string) => {
    if (!paymentMethod) {
      toast.showError('Please select a payment method')
      return
    }

    setSelectedPackage(packageId)
    // Redirect to payment page
    window.location.href = `/payment?package=${packageId}&method=${paymentMethod}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-gradient flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  if (error || !portal) {
    return (
      <div className="min-h-screen bg-brand-gradient flex items-center justify-center p-4">
        <ErrorDisplay 
          error={error || 'Portal not found'} 
          onRetry={fetchPortalData}
        />
      </div>
    )
  }

  const primaryColor = portal.primaryColor || '#76D74C'
  const secondaryColor = portal.secondaryColor || '#1e293b'
  const backgroundColor = portal.backgroundColor || '#0f172a'

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            Sign in to {portal.companyName}
          </h1>
          <p className="text-sm text-gray-300">
            {portal.welcomeMessage || 'Please buy a package to use the hotspot service'}
          </p>
        </div>

        {/* Main Card */}
        <div 
          className="rounded-2xl p-6 shadow-2xl"
          style={{ backgroundColor: '#f3f4f6' }}
        >
          {/* Company Logo/Name */}
          <div className="text-center mb-6">
            {portal.logoUrl ? (
              <div className="relative h-16 w-16 mx-auto mb-3">
                <Image
                  src={portal.logoUrl}
                  alt={portal.companyName}
                  fill
                  className="object-contain"
                />
              </div>
            ) : null}
            <h2 
              className="text-3xl font-bold mb-2"
              style={{ color: secondaryColor }}
            >
              {portal.companyName}
            </h2>
          </div>

          {/* Free Trial Message */}
          {portal.showFreeTrial && portal.freeTrialText && (
            <p className="text-sm text-gray-700 mb-4 text-center">
              {portal.freeTrialText.split('click here').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <a 
                      href="/free-trial" 
                      className="text-brand-green font-semibold hover:underline"
                      style={{ color: primaryColor }}
                    >
                      click here
                    </a>
                  )}
                </span>
              ))}
            </p>
          )}

          {/* Voucher Input */}
          {portal.showVoucherInput && (
            <div className="mb-6">
              <input
                type="text"
                placeholder="Enter Voucher Code"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-green mb-4"
                style={{ 
                  focusRingColor: primaryColor,
                  '--tw-ring-color': primaryColor
                } as any}
              />
              <button
                onClick={handleVoucherLogin}
                className="w-full py-3 rounded-lg text-white font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: primaryColor }}
              >
                Login
              </button>
            </div>
          )}

          {/* User Info */}
          {(userInfo.ip || userInfo.mac) && (
            <div className="text-xs text-gray-600 mb-4 text-center">
              {userInfo.ip && <span>IP: {userInfo.ip}</span>}
              {userInfo.ip && userInfo.mac && <span> | </span>}
              {userInfo.mac && <span>MAC: {userInfo.mac}</span>}
            </div>
          )}

          {/* Buy A Package Section */}
          {portal.showPackages && packages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4" style={{ color: secondaryColor }}>
                Buy A Package
              </h3>

              {/* Payment Methods */}
              {portal.showPaymentMethods && (
                <div className="mb-4">
                  <p className="text-sm text-gray-700 mb-2">Pay With</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPaymentMethod('AIRTEL_MONEY')}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        paymentMethod === 'AIRTEL_MONEY'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-8 w-8 bg-red-500 rounded"></div>
                        <span className="text-sm font-medium">Airtel Money</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('MTN_MOBILE_MONEY')}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        paymentMethod === 'MTN_MOBILE_MONEY'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-8 w-8 bg-yellow-500 rounded"></div>
                        <span className="text-sm font-medium">MTN MoMo</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Package List */}
              <div className="space-y-3">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{pkg.name}</p>
                      {pkg.timeLimit && (
                        <p className="text-xs text-gray-500">
                          {pkg.timeLimit} hours
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold" style={{ color: secondaryColor }}>
                        {pkg.currency} {pkg.price.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleBuyPackage(pkg.id)}
                        disabled={!paymentMethod}
                        className="px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                        style={{ 
                          backgroundColor: paymentMethod ? primaryColor : '#9ca3af'
                        }}
                      >
                        BUY
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="border-t border-gray-300 pt-4 mt-6">
            <p className="text-sm text-gray-700 mb-2 text-center">
              For help Call/WhatsApp
            </p>
            <div className="flex flex-col items-center gap-1 mb-4">
              {portal.phone1 && (
                <a 
                  href={`tel:${portal.phone1}`}
                  className="text-sm font-medium hover:underline"
                  style={{ color: primaryColor }}
                >
                  {portal.phone1}
                </a>
              )}
              {portal.phone2 && (
                <a 
                  href={`tel:${portal.phone2}`}
                  className="text-sm font-medium hover:underline"
                  style={{ color: primaryColor }}
                >
                  {portal.phone2}
                </a>
              )}
              {portal.whatsapp && (
                <a 
                  href={`https://wa.me/${portal.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline flex items-center gap-1"
                  style={{ color: primaryColor }}
                >
                  <MessageCircle className="h-4 w-4" />
                  {portal.whatsapp}
                </a>
              )}
            </div>

            {/* Social Media */}
            {(portal.facebook || portal.twitter || portal.instagram || portal.linkedin || portal.website) && (
              <div className="flex justify-center gap-3 mb-4">
                {portal.facebook && (
                  <a
                    href={portal.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
                {portal.twitter && (
                  <a
                    href={portal.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 rounded-full bg-sky-500 flex items-center justify-center text-white hover:bg-sky-600 transition-colors"
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
                {portal.instagram && (
                  <a
                    href={portal.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 rounded-full bg-pink-600 flex items-center justify-center text-white hover:bg-pink-700 transition-colors"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {portal.linkedin && (
                  <a
                    href={portal.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 rounded-full bg-blue-700 flex items-center justify-center text-white hover:bg-blue-800 transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                {portal.website && (
                  <a
                    href={portal.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {portal.showPoweredBy && portal.footerText && (
          <p className="text-center text-gray-400 text-xs mt-4">
            {portal.footerText}
          </p>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-gradient flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading portal..." />
      </div>
    }>
      <PortalContent />
    </Suspense>
  )
}
