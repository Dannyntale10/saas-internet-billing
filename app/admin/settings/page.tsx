'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { useToast } from '@/hooks/useToast'
import { Facebook, Twitter, Instagram, Linkedin, Youtube, MessageCircle, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    defaultCurrency: 'UGX',
    timezone: 'Africa/Kampala',
    dateFormat: 'DD/MM/YYYY',
    companyName: 'JENDA MOBILITY',
    companyEmail: 'support@jenda.com',
    companyPhone: '+256702772200',
    supportEmail: 'support@jenda.com',
    supportPhone: '+256702772200',
  })
  const [socialMedia, setSocialMedia] = useState({
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    youtube: '',
    whatsapp: '',
    website: '',
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/login?role=admin')
      return
    }

    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('adminSettings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error('Error loading settings:', e)
      }
    }

    // Load social media handles
    const savedSocialMedia = localStorage.getItem('adminSocialMedia')
    if (savedSocialMedia) {
      try {
        setSocialMedia(JSON.parse(savedSocialMedia))
      } catch (e) {
        console.error('Error loading social media:', e)
      }
    } else {
      // Try to fetch from API
      fetch('/api/admin/social-media')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.socialMedia) {
            setSocialMedia(data.socialMedia)
          }
        })
        .catch(err => console.error('Error fetching social media:', err))
    }
  }, [session, status, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Save to localStorage (in production, save to database via API)
      localStorage.setItem('adminSettings', JSON.stringify(settings))
      
      // Save social media handles
      const response = await fetch('/api/admin/social-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(socialMedia),
      })
      
      if (response.ok) {
        localStorage.setItem('adminSocialMedia', JSON.stringify(socialMedia))
      }
      
      toast.showSuccess('Settings saved successfully!')
      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.showError('Failed to save settings')
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading..." />
        </div>
      </DashboardLayout>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <ErrorDisplay error="Access denied. Please login as admin." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mobile-padding max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
            Manage system settings and preferences
          </p>
        </div>

        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Currency
                  </label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    value={settings.defaultCurrency}
                    onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                  >
                    <option value="UGX">UGX - Ugandan Shilling</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="KES">KES - Kenyan Shilling</option>
                    <option value="TZS">TZS - Tanzanian Shilling</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Timezone
                  </label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  >
                    <option value="Africa/Kampala">Africa/Kampala (EAT)</option>
                    <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                    <option value="Africa/Dar_es_Salaam">Africa/Dar es Salaam (EAT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Format
                  </label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    value={settings.dateFormat}
                    onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Name
                    </label>
                    <Input
                      value={settings.companyName}
                      onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Email
                    </label>
                    <Input
                      type="email"
                      value={settings.companyEmail}
                      onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Phone
                    </label>
                    <Input
                      value={settings.companyPhone}
                      onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Support Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Support Email
                    </label>
                    <Input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Support Phone
                    </label>
                    <Input
                      value={settings.supportPhone}
                      onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Social Media Handles</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Add your social media links to display on the home page
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Facebook className="h-4 w-4 text-blue-600" />
                      Facebook URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://facebook.com/yourpage"
                      value={socialMedia.facebook}
                      onChange={(e) => setSocialMedia({ ...socialMedia, facebook: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Twitter className="h-4 w-4 text-blue-400" />
                      Twitter/X URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://twitter.com/yourhandle"
                      value={socialMedia.twitter}
                      onChange={(e) => setSocialMedia({ ...socialMedia, twitter: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-pink-600" />
                      Instagram URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://instagram.com/yourhandle"
                      value={socialMedia.instagram}
                      onChange={(e) => setSocialMedia({ ...socialMedia, instagram: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-blue-700" />
                      LinkedIn URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://linkedin.com/company/yourcompany"
                      value={socialMedia.linkedin}
                      onChange={(e) => setSocialMedia({ ...socialMedia, linkedin: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Youtube className="h-4 w-4 text-red-600" />
                      YouTube URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://youtube.com/@yourchannel"
                      value={socialMedia.youtube}
                      onChange={(e) => setSocialMedia({ ...socialMedia, youtube: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      WhatsApp Number
                    </label>
                    <Input
                      type="text"
                      placeholder="+256702772200"
                      value={socialMedia.whatsapp}
                      onChange={(e) => setSocialMedia({ ...socialMedia, whatsapp: e.target.value })}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-600" />
                      Website URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://yourwebsite.com"
                      value={socialMedia.website}
                      onChange={(e) => setSocialMedia({ ...socialMedia, website: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  type="submit" 
                  disabled={saving} 
                  className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all border-2 border-green-400"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-full sm:w-auto border-2 border-gray-400 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
