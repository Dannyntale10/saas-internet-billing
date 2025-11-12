'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Shield, Users, Wifi, ArrowRight, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import Logo from '@/components/Logo'

export default function Home() {
  const router = useRouter()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-brand-gradient flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo size="md" />
            <span className="text-white font-bold text-xl sm:text-2xl">JENDA MOBILITY</span>
          </div>
          <Link 
            href="/portal" 
            className="text-white/80 hover:text-white text-sm sm:text-base flex items-center space-x-2 transition-colors"
          >
            <Wifi className="h-4 w-4" />
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
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
              Manage your internet services, vouchers, and clients with ease
            </p>
          </div>

          {/* Login Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8">
            {/* Admin Login Card */}
            <Card 
              className="card-modern cursor-pointer transform transition-all duration-300 hover:scale-105"
              onMouseEnter={() => setHoveredCard('admin')}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => router.push('/auth/login?role=admin')}
            >
              <CardContent className="p-8 text-center">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 transition-all duration-300 ${
                  hoveredCard === 'admin' 
                    ? 'bg-blue-600 text-white scale-110' 
                    : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
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
                    e.stopPropagation()
                    router.push('/auth/login?role=admin')
                  }}
                >
                  Login as Admin
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>

            {/* Client Login Card */}
            <Card 
              className="card-modern cursor-pointer transform transition-all duration-300 hover:scale-105"
              onMouseEnter={() => setHoveredCard('client')}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => router.push('/auth/login?role=client')}
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
                    e.stopPropagation()
                    router.push('/auth/login?role=client')
                  }}
                >
                  Login as Client
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Additional Options */}
          <div className="text-center">
            <p className="text-white/60 text-sm mb-4">
              Need to access the WiFi portal or use a voucher?
            </p>
            <Link href="/portal">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Wifi className="mr-2 h-4 w-4" />
                Go to WiFi Portal
              </Button>
            </Link>
          </div>
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
