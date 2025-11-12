'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { useToast } from '@/hooks/useToast'
import { Save, Upload as UploadIcon, Eye, Facebook, Twitter, Instagram, Linkedin, Globe, Phone, Mail, MessageCircle, CreditCard } from 'lucide-react'

interface PortalData {
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

    if (!session || session.user.role !== 'CLIENT') {
      router.push('/auth/login')
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
          <div className="flex gap-2">
            <Button onClick={handlePreview} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave} disabled={saving} variant="gradient">
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
                <label className="block text-sm font-medium mb-2">Company Name *</label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Your Company Name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Logo</label>
                <div className="flex items-center gap-4">
                  {formData.logoUrl && (
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden border">
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
                    <Button variant="outline" type="button">
                      <UploadIcon className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Welcome Message</label>
                <Input
                  value={formData.welcomeMessage}
                  onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                  placeholder="Please buy a package to use the hotspot service"
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
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone 1
                </label>
                <Input
                  value={formData.phone1}
                  onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
                  placeholder="+256702772200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone 2
                </label>
                <Input
                  value={formData.phone2}
                  onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                  placeholder="+256753908001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </label>
                <Input
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+256702772200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@company.com"
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
                <label className="block text-sm font-medium mb-2">
                  MTN Mobile Money Number
                </label>
                <Input
                  value={formData.mtnMobileMoneyNumber || ''}
                  onChange={(e) => setFormData({ ...formData, mtnMobileMoneyNumber: e.target.value })}
                  placeholder="+256702772200"
                />
                <p className="text-xs text-gray-500 mt-2">
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
                <label className="block text-sm font-medium mb-2">
                  Airtel Money Number
                </label>
                <Input
                  value={formData.airtelMoneyNumber || ''}
                  onChange={(e) => setFormData({ ...formData, airtelMoneyNumber: e.target.value })}
                  placeholder="+256753908001"
                />
                <p className="text-xs text-gray-500 mt-2">
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
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook URL
                </label>
                <Input
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter URL
                </label>
                <Input
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram URL
                </label>
                <Input
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="https://instagram.com/yourhandle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn URL
                </label>
                <Input
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Colors & Theme */}
          <Card>
            <CardHeader>
              <CardTitle>Colors & Theme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Primary Color (Buttons)</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    placeholder="#76D74C"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Secondary Color (Text)</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    placeholder="#1e293b"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Background Color</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                    placeholder="#0f172a"
                  />
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Show Free Trial</label>
                <input
                  type="checkbox"
                  checked={formData.showFreeTrial}
                  onChange={(e) => setFormData({ ...formData, showFreeTrial: e.target.checked })}
                  className="h-4 w-4 text-brand-green"
                />
              </div>

              {formData.showFreeTrial && (
                <div>
                  <label className="block text-sm font-medium mb-2">Free Trial Text</label>
                  <Input
                    value={formData.freeTrialText}
                    onChange={(e) => setFormData({ ...formData, freeTrialText: e.target.value })}
                    placeholder="Free trial available, click here."
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Show Voucher Input</label>
                <input
                  type="checkbox"
                  checked={formData.showVoucherInput}
                  onChange={(e) => setFormData({ ...formData, showVoucherInput: e.target.checked })}
                  className="h-4 w-4 text-brand-green"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Show Packages</label>
                <input
                  type="checkbox"
                  checked={formData.showPackages}
                  onChange={(e) => setFormData({ ...formData, showPackages: e.target.checked })}
                  className="h-4 w-4 text-brand-green"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Show Payment Methods</label>
                <input
                  type="checkbox"
                  checked={formData.showPaymentMethods}
                  onChange={(e) => setFormData({ ...formData, showPaymentMethods: e.target.checked })}
                  className="h-4 w-4 text-brand-green"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Footer Text</label>
                <Input
                  value={formData.footerText}
                  onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                  placeholder="Powered by JENDA MOBILITY"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Show Powered By</label>
                <input
                  type="checkbox"
                  checked={formData.showPoweredBy}
                  onChange={(e) => setFormData({ ...formData, showPoweredBy: e.target.checked })}
                  className="h-4 w-4 text-brand-green"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

