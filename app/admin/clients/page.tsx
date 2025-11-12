'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Users, Plus, Phone, Mail, Calendar } from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string
  phone: string | null
  isActive: boolean
  createdAt: string
  endUsersCount: number
}

export default function ClientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login?role=admin')
      return
    }

    // STRICT: Only ADMIN users can access admin pages
    const userRole = (session.user.role as string)?.toUpperCase()
    if (userRole !== 'ADMIN') {
      console.error('❌ Access denied: User role', userRole, 'cannot access admin pages')
      signOut({ redirect: false, callbackUrl: `/auth/login?role=admin` }).then(() => {
        router.push(`/auth/login?role=admin&error=access_denied`)
      })
      return
    }

    fetchClients()
  }, [session, status, router])

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients')
      if (res.ok) {
        const data = await res.json()
        setClients(data.map((client: any) => ({
          ...client,
          endUsersCount: client._count?.endUsers || 0
        })))
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto mb-4"></div>
            <p className="text-gray-600">Loading clients...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mobile-padding">
        {/* Modern Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slide-up">
          <div>
            <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">
              Clients
            </h1>
            <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
              Manage your client accounts
            </p>
          </div>
          <Link href="/admin/clients/new">
            <Button 
              variant="gradient" 
              size="lg" 
              className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all border-2 border-green-400"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Add Client
            </Button>
          </Link>
        </div>

        {/* Clients Grid - Mobile Responsive */}
        {clients.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {clients.map((client, index) => (
              <Card 
                key={client.id}
                className="animate-scale-in hover:shadow-xl transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-green to-green-500 flex items-center justify-center shadow-lg flex-shrink-0">
                          <span className="text-white font-bold text-lg">
                            {client.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg truncate">
                            {client.name}
                          </CardTitle>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                            {client.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                      client.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {client.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-brand-green flex-shrink-0" />
                      <span className="font-medium">{client.endUsersCount}</span>
                      <span className="ml-1">end users</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-brand-green flex-shrink-0" />
                        <span className="truncate">{client.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                      <span>Joined {new Date(client.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Link href={`/admin/clients/${client.id}`}>
                        <Button 
                          variant="outline" 
                          className="w-full border-2 border-green-600 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:border-green-700 dark:hover:border-green-500 transition-all font-semibold"
                        >
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="animate-slide-up">
            <CardContent className="py-12 sm:py-16 text-center">
              <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-brand-green/10 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 sm:h-10 sm:w-10 text-brand-green" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No clients yet
              </h3>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Get started by creating a new client account to manage their internet billing.
              </p>
              <Link href="/admin/clients/new">
                <Button 
                  variant="gradient" 
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all px-8 py-4 text-lg border-2 border-green-400"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Client
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
