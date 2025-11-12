'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/logo'

interface Subscription {
  id: string
  status: string
  billingCycle: string
  autoRenew: boolean
  startsAt: string
  expiresAt: string
  nextBillingDate: string | null
  package: { name: string; price: number; duration: number }
  client: { name: string } | null
}

export default function ClientSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    if (!token) {
      router.push('/client/login')
      return
    }
    fetchSubscriptions()
  }, [router])

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('clientToken')
      const res = await fetch('/api/client/subscriptions', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        localStorage.removeItem('clientToken')
        router.push('/client/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setSubscriptions(data)
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <Logo />
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-4">My Subscriptions</h1>
          </div>
          <Link href="/client/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : subscriptions.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No subscriptions found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                {subscriptions.map((subscription) => (
                  <Card key={subscription.id} className="bg-brand-light border-brand-accent">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{subscription.package.name}</h3>
                          <p className="text-gray-400 text-sm">
                            {subscription.package.duration} hours • {subscription.billingCycle}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-button text-xs ${
                          subscription.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          subscription.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {subscription.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Price:</span>
                          <span className="text-white font-medium">UGX {subscription.package.price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Started:</span>
                          <span className="text-white">{new Date(subscription.startsAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Expires:</span>
                          <span className="text-white">{new Date(subscription.expiresAt).toLocaleString()}</span>
                        </div>
                        {subscription.nextBillingDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Next Billing:</span>
                            <span className="text-white">{new Date(subscription.nextBillingDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400">Auto-renew:</span>
                          <span className={subscription.autoRenew ? 'text-green-400' : 'text-red-400'}>
                            {subscription.autoRenew ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        {subscription.client && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Client:</span>
                            <span className="text-white">{subscription.client.name}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

