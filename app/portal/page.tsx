'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Phone, MessageCircle, Wifi, Clock, Zap, Shield, Sparkles, ArrowRight, CheckCircle2, Gift } from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'

interface ClientPortal {
  companyName: string
  logoUrl?: string
  phone1?: string
  phone2?: string
  whatsapp?: string
  email?: string
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
  mtnMobileMoneyNumber?: string
  airtelMoneyNumber?: string
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
  const [userInfo, setUserInfo] = useState<{ ip?: string; mac?: string }>({})
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'MTN_MOBILE_MONEY' | 'AIRTEL_MONEY' | null>(null)
  const [purchasingPackage, setPurchasingPackage] = useState<Package | null>(null)

  useEffect(() => {
    fetchPortalData()
    fetchUserInfo()
  }, [clientId])

  const fetchUserInfo = async () => {
    try {
      const res = await fetch('/api/portal/user-info')
      if (res.ok) {
        const data = await res.json()
        setUserInfo({
          ip: data.ip || '10.0.0.217',
          mac: data.mac || 'E6:E9:E0:D8:6D:AD'
        })
      }
    } catch (err) {
      // Use default values if API fails
      setUserInfo({
        ip: '10.0.0.217',
        mac: 'E6:E9:E0:D8:6D:AD'
      })
    }
  }

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
      
      // Fetch packages for this client
      const pkgUrl = clientId ? `/api/packages?clientId=${clientId}` : '/api/packages'
      const pkgRes = await fetch(pkgUrl)
      if (pkgRes.ok) {
        const pkgData = await pkgRes.json()
        setPackages(pkgData || [])
      } else {
        // Use packages from portal response if API fails
        if (data.packages && data.packages.length > 0) {
          setPackages(data.packages)
        } else {
          // If still no packages, use defaults
          const defaultPkgs = [
            { id: 'default-1', name: '6hours', price: 500, currency: 'UGX', timeLimit: 6 },
            { id: 'default-2', name: '24hours', price: 1000, currency: 'UGX', timeLimit: 24 },
            { id: 'default-3', name: 'week', price: 5000, currency: 'UGX', timeLimit: 168 },
            { id: 'default-4', name: 'month', price: 20000, currency: 'UGX', timeLimit: 720 },
          ]
          setPackages(defaultPkgs)
        }
      }
      
      // Also check if packages are in the portal response (fallback)
      if (data.packages && data.packages.length > 0 && packages.length === 0) {
        setPackages(data.packages)
      }
      
      // Final fallback: ensure packages are always available
      if (packages.length === 0 && (!data.packages || data.packages.length === 0)) {
        const defaultPkgs = [
          { id: 'default-1', name: '6hours', price: 500, currency: 'UGX', timeLimit: 6 },
          { id: 'default-2', name: '24hours', price: 1000, currency: 'UGX', timeLimit: 24 },
          { id: 'default-3', name: 'week', price: 5000, currency: 'UGX', timeLimit: 168 },
          { id: 'default-4', name: 'month', price: 20000, currency: 'UGX', timeLimit: 720 },
        ]
        setPackages(defaultPkgs)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load portal')
      setError(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVoucherLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!voucherCode.trim()) {
      toast.error('Please enter a voucher code')
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
        toast.success(data.message || 'Voucher activated successfully!', {
          icon: '🎉',
          duration: 5000,
        })
        setVoucherCode('')
      } else {
        toast.error(data.error || 'Failed to activate voucher')
      }
    } catch (error) {
      console.error('Error activating voucher:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const handleBuyPackage = (pkg: Package) => {
    // Show payment method selection if both are available
    if (portal?.mtnMobileMoneyNumber && portal?.airtelMoneyNumber) {
      setPurchasingPackage(pkg)
      setShowPaymentModal(true)
    } else {
      // Auto-select if only one method available
      const paymentMethod = portal?.mtnMobileMoneyNumber ? 'MTN_MOBILE_MONEY' : 'AIRTEL_MONEY'
      processPurchase(pkg, paymentMethod)
    }
  }

  const processPurchase = async (pkg: Package, paymentMethod: 'MTN_MOBILE_MONEY' | 'AIRTEL_MONEY') => {
    try {
      setShowPaymentModal(false)
      
      const res = await fetch('/api/packages/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          paymentMethod,
          clientId: clientId || null,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Get payment number from portal or payment response
        const phoneNumber = paymentMethod === 'MTN_MOBILE_MONEY' 
          ? (portal?.mtnMobileMoneyNumber || data.paymentNumber)
          : (portal?.airtelMoneyNumber || data.paymentNumber)
        
        const paymentAmount = data.package?.price || pkg.price
        const paymentMethodName = paymentMethod === 'MTN_MOBILE_MONEY' ? 'MTN Mobile Money' : 'Airtel Money'
        
        // Check if payment number exists
        if (!phoneNumber) {
          toast.error(
            `Payment number not configured. Please contact support to set up ${paymentMethodName} payment.`,
            { duration: 8000 }
          )
          return
        }
        
        // Show payment instructions with actual number
        toast.success(
          `💰 Payment Instructions:\n\nSend UGX ${paymentAmount.toLocaleString()} to:\n📱 ${phoneNumber}\n\nVia: ${paymentMethodName}\n\nAfter payment confirmation, you'll receive a voucher code via SMS or email.`,
          { 
            duration: 12000,
            icon: '💳',
          }
        )
        
        // Reset states
        setPurchasingPackage(null)
        setSelectedPaymentMethod(null)
      } else {
        const errorMsg = data.error || data.message || 'Failed to initiate purchase'
        toast.error(errorMsg, { duration: 5000 })
      }
    } catch (error) {
      console.error('Error purchasing package:', error)
      toast.error('An error occurred while processing your purchase')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <LoadingSpinner size="lg" text="Loading WiFi Portal..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <ErrorDisplay error={error} onRetry={fetchPortalData} />
      </div>
    )
  }

  if (!portal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <ErrorDisplay error="Portal configuration not found." onRetry={fetchPortalData} />
      </div>
    )
  }

