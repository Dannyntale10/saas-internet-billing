'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { useToast } from '@/hooks/useToast'
import { Save, Upload as UploadIcon, Eye, Facebook, Twitter, Instagram, Linkedin, Globe, Phone, Mail, MessageCircle, CreditCard, Palette, Sparkles } from 'lucide-react'

interface PortalData {
  companyName: string
  logoUrl?: string
  backgroundImageUrl?: string
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
  mtnMobileMoneyNumber?: string
  airtelMoneyNumber?: string
}

export default function PortalCustomizePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const toast = useToast()

  const [formData, setFormData] = useState<PortalData>({
    companyName: '',
    logoUrl: '',
    backgroundImageUrl: '',
    phone1: '',
    phone2: '',
    whatsapp: '',
    email: '',
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    website: '',
    welcomeMessage: '',
    showFreeTrial: true,
    freeTrialText: 'Free trial available, click here.',
    showVoucherInput: true,
    showPackages: true,
    showPaymentMethods: true,
    primaryColor: '#76D74C',
    secondaryColor: '#1e293b',
    backgroundColor: '#0f172a',
    footerText: 'Powered by JENDA MOBILITY',
    showPoweredBy: true,
    mtnMobileMoneyNumber: '',
    airtelMoneyNumber: '',
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login?role=client')
      return
    }

    // STRICT: Only CLIENT users can access client pages
    const userRole = (session.user.role as string)?.toUpperCase()
    if (userRole !== 'CLIENT') {
      console.error('❌ Access denied: User role', userRole, 'cannot access client pages')
      signOut({ redirect: false, callbackUrl: `/auth/login?role=client` }).then(() => {
        router.push(`/auth/login?role=client&error=access_denied`)
      })
      return
    }

    fetchPortalData()
  }, [session, status, router])

  const fetchPortalData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/client/portal')
      if (!res.ok) throw new Error('Failed to load portal settings')

      const data = await res.json()
      if (data.portal) {
        setFormData(data.portal)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load portal')
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/client/portal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      toast.showSuccess('Portal settings saved successfully!')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save')
      toast.showError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    const params = new URLSearchParams()
    params.set('client', session?.user?.id || '')
    params.set('preview', 'true')
    setPreviewUrl(`/?${params.toString()}`)
    window.open(previewUrl || '/', '_blank')
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // In production, upload to cloud storage
    // For now, create a data URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData({ ...formData, logoUrl: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  const handleBackgroundImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.showError('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.showError('Image size should be less than 5MB')
      return
    }

    // In production, upload to cloud storage
    // For now, create a data URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData({ ...formData, backgroundImageUrl: reader.result as string })
      toast.showSuccess('Background image uploaded! It will tile to fill the entire background.')
    }
    reader.readAsDataURL(file)
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading..." />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorDisplay error={error} onRetry={fetchPortalData} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mobile-padding">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">
              Customize Portal
            </h1>
            <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
              Customize your WiFi captive portal page
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handlePreview} 
              variant="outline"
              className="w-full sm:w-auto border-2 border-blue-600 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-700 dark:hover:border-blue-500 transition-all font-bold shadow-lg hover:shadow-xl"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving} 
              className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all border-2 border-green-400"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Name *
                </label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Your Company Name"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Logo
                </label>
                <div className="flex items-center gap-4">
                  {formData.logoUrl && (
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                      <img src={formData.logoUrl} alt="Logo" className="object-contain w-full h-full" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      type="button"
                      className="border-2 border-blue-600 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-700 dark:hover:border-blue-500 transition-all font-bold"
                    >
                      <UploadIcon className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Welcome Message
                </label>
                <Input
                  value={formData.welcomeMessage}
                  onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                  placeholder="Please buy a package to use the hotspot service"
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone 1
                </label>
                <Input
                  value={formData.phone1}
                  onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
                  placeholder="+256702772200"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone 2
                </label>
                <Input
                  value={formData.phone2}
                  onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                  placeholder="+256753908001"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </label>
                <Input
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+256702772200"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@company.com"
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* MTN Mobile Money Payment Number */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                MTN Mobile Money Payment Number
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">Add your MTN Mobile Money number to receive payments from customers</p>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  MTN Mobile Money Number
                </label>
                <Input
                  value={formData.mtnMobileMoneyNumber || ''}
                  onChange={(e) => setFormData({ ...formData, mtnMobileMoneyNumber: e.target.value })}
                  placeholder="+256702772200"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  This number will receive MTN Mobile Money payments from your customers when they purchase vouchers or packages.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Airtel Money Payment Number */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Airtel Money Payment Number
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">Add your Airtel Money number to receive payments from customers</p>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Airtel Money Number
                </label>
                <Input
                  value={formData.airtelMoneyNumber || ''}
                  onChange={(e) => setFormData({ ...formData, airtelMoneyNumber: e.target.value })}
                  placeholder="+256753908001"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  This number will receive Airtel Money payments from your customers when they purchase vouchers or packages.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook URL
                </label>
                <Input
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                  placeholder="https://facebook.com/yourpage"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter URL
                </label>
                <Input
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  placeholder="https://twitter.com/yourhandle"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram URL
                </label>
                <Input
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="https://instagram.com/yourhandle"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn URL
                </label>
                <Input
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/company/yourcompany"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Colors & Theme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Colors & Theme
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customize your portal's appearance with beautiful color combinations</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Color Presets */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <Sparkles className="h-4 w-4 inline mr-2" />
                  Quick Color Themes
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[
                    { name: 'Ocean Blue', primary: '#3b82f6', secondary: '#e0f2fe', background: '#0f172a' },
                    { name: 'Forest Green', primary: '#10b981', secondary: '#d1fae5', background: '#064e3b' },
                    { name: 'Sunset Orange', primary: '#f59e0b', secondary: '#fef3c7', background: '#78350f' },
                    { name: 'Royal Purple', primary: '#8b5cf6', secondary: '#ede9fe', background: '#1e1b4b' },
                    { name: 'Crimson Red', primary: '#ef4444', secondary: '#fee2e2', background: '#7f1d1d' },
                    { name: 'Sky Blue', primary: '#06b6d4', secondary: '#cffafe', background: '#164e63' },
                    { name: 'Emerald', primary: '#14b8a6', secondary: '#ccfbf1', background: '#134e4a' },
                    { name: 'Amber', primary: '#fbbf24', secondary: '#fef3c7', background: '#78350f' },
                  ].map((theme) => (
                    <button
                      key={theme.name}
                      onClick={() => {
                        setFormData({
                          ...formData,
                          primaryColor: theme.primary,
                          secondaryColor: theme.secondary,
                          backgroundColor: theme.background,
                        })
                        toast.showSuccess(`Applied ${theme.name} theme!`)
                      }}
                      className="group relative p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-1 h-8">
                          <div 
                            className="flex-1 rounded-lg" 
                            style={{ backgroundColor: theme.primary }}
                          ></div>
                          <div 
                            className="flex-1 rounded-lg" 
                            style={{ backgroundColor: theme.secondary }}
                          ></div>
                          <div 
                            className="flex-1 rounded-lg" 
                            style={{ backgroundColor: theme.background }}
                          ></div>
                        </div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center group-hover:text-gray-900 dark:group-hover:text-white">
                          {theme.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Primary Color (Buttons & Accents)
                  </label>
                  <div className="flex gap-3 items-center">
                    <div className="relative">
                      <Input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="w-16 h-16 cursor-pointer rounded-xl border-2 border-gray-300 dark:border-gray-600"
                        style={{ padding: '2px' }}
                      />
                    </div>
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      placeholder="#76D74C"
                      className="flex-1 font-mono"
                    />
                    <div 
                      className="w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-md"
                      style={{ backgroundColor: formData.primaryColor }}
                    ></div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Secondary Color (Text & Icons)
                  </label>
                  <div className="flex gap-3 items-center">
                    <div className="relative">
                      <Input
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        className="w-16 h-16 cursor-pointer rounded-xl border-2 border-gray-300 dark:border-gray-600"
                        style={{ padding: '2px' }}
                      />
                    </div>
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      placeholder="#e7e8e9"
                      className="flex-1 font-mono"
                    />
                    <div 
                      className="w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-md"
                      style={{ backgroundColor: formData.secondaryColor }}
                    ></div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Background Color (Portal Background)
                  </label>
                  <div className="flex gap-3 items-center">
                    <div className="relative">
                      <Input
                        type="color"
                        value={formData.backgroundColor}
                        onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                        className="w-16 h-16 cursor-pointer rounded-xl border-2 border-gray-300 dark:border-gray-600"
                        style={{ padding: '2px' }}
                      />
                    </div>
                    <Input
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      placeholder="#5f7024"
                      className="flex-1 font-mono"
                    />
                    <div 
                      className="w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-md"
                      style={{ backgroundColor: formData.backgroundColor }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    💡 Tip: Use dark colors for better contrast with white text
                  </p>
                </div>
              </div>

              {/* Background Image Upload */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Background Image (Optional)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Upload an image that will tile/repeat to fill the entire portal background. Recommended: 500x500px or smaller for best tiling effect.
                </p>
                <div className="flex items-center gap-4">
                  {formData.backgroundImageUrl && (
                    <div className="relative h-24 w-24 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                      <img 
                        src={formData.backgroundImageUrl} 
                        alt="Background Preview" 
                        className="object-cover w-full h-full"
                      />
                      <button
                        onClick={() => setFormData({ ...formData, backgroundImageUrl: '' })}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        title="Remove background image"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundImageUpload}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      type="button"
                      className="border-2 border-purple-600 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:border-purple-700 dark:hover:border-purple-500 transition-all font-bold"
                    >
                      <UploadIcon className="h-4 w-4 mr-2" />
                      {formData.backgroundImageUrl ? 'Change Background' : 'Upload Background Image'}
                    </Button>
                  </label>
                </div>
                {formData.backgroundImageUrl && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    ✓ Background image will tile to fill the entire portal background
                  </p>
                )}
              </div>

              {/* Live Preview */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Live Preview
                </label>
                <div 
                  className="rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-lg relative overflow-hidden"
                  style={{ 
                    background: formData.backgroundImageUrl 
                      ? `url(${formData.backgroundImageUrl}) repeat`
                      : `linear-gradient(135deg, ${formData.backgroundColor} 0%, ${formData.backgroundColor}dd 50%, ${formData.backgroundColor}aa 100%)`,
                    backgroundSize: formData.backgroundImageUrl ? 'auto' : 'cover',
                  }}
                >
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-lg p-4 border-2 border-white/30 relative z-10">
                    <h3 className="text-lg font-bold mb-2" style={{ color: formData.secondaryColor || '#1e293b' }}>
                      {formData.companyName || 'Your Company'}
                    </h3>
                    <button
                      className="px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all"
                      style={{ backgroundColor: formData.primaryColor || '#76D74C' }}
                    >
                      Sample Button
                    </button>
                    <p className="text-sm mt-3" style={{ color: formData.secondaryColor || '#1e293b' }}>
                      This is how your portal will look
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portal Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Portal Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-brand-green transition-colors">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Show Free Trial
                </label>
                <input
                  type="checkbox"
                  checked={formData.showFreeTrial}
                  onChange={(e) => setFormData({ ...formData, showFreeTrial: e.target.checked })}
                  className="h-5 w-5 text-brand-green border-2 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-brand-green cursor-pointer"
                />
              </div>

              {formData.showFreeTrial && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Free Trial Text
                  </label>
                  <Input
                    value={formData.freeTrialText}
                    onChange={(e) => setFormData({ ...formData, freeTrialText: e.target.value })}
                    placeholder="Free trial available, click here."
                    className="w-full"
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-brand-green transition-colors">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Show Voucher Input
                </label>
                <input
                  type="checkbox"
                  checked={formData.showVoucherInput}
                  onChange={(e) => setFormData({ ...formData, showVoucherInput: e.target.checked })}
                  className="h-5 w-5 text-brand-green border-2 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-brand-green cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-brand-green transition-colors">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Show Packages
                </label>
                <input
                  type="checkbox"
                  checked={formData.showPackages}
                  onChange={(e) => setFormData({ ...formData, showPackages: e.target.checked })}
                  className="h-5 w-5 text-brand-green border-2 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-brand-green cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-brand-green transition-colors">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Show Payment Methods
                </label>
                <input
                  type="checkbox"
                  checked={formData.showPaymentMethods}
                  onChange={(e) => setFormData({ ...formData, showPaymentMethods: e.target.checked })}
                  className="h-5 w-5 text-brand-green border-2 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-brand-green cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Footer Text
                </label>
                <Input
                  value={formData.footerText}
                  onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                  placeholder="Powered by JENDA MOBILITY"
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-brand-green transition-colors">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Show Powered By
                </label>
                <input
                  type="checkbox"
                  checked={formData.showPoweredBy}
                  onChange={(e) => setFormData({ ...formData, showPoweredBy: e.target.checked })}
                  className="h-5 w-5 text-brand-green border-2 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-brand-green cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

