'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
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
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Logo from '@/components/Logo'

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

  const adminNav: NavItem[] = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Clients', href: '/admin/clients', icon: Users },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Vouchers', href: '/admin/vouchers', icon: Ticket },
    { name: 'Packages', href: '/admin/packages', icon: Ticket },
    { name: 'Transactions', href: '/admin/transactions', icon: CreditCard },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
    { name: 'Invoices', href: '/admin/invoices', icon: CreditCard },
    { name: 'Reports', href: '/admin/reports', icon: Activity },
    { name: 'Activity Logs', href: '/admin/activity-logs', icon: Activity },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  const clientNav: NavItem[] = [
    { name: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
    { name: 'Vouchers', href: '/client/vouchers', icon: Ticket },
    { name: 'Transactions', href: '/client/transactions', icon: CreditCard },
    { name: 'Subscriptions', href: '/client/subscriptions', icon: CreditCard },
    { name: 'Invoices', href: '/client/invoices', icon: CreditCard },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Modern Navigation with Mobile Support */}
      <nav className="bg-brand-gradient border-b border-white/10 shadow-lg sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-2 group">
                <Logo size="sm" className="text-white transition-transform group-hover:scale-105" />
                <span className="hidden sm:block text-white font-bold text-lg">JENDA MOBILITY</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </div>

            {/* User Menu & Mobile Toggle */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* User Info - Hidden on mobile */}
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{session?.user?.name}</p>
                  <p className="text-xs text-white/80">{role}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-brand-green/20 flex items-center justify-center border border-white/20">
                  <span className="text-xs font-bold text-white">
                    {session?.user?.name?.charAt(0).toUpperCase()}
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
                className="hidden lg:inline-flex items-center px-4 py-2 border border-white/30 text-sm font-medium rounded-lg text-white hover:bg-white/10 focus:outline-none transition-all duration-200 backdrop-blur-sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-white/10 animate-slide-up">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-200',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  )
                })}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    signOut()
                  }}
                  className="w-full flex items-center px-4 py-3 rounded-lg text-base font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign out
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

