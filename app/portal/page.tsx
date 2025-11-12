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
  backgroundImageUrl?: string
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
      className="min-h-screen flex flex-col items-center justify-start pt-4 sm:pt-6 pb-6 px-4 relative overflow-hidden"
      style={{
        ...dynamicBgStyle,
        background: portal.backgroundImageUrl
          ? `url(${portal.backgroundImageUrl}) repeat`
          : dynamicBgStyle.backgroundColor 
            ? `linear-gradient(135deg, ${dynamicBgStyle.backgroundColor} 0%, ${dynamicBgStyle.backgroundColor}dd 50%, ${dynamicBgStyle.backgroundColor}aa 100%)`
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        backgroundSize: portal.backgroundImageUrl ? 'auto' : 'cover',
        backgroundAttachment: portal.backgroundImageUrl ? 'fixed' : 'scroll',
      }}
    >
      {/* Enhanced Animated Background - 2025 Design (Hidden when background image is used) */}
      {!portal.backgroundImageUrl && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Gradient Orbs with Animation */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-green-400/20 via-emerald-400/15 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 via-cyan-400/15 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-purple-400/15 via-pink-400/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
          
          {/* Animated Grid Pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `linear-gradient(rgba(118, 215, 76, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(118, 215, 76, 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            animation: 'grid-move 20s linear infinite'
          }}></div>
        </div>
      )}

      {/* Header Text - Enhanced Typography */}
      <div className="w-full max-w-lg text-center mb-4 sm:mb-6 relative z-10">
        <h2 className="text-white text-xl sm:text-2xl font-bold mb-2 drop-shadow-2xl bg-gradient-to-r from-white via-green-100 to-white bg-clip-text text-transparent">
          Sign in to {portal.companyName}
        </h2>
        <p className="text-white/70 text-xs sm:text-sm font-mono tracking-wider">
          {portal.companyName?.toLowerCase().replace(/\s+/g, '.') || 'wifi.portal'}
        </p>
      </div>

      {/* Main Card - Enhanced Glassmorphism (2025 Trend) */}
      <div className="w-full max-w-lg relative z-10">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 border-2 border-white/30 dark:border-gray-700/50 animate-slide-up overflow-hidden relative">
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>
          
          <div className="relative z-10">
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

          {/* Buy A Package Section - Enhanced 2025 Design */}
          {portal.showPackages && (
            <div className="space-y-6 pt-6 border-t-2 border-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700">
              <div className="text-center">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-300 dark:to-white bg-clip-text text-transparent">
                  Buy A Package
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Choose your preferred plan</p>
              </div>
              
              {/* Payment Methods - Enhanced Badge Design */}
              {portal.showPaymentMethods && (portal.mtnMobileMoneyNumber || portal.airtelMoneyNumber) && (
                <div className="flex items-center justify-center gap-3 mb-5 p-4 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800/50 dark:via-gray-700/50 dark:to-gray-800/50 rounded-2xl border-2 border-gray-200/50 dark:border-gray-600/50 shadow-lg backdrop-blur-sm">
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-bold">Pay With</span>
                  <div className="flex items-center gap-2.5">
                    {portal.airtelMoneyNumber && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-xl border-2 border-red-300 dark:border-red-700 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-lg">A</div>
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">airtel money</span>
                      </div>
                    )}
                    {portal.mtnMobileMoneyNumber && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-xl border-2 border-yellow-300 dark:border-yellow-700 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer">
                        <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-lg">M</div>
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">MTN MoMo</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Package List - Enhanced 2025 Card Design */}
              <div className="space-y-4">
                {packages.map((pkg, index) => {
                  const displayName = formatPackageName(pkg)
                  const isSelected = selectedPackage === pkg.id
                  const timeDisplay = pkg.timeLimit 
                    ? (pkg.timeLimit >= 24 ? `${Math.floor(pkg.timeLimit / 24)} days` : `${pkg.timeLimit} hours`)
                    : ''
                  
                  return (
                    <div 
                      key={pkg.id}
                      className={`group relative flex items-center justify-between rounded-2xl p-5 border-2 transition-all duration-300 cursor-pointer transform hover:scale-[1.03] hover:shadow-2xl overflow-hidden ${
                        isSelected 
                          ? 'bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-green-900/20 dark:via-gray-800 dark:to-emerald-900/20 border-green-500 shadow-xl shadow-green-500/30' 
                          : 'bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-750 dark:to-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 shadow-md hover:shadow-xl'
                      }`}
                      onClick={() => setSelectedPackage(pkg.id)}
                      style={{
                        animationDelay: `${index * 0.1}s`
                      }}
                    >
                      {/* Shine Effect on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%]"></div>
                      
                      <div className="flex-1 flex items-center gap-4 relative z-10">
                        {/* Icon with Enhanced Design */}
                        <div className={`relative w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                          isSelected 
                            ? 'bg-gradient-to-br from-green-400 to-emerald-600 text-white scale-110' 
                            : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-600 dark:text-gray-400 group-hover:scale-110'
                        }`}>
                          <Clock className={`h-6 w-6 ${isSelected ? 'text-white' : ''}`} />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                          )}
                        </div>
                        
                        {/* Package Info */}
                        <div className="flex-1">
                          <p className="font-black text-lg text-gray-900 dark:text-white mb-1">{displayName}</p>
                          {timeDisplay && (
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {timeDisplay}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Price and Buy Button */}
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="text-right">
                          <p className="font-black text-xl text-gray-900 dark:text-white">
                            {pkg.currency} {pkg.price.toLocaleString()}
                          </p>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleBuyPackage(pkg)
                          }}
                          className="px-6 py-3 rounded-xl font-black text-white shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-110 active:scale-95 flex items-center gap-2 border-2 border-yellow-400"
                          style={{ 
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                          }}
                        >
                          <span className="text-sm">BUY</span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Contact Information - Enhanced Design */}
          <div className="space-y-3 text-center pt-6 border-t-2 border-gray-200 dark:border-gray-700">
            {(portal.phone1 || portal.phone2 || portal.whatsapp) && (
              <div className="flex flex-col items-center gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-md">
                  <MessageCircle className="h-5 w-5" style={{ color: dynamicPrimaryColor }} />
                  <p className="text-sm text-gray-800 dark:text-gray-200 font-bold">
                    For help Call/Whatsapp <span className="font-mono text-base" style={{ color: dynamicPrimaryColor }}>{portal.phone1 || portal.whatsapp || portal.phone2}</span>
                  </p>
                </div>
                {portal.phone2 && portal.phone1 && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                    <Phone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <p className="text-xs text-gray-700 dark:text-gray-300 font-mono">{portal.phone2}</p>
                  </div>
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