  const dynamicBgStyle = portal.backgroundColor ? { backgroundColor: portal.backgroundColor } : {}
  const dynamicPrimaryColor = portal.primaryColor || '#76D74C'
  const dynamicSecondaryColor = portal.secondaryColor || '#ffffff'

  // Format package name for display
  const formatPackageName = (pkg: Package) => {
    if (pkg.timeLimit) {
      if (pkg.timeLimit === 6) return '6hours'
      if (pkg.timeLimit === 24) return '24hours'
      if (pkg.timeLimit >= 168 && pkg.timeLimit < 720) return 'week'
      if (pkg.timeLimit >= 720) return 'month'
      return `${pkg.timeLimit}hours`
    }
    return pkg.name.toLowerCase()
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start pt-6 sm:pt-8 pb-6 px-4 relative overflow-hidden"
      style={dynamicBgStyle}
    >
      {/* Animated Background Elements - 2025 Design Trend */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header Text - Modern Typography */}
      <div className="w-full max-w-md text-center mb-4 relative z-10">
        <h2 className="text-white text-lg sm:text-xl font-semibold mb-1 drop-shadow-lg">
          Sign in to {portal.companyName}
        </h2>
        <p className="text-white/60 text-xs sm:text-sm font-mono">
          {portal.companyName?.toLowerCase().replace(/\s+/g, '.') || 'pentagon.login'}
        </p>
      </div>

      {/* Main Card - Glassmorphism Design (2025 Trend) */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 border border-white/20 animate-slide-up">
          {/* Company Name - Bold Typography */}
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-black mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
              {portal.companyName || 'WiFi Hotspot'}
            </h1>
          </div>

          {/* Instructions with Icon */}
          <div className="space-y-2 text-center">
            {portal.welcomeMessage && (
              <p className="text-gray-800 dark:text-gray-200 text-sm font-medium flex items-center justify-center gap-2">
                <Wifi className="h-4 w-4" style={{ color: dynamicPrimaryColor }} />
                {portal.welcomeMessage}
              </p>
            )}
            {portal.showFreeTrial && portal.freeTrialText && (
              <p className="text-gray-700 dark:text-gray-300 text-sm flex items-center justify-center gap-1 flex-wrap">
                <Gift className="h-4 w-4" style={{ color: dynamicPrimaryColor }} />
                {portal.freeTrialText.split('click here').map((part, i, arr) => 
                  i === arr.length - 1 ? (
                    <span key={i}>{part}</span>
                  ) : (
                    <span key={i}>
                      {part}
                      <span className="font-bold underline cursor-pointer hover:opacity-80 transition-opacity" style={{ color: dynamicPrimaryColor }}>
                        click here
                      </span>
                    </span>
                  )
                )}
              </p>
            )}
          </div>

          {/* Voucher Input Section - Neumorphism Style */}
          {portal.showVoucherInput && (
            <form onSubmit={handleVoucherLogin} className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Enter Voucher Code"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 text-center py-3.5 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all"
                  style={{ 
                    focusRingColor: dynamicPrimaryColor,
                  }}
                />
                <div className="absolute inset-0 rounded-xl shadow-inner pointer-events-none opacity-30"></div>
              </div>
              
              {/* IP and MAC Address - Modern Badge Design */}
              <div className="flex items-center justify-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-lg backdrop-blur-sm">
                  <Shield className="h-3 w-3" />
                  <span className="font-mono">IP: {userInfo.ip || '10.0.0.217'}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-lg backdrop-blur-sm">
                  <Shield className="h-3 w-3" />
                  <span className="font-mono">MAC: {userInfo.mac || 'E6:E9:E0:D8:6D:AD'}</span>
                </div>
              </div>

              {/* Login Button - Modern Gradient with Micro-interaction */}
              <Button 
                type="submit" 
                className="w-full py-3.5 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
                style={{ 
                  background: `linear-gradient(135deg, ${dynamicPrimaryColor} 0%, ${dynamicPrimaryColor}dd 100%)`,
                }}
              >
                <Zap className="h-5 w-5" />
                <span>Login</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </form>
          )}

          {/* Buy A Package Section - Modern Card Design */}
          {portal.showPackages && (
            <div className="space-y-5 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Buy A Package</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred plan</p>
              </div>
              
              {/* Payment Methods - Modern Badge Design */}
              {portal.showPaymentMethods && (portal.mtnMobileMoneyNumber || portal.airtelMoneyNumber) && (
                <div className="flex items-center justify-center gap-3 mb-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl">
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Pay With</span>
                  <div className="flex items-center gap-2">
                    {portal.airtelMoneyNumber && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center text-white font-bold text-xs">A</div>
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">airtel money</span>
                      </div>
                    )}
                    {portal.mtnMobileMoneyNumber && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded flex items-center justify-center text-white font-bold text-xs">M</div>
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">MTN MoMo</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Package List - Modern Grid with Hover Effects */}
              <div className="space-y-3">
                {packages.map((pkg, index) => {
                  const displayName = formatPackageName(pkg)
                  const isSelected = selectedPackage === pkg.id
                  
                  return (
                    <div 
                      key={pkg.id}
                      className={`flex items-center justify-between bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:shadow-lg ${
                        isSelected 
                          ? 'border-green-500 shadow-lg shadow-green-500/20' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                      onClick={() => setSelectedPackage(pkg.id)}
                    >
                      <div className="flex-1 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <Clock className={`h-5 w-5 ${isSelected ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-base">{displayName}</p>
                          {pkg.timeLimit && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {pkg.timeLimit >= 24 ? `${Math.floor(pkg.timeLimit / 24)} days` : `${pkg.timeLimit} hours`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white text-base">
                            {pkg.currency} {pkg.price.toLocaleString()}
                          </p>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleBuyPackage(pkg)
                          }}
                          className="px-5 py-2.5 rounded-lg font-bold text-white shadow-md hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                          style={{ backgroundColor: '#fbbf24' }}
                        >
                          <span>BUY</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Contact Information - Modern Design */}
          <div className="space-y-2 text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            {(portal.phone1 || portal.phone2 || portal.whatsapp) && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" style={{ color: dynamicPrimaryColor }} />
                  For help Call/Whatsapp {portal.phone1 || portal.whatsapp || portal.phone2}
                </p>
                {portal.phone2 && portal.phone1 && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {portal.phone2}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Powered By - Subtle Footer */}
          {portal.showPoweredBy && portal.footerText && (
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {portal.footerText}
            </p>
          )}
        </div>
      </div>

      {/* Payment Method Selection Modal */}
      {showPaymentModal && purchasingPackage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full animate-scale-in border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Select Payment Method</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Choose how you want to pay for <span className="font-semibold">{formatPackageName(purchasingPackage)}</span>
            </p>
            
            <div className="space-y-3 mb-6">
              {portal?.mtnMobileMoneyNumber && (
                <button
                  onClick={() => {
                    setSelectedPaymentMethod('MTN_MOBILE_MONEY')
                    processPurchase(purchasingPackage, 'MTN_MOBILE_MONEY')
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:scale-[1.02] bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800 hover:border-yellow-400 dark:hover:border-yellow-600"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center text-white font-bold">
                      M
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold text-gray-900 dark:text-white">MTN Mobile Money</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">{portal.mtnMobileMoneyNumber}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </button>
              )}
              
              {portal?.airtelMoneyNumber && (
                <button
                  onClick={() => {
                    setSelectedPaymentMethod('AIRTEL_MONEY')
                    processPurchase(purchasingPackage, 'AIRTEL_MONEY')
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:scale-[1.02] bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">
                      A
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900 dark:text-white">Airtel Money</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{portal.airtelMoneyNumber}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setShowPaymentModal(false)
                setPurchasingPackage(null)
                setSelectedPaymentMethod(null)
              }}
              className="w-full py-2 px-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PortalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading portal..." />
      </div>
    }>
      <PortalContent />
    </Suspense>
  )
}

    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading portal..." />
      </div>
    }>
      <PortalContent />
    </Suspense>
  )
}
