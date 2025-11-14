'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  CreditCard, 
  Settings, 
  LogOut,
  Activity,
  Router,
  Menu,
  X,
  Package
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Logo from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NotificationCenter } from '@/components/NotificationCenter'
import { GlobalSearch } from '@/components/GlobalSearch'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role = session?.user?.role
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [clientBranding, setClientBranding] = useState<{
    companyName: string | null
    logoUrl: string | null
  } | null>(null)

  const adminNav: NavItem[] = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Clients', href: '/admin/clients', icon: Users },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Packages', href: '/admin/packages', icon: Ticket },
    { name: 'Transactions', href: '/admin/transactions', icon: CreditCard },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
    { name: 'Invoices', href: '/admin/invoices', icon: CreditCard },
    { name: 'Analytics', href: '/admin/analytics', icon: Activity },
    { name: 'Activity', href: '/admin/activity', icon: Activity },
    { name: 'Reports', href: '/admin/reports', icon: Activity },
    { name: 'Activity Logs', href: '/admin/activity-logs', icon: Activity },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ]

      const clientNav: NavItem[] = [
        { name: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
        { name: 'Create Voucher', href: '/client/vouchers/create', icon: Ticket },
        { name: 'Vouchers', href: '/client/vouchers', icon: Ticket },
        { name: 'Packages', href: '/client/packages', icon: Package },
        { name: 'Active Users', href: '/client/active-users', icon: Users },
        { name: 'Transactions', href: '/client/transactions', icon: CreditCard },
        { name: 'Subscriptions', href: '/client/subscriptions', icon: CreditCard },
        { name: 'Invoices', href: '/client/invoices', icon: CreditCard },
        { name: 'Reports', href: '/client/reports', icon: Activity },
        { name: 'Customize Portal', href: '/client/portal-customize', icon: Settings },
        { name: 'Router Config', href: '/client/router', icon: Router },
        { name: 'Settings', href: '/client/settings', icon: Settings },
      ]

  const userNav: NavItem[] = [
    { name: 'Dashboard', href: '/user/dashboard', icon: LayoutDashboard },
    { name: 'Buy Voucher', href: '/user/buy-voucher', icon: Ticket },
    { name: 'My Vouchers', href: '/user/vouchers', icon: Ticket },
  ]

  const navItems = role === 'ADMIN' ? adminNav : role === 'CLIENT' ? clientNav : userNav

  // Fetch client branding for CLIENT role
  useEffect(() => {
    if (role === 'CLIENT' && session?.user?.id) {
      fetch('/api/client/portal')
        .then(res => res.json())
        .then(data => {
          if (data.portal) {
            setClientBranding({
              companyName: data.portal.companyName || null,
              logoUrl: data.portal.logoUrl || null,
            })
          }
        })
        .catch(err => {
          console.error('Error fetching client branding:', err)
        })
    }
  }, [role, session?.user?.id])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Modern Navigation with Mobile Support */}
      <nav className="bg-brand-gradient border-b border-white/10 shadow-lg sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-[95%] xl:max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className={cn(
            "flex justify-between items-start py-3",
            role === 'CLIENT' ? "min-h-20 sm:min-h-22 lg:min-h-24" : role === 'ADMIN' ? "min-h-18 sm:min-h-20 lg:min-h-22" : "h-16 sm:h-18 lg:h-20"
          )}>
            {/* Logo - Client Branding or Default */}
            <div className="flex-shrink-0 flex items-center">
              <Link 
                href={role === 'ADMIN' ? '/admin/dashboard' : role === 'CLIENT' ? '/client/dashboard' : role === 'END_USER' ? '/user/dashboard' : '/'} 
                className="flex items-center group"
              >
                {role === 'CLIENT' && clientBranding ? (
                  // Client's own logo and company name
                  <div className="flex items-center gap-3">
                    {clientBranding.logoUrl ? (
                      <div className="relative h-16 w-16 xl:h-20 xl:w-20 flex-shrink-0 transition-transform group-hover:scale-105">
                        <Image
                          src={clientBranding.logoUrl}
                          alt={clientBranding.companyName || 'Company Logo'}
                          fill
                          className="object-contain drop-shadow-lg"
                          priority
                          quality={95}
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 xl:h-20 xl:w-20 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 flex-shrink-0 transition-transform group-hover:scale-105">
                        <span className="text-xl xl:text-2xl font-bold text-white">
                          {clientBranding.companyName?.charAt(0).toUpperCase() || 'C'}
                        </span>
                      </div>
                    )}
                    {clientBranding.companyName && (
                      <span className="hidden sm:block text-white font-bold text-base xl:text-lg drop-shadow-md">
                        {clientBranding.companyName}
                      </span>
                    )}
                  </div>
                ) : (
                  // Default JENDA MOBILITY logo for Admin/User
                  <Logo 
                    size={role === 'CLIENT' ? 'lg' : 'md'} 
                    variant="icon-only" 
                    className="text-white transition-transform group-hover:scale-105" 
                  />
                )}
              </Link>
            </div>

            {/* Desktop Navigation - Allow Wrapping for All Options (Admin & Client) */}
            <div className="hidden lg:flex lg:flex-1 lg:max-w-none lg:ml-4 lg:items-start">
              <div className={`flex items-center gap-2 flex-wrap pt-1 ${role === 'ADMIN' ? '' : ''}`}>
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'inline-flex items-center px-4 py-2.5 rounded-lg text-sm xl:text-base font-semibold transition-all duration-200 whitespace-nowrap',
                        'group',
                        isActive
                          ? 'bg-white/25 text-white shadow-lg backdrop-blur-sm border-2 border-white/40'
                          : 'text-white/90 hover:bg-white/15 hover:text-white border-2 border-transparent hover:border-white/25'
                      )}
                      style={{
                        color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.9)',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                      }}
                      title={item.name}
                    >
                      <Icon className="h-5 w-5 xl:h-5.5 xl:w-5.5 flex-shrink-0 text-white mr-2" />
                      <span className="hidden xl:inline">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* User Menu & Mobile Toggle */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Global Search */}
              <div className="hidden md:block">
                <GlobalSearch />
              </div>

              {/* Notification Center */}
              <NotificationCenter userId={session?.user?.id} />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Info - Hidden on mobile */}
              <div className="hidden sm:flex items-center space-x-2 lg:space-x-3">
                <div className="text-right">
                  <p className="text-xs lg:text-sm font-semibold text-white truncate max-w-[100px]">{session?.user?.name || 'Admin User'}</p>
                  <p className="text-xs text-white/90 font-medium">{role}</p>
                </div>
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-brand-green/20 flex items-center justify-center border-2 border-white/30 flex-shrink-0">
                  <span className="text-xs lg:text-sm font-bold text-white">
                    {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-white hover:bg-white/10 focus:outline-none transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>

              {/* Desktop Sign Out */}
              <button
                onClick={() => signOut()}
                className="hidden lg:inline-flex items-center px-3 py-1.5 border border-white/30 text-xs font-medium rounded-md text-white hover:bg-white/10 focus:outline-none transition-all duration-200 backdrop-blur-sm"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Sign out
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-white/10 animate-slide-up">
              <div className="space-y-1">
                {/* Theme Toggle in Mobile Menu */}
                <div className="px-4 py-2 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white/90">Theme</span>
                    <ThemeToggle />
                  </div>
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200',
                        isActive
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'text-white hover:bg-white/10 hover:text-white border border-transparent hover:border-white/20'
                      )}
                      style={{
                        color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.9)',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0 text-white" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  )
                })}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    signOut()
                  }}
                  className="w-full flex items-center px-4 py-3 rounded-lg text-base font-semibold text-white hover:bg-white/10 hover:text-white transition-all duration-200 border border-transparent hover:border-white/20"
                  style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-white" />
                  <span className="font-medium">Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content with Modern Spacing */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}

