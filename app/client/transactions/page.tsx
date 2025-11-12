'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/logo'

interface Transaction {
  id: string
  amount: number
  currency: string
  status: string
  paymentMethod: string | null
  createdAt: string
  package: { name: string; duration: number }
  discountCode: { code: string; type: string; value: number } | null
}

export default function ClientTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    if (!token) {
      router.push('/client/login')
      return
    }
    fetchTransactions()
  }, [router, statusFilter])

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('clientToken')
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)

      const res = await fetch(`/api/client/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        localStorage.removeItem('clientToken')
        router.push('/client/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
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
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-4">My Transactions</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/client/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-button bg-brand-light text-white border border-brand-accent"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No transactions found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-brand-light">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Package</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Payment Method</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-brand-light/50">
                        <td className="px-4 py-3 text-sm text-gray-300">
                          <div>
                            <p className="font-medium">{transaction.package.name}</p>
                            <p className="text-xs text-gray-500">{transaction.package.duration} hours</p>
                            {transaction.discountCode && (
                              <p className="text-xs text-green-400 mt-1">
                                Discount: {transaction.discountCode.code}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {transaction.currency} {transaction.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-button text-xs ${
                            transaction.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {transaction.paymentMethod || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

