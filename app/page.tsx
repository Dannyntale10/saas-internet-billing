'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Shield, Users, Wifi, ArrowRight, LogIn, Facebook, Twitter, Instagram, Linkedin, Youtube, MessageCircle, Globe, Zap, Lock, BarChart3, CheckCircle2, Mail, TrendingUp, Clock, Server, Award } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/input'
import Logo from '@/components/Logo'
import toast from 'react-hot-toast'

export default function Home() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [socialMedia, setSocialMedia] = useState({
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    youtube: '',
    whatsapp: '',
    website: '',
  })
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVouchers: 0,
    uptime: 99.9,
    activeClients: 0,
  })
  const [email, setEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)

  // Auto-logout when navigating to home page from authenticated sections
  useEffect(() => {
    if (status === 'loading') return

    if (session?.user) {
      console.log('User is logged in, auto-logging out from home page')
      // Sign out the user when they visit the home page
      signOut({ 
        redirect: false,
        callbackUrl: '/'
      }).then(() => {
        console.log('User logged out successfully')
        // Force a page reload to clear any cached session data
        window.location.href = '/'
      })
    }
  }, [session, status])

  // Load social media handles
  useEffect(() => {
    const savedSocialMedia = localStorage.getItem('adminSocialMedia')
    if (savedSocialMedia) {
      try {
        setSocialMedia(JSON.parse(savedSocialMedia))
      } catch (e) {
        console.error('Error loading social media:', e)
      }
    }
  }, [])

  // Load stats (mock data for now - can be replaced with API call)
  useEffect(() => {
    // In production, fetch from API
    setStats({
      totalUsers: 1250,
      totalVouchers: 5430,
      uptime: 99.9,
      activeClients: 45,
    })
  }, [])

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubscribing(true)
    // In production, send to API
    setTimeout(() => {
      toast.success('Successfully subscribed to newsletter!')
      setEmail('')
      setSubscribing(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-brand-gradient flex flex-col">
      {/* Header */}
      <header className="w-full py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4 sm:space-x-5">
            <Logo size="lg" showText={true} />
          </div>
          <Link 
            href="/portal" 
            className="text-white/80 hover:text-white text-base sm:text-lg flex items-center space-x-2 transition-colors font-medium"
          >
            <Wifi className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="hidden sm:inline">WiFi Portal</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Welcome to
              <span className="block text-brand-green"> Internet Billing System</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-6">
              Manage your internet services, vouchers, and clients with ease
            </p>
            
            {/* Service Status Indicator */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-400/30 backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm font-semibold text-white">All Systems Operational</span>
            </div>
          </div>

          {/* Key Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-12 animate-fade-in">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all">
              <CardContent className="p-4 sm:p-6 text-center">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-brand-green mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stats.totalUsers.toLocaleString()}+</div>
                <div className="text-xs sm:text-sm text-white/70">Active Users</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all">
              <CardContent className="p-4 sm:p-6 text-center">
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-brand-green mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stats.totalVouchers.toLocaleString()}+</div>
                <div className="text-xs sm:text-sm text-white/70">Vouchers Sold</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all">
              <CardContent className="p-4 sm:p-6 text-center">
                <Server className="h-6 w-6 sm:h-8 sm:w-8 text-brand-green mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stats.uptime}%</div>
                <div className="text-xs sm:text-sm text-white/70">Uptime</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all">
              <CardContent className="p-4 sm:p-6 text-center">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-brand-green mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stats.activeClients}+</div>
                <div className="text-xs sm:text-sm text-white/70">Active Clients</div>
              </CardContent>
            </Card>
          </div>

          {/* Login Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8">
            {/* Admin Login Card */}
            <Link href="/auth/login?role=admin" className="block">
              <Card 
                className="bg-white dark:bg-gray-800 cursor-pointer transform transition-all duration-300 hover:scale-105 shadow-2xl h-full"
                onMouseEnter={() => setHoveredCard('admin')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <CardContent className="p-8 text-center">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 transition-all duration-300 ${
                    hoveredCard === 'admin' 
                      ? 'bg-green-600 text-white scale-110' 
                      : 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                  }`}>
                    <Shield className="h-10 w-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Admin Login
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Access the admin dashboard to manage clients, vouchers, transactions, and system settings
                  </p>
                  <Button 
                    variant="gradient" 
                    size="lg" 
                    className="w-full group"
                    onClick={(e) => {
                      e.preventDefault()
                      router.push('/auth/login?role=admin')
                    }}
                  >
                    Login as Admin
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Client Login Card */}
            <Link href="/auth/login?role=client" className="block">
              <Card 
                className="bg-white dark:bg-gray-800 cursor-pointer transform transition-all duration-300 hover:scale-105 shadow-2xl h-full"
                onMouseEnter={() => setHoveredCard('client')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <CardContent className="p-8 text-center">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 transition-all duration-300 ${
                    hoveredCard === 'client' 
                      ? 'bg-brand-green text-white scale-110' 
                      : 'bg-brand-green/10 text-brand-green'
                  }`}>
                    <Users className="h-10 w-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Client Login
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Access your client dashboard to manage vouchers, view transactions, and customize your portal
                  </p>
                  <Button 
                    variant="gradient" 
                    size="lg" 
                    className="w-full group"
                    onClick={(e) => {
                      e.preventDefault()
                      router.push('/auth/login?role=client')
                    }}
                  >
                    Login as Client
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Features Showcase */}
          <div className="mb-12 animate-fade-in">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8">Why Choose Us</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all text-center">
                <CardContent className="p-6">
                  <Zap className="h-10 w-10 text-brand-green mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">Lightning Fast</h3>
                  <p className="text-sm text-white/70">High-speed internet billing with instant processing</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all text-center">
                <CardContent className="p-6">
                  <Lock className="h-10 w-10 text-brand-green mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">Secure & Safe</h3>
                  <p className="text-sm text-white/70">Bank-level encryption and data protection</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all text-center">
                <CardContent className="p-6">
                  <BarChart3 className="h-10 w-10 text-brand-green mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">Real-time Analytics</h3>
                  <p className="text-sm text-white/70">Track usage, revenue, and performance instantly</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all text-center">
                <CardContent className="p-6">
                  <Award className="h-10 w-10 text-brand-green mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">24/7 Support</h3>
                  <p className="text-sm text-white/70">Round-the-clock customer support and assistance</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Newsletter Signup */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-8 animate-fade-in">
            <CardContent className="p-6 sm:p-8 text-center">
              <Mail className="h-12 w-12 text-brand-green mx-auto mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Stay Updated</h3>
              <p className="text-white/80 mb-6 max-w-md mx-auto">
                Subscribe to our newsletter for the latest updates, features, and promotions
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/60"
                />
                <Button
                  type="submit"
                  disabled={subscribing}
                  className="bg-brand-green hover:bg-brand-green/90 text-white font-semibold px-6"
                >
                  {subscribing ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Social Media Links */}
          {(socialMedia.facebook || socialMedia.twitter || socialMedia.instagram || socialMedia.linkedin || socialMedia.youtube || socialMedia.whatsapp || socialMedia.website) && (
            <div className="text-center mb-8 animate-fade-in">
              <p className="text-white/80 text-base sm:text-lg font-semibold mb-4">
                Follow Us
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {socialMedia.facebook && (
                  <a
                    href={socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-white/40 transition-all duration-200 transform hover:scale-110"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </a>
                )}
                {socialMedia.twitter && (
                  <a
                    href={socialMedia.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-white/40 transition-all duration-200 transform hover:scale-110"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </a>
                )}
                {socialMedia.instagram && (
                  <a
                    href={socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-white/40 transition-all duration-200 transform hover:scale-110"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </a>
                )}
                {socialMedia.linkedin && (
                  <a
                    href={socialMedia.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-white/40 transition-all duration-200 transform hover:scale-110"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </a>
                )}
                {socialMedia.youtube && (
                  <a
                    href={socialMedia.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-white/40 transition-all duration-200 transform hover:scale-110"
                    aria-label="YouTube"
                  >
                    <Youtube className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </a>
                )}
                {socialMedia.whatsapp && (
                  <a
                    href={`https://wa.me/${socialMedia.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-white/40 transition-all duration-200 transform hover:scale-110"
                    aria-label="WhatsApp"
                  >
                    <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </a>
                )}
                {socialMedia.website && (
                  <a
                    href={socialMedia.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-white/40 transition-all duration-200 transform hover:scale-110"
                    aria-label="Website"
                  >
                    <Globe className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white/60 text-sm">
            © {new Date().getFullYear()} JENDA MOBILITY. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
