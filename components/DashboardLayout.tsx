'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  CreditCard, 
  Settings, 
  LogOut,
  Activity,
  Router
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

  const adminNav: NavItem[] = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Clients', href: '/admin/clients', icon: Users },
    { name: 'Test Payments', href: '/admin/test-payments', icon: CreditCard },
    { name: 'Monitoring', href: '/admin/monitoring', icon: Activity },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  const clientNav: NavItem[] = [
    { name: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
    { name: 'End Users', href: '/client/users', icon: Users },
    { name: 'Vouchers', href: '/client/vouchers', icon: Ticket },
    { name: 'Payments', href: '/client/payments', icon: CreditCard },
    { name: 'Monitoring', href: '/client/monitoring', icon: Activity },
    { name: 'Router Config', href: '/client/router', icon: Router },
    { name: 'Test Router', href: '/client/test-router', icon: Router },
    { name: 'Settings', href: '/client/settings', icon: Settings },
  ]

  const userNav: NavItem[] = [
    { name: 'Dashboard', href: '/user/dashboard', icon: LayoutDashboard },
    { name: 'Buy Voucher', href: '/user/buy-voucher', icon: Ticket },
    { name: 'My Vouchers', href: '/user/vouchers', icon: Ticket },
  ]

  const navItems = role === 'ADMIN' ? adminNav : role === 'CLIENT' ? clientNav : userNav

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-brand-gradient border-b border-gray-200 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/">
                  <Logo size="sm" className="text-white" />
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'border-brand-green text-white'
                          : 'border-transparent text-gray-200 hover:border-brand-green hover:text-white'
                      )}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-white">{session?.user?.name}</span>
                  <span className="text-xs text-white bg-brand-green px-2 py-1 rounded font-medium">
                    {role}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="inline-flex items-center px-3 py-2 border border-white/30 text-sm leading-4 font-medium rounded-md text-white hover:bg-white/10 focus:outline-none transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

