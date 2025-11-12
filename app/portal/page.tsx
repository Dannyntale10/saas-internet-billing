'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Wifi, Smartphone, Clock, DollarSign, Facebook, Twitter, Instagram, Linkedin, Globe, MessageCircle, Phone } from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/Card'

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
  const toast = useToast()

  useEffect(() => {
    fetchPortalData()
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
      setPortal(data.portal || data)
      setPackages(data.packages || [])
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load portal')
      setError(error)
      toast.showError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVoucherLogin = async (e: React.FormEvent) => {
    e.preventDefault()
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

      const data = await res.json()

      if (res.ok) {
        toast.showSuccess(data.message || 'Voucher activated successfully!')
        setVoucherCode('')
      } else {
        toast.showError(data.error || 'Failed to activate voucher')
      }
    } catch (error) {
      console.error('Error activating voucher:', error)
      toast.showError('An unexpected error occurred')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-gradient flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading WiFi Portal..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-gradient flex items-center justify-center">
        <ErrorDisplay error={error} onRetry={fetchPortalData} />
      </div>
    )
  }

  if (!portal) {
    return (
      <div className="min-h-screen bg-brand-gradient flex items-center justify-center">
        <ErrorDisplay error="Portal configuration not found." onRetry={fetchPortalData} />
      </div>
    )
  }

  const dynamicBgStyle = portal.backgroundColor ? { backgroundColor: portal.backgroundColor } : {}
  const dynamicPrimaryColor = portal.primaryColor || '#76D74C'
  const dynamicSecondaryColor = portal.secondaryColor || '#1e293b'

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6"
      style={dynamicBgStyle}
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 space-y-6 animate-slide-up glass-dark">
        {/* Header */}
        <div className="text-center">
          {portal.logoUrl && (
            <Image
              src={portal.logoUrl}
              alt={`${portal.companyName} Logo`}
              width={120}
              height={120}
              className="mx-auto mb-4 object-contain"
              priority
            />
          )}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" style={{ color: dynamicPrimaryColor }}>
            {portal.companyName || 'WiFi Hotspot'}
          </h1>
          {portal.welcomeMessage && (
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{portal.welcomeMessage}</p>
          )}
        </div>

        {/* Voucher Input */}
        {portal.showVoucherInput && (
          <form onSubmit={handleVoucherLogin} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter Voucher Code"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              className="w-full text-center"
            />
            <Button type="submit" className="w-full btn-glow" style={{ backgroundColor: dynamicPrimaryColor }}>
              Login with Voucher
            </Button>
          </form>
        )}

        {/* Buy A Package */}
        {portal.showPackages && packages.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center" style={{ color: dynamicSecondaryColor }}>Buy A Package</h2>
            {portal.showPaymentMethods && (
              <div className="flex justify-center space-x-4 mb-4">
                <Image src="/mtn-momo.png" alt="MTN MoMo" width={60} height={40} className="object-contain" />
                <Image src="/airtel-money.png" alt="Airtel Money" width={60} height={40} className="object-contain" />
              </div>
            )}
            <div className="grid grid-cols-1 gap-3">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="flex items-center justify-between p-4 card-modern">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{pkg.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {pkg.dataLimit ? `${pkg.dataLimit}GB` : ''} {pkg.timeLimit ? `${pkg.timeLimit}Hrs` : ''} {pkg.speedLimit ? `${pkg.speedLimit}Mbps` : ''}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-lg" style={{ color: dynamicPrimaryColor }}>{pkg.currency} {pkg.price.toLocaleString()}</span>
                    <Button size="sm" style={{ backgroundColor: dynamicPrimaryColor }}>
                      BUY
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Contact Info */}
        {(portal.phone1 || portal.whatsapp || portal.email) && (
          <div className="space-y-2 text-center text-gray-700 dark:text-gray-300">
            <h3 className="text-lg font-semibold" style={{ color: dynamicSecondaryColor }}>Need Help?</h3>
            {portal.phone1 && (
              <p className="flex items-center justify-center text-sm">
                <Phone className="h-4 w-4 mr-2" /> Call: {portal.phone1}
              </p>
            )}
            {portal.whatsapp && (
              <p className="flex items-center justify-center text-sm">
                <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp: {portal.whatsapp}
              </p>
            )}
            {portal.email && (
              <p className="flex items-center justify-center text-sm">
                <MessageCircle className="h-4 w-4 mr-2" /> Email: {portal.email}
              </p>
            )}
          </div>
        )}

        {/* Social Media */}
        {(portal.facebook || portal.twitter || portal.instagram || portal.linkedin || portal.website) && (
          <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {portal.facebook && <a href={portal.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"><Facebook className="h-6 w-6" /></a>}
            {portal.twitter && <a href={portal.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-400 dark:text-gray-400 dark:hover:text-blue-300"><Twitter className="h-6 w-6" /></a>}
            {portal.instagram && <a href={portal.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-pink-500 dark:text-gray-400 dark:hover:text-pink-400"><Instagram className="h-6 w-6" /></a>}
            {portal.linkedin && <a href={portal.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-700 dark:text-gray-400 dark:hover:text-blue-500"><Linkedin className="h-6 w-6" /></a>}
            {portal.website && <a href={portal.website} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-brand-green dark:text-gray-400 dark:hover:text-brand-green"><Globe className="h-6 w-6" /></a>}
          </div>
        )}

        {/* Footer */}
        {portal.showPoweredBy && portal.footerText && (
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
            {portal.footerText}
          </p>
        )}
      </div>
    </div>
  )
}

export default function PortalPage() {
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

