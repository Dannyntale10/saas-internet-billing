'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/logo'

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  status: string
  dueDate: string | null
  paidAt: string | null
  createdAt: string
  client: { name: string } | null
  transactions: Array<{
    id: string
    amount: number
    package: { name: string }
  }>
}

export default function ClientInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    if (!token) {
      router.push('/client/login')
      return
    }
    fetchInvoices()
  }, [router, statusFilter])

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('clientToken')
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)

      const res = await fetch(`/api/client/invoices?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        localStorage.removeItem('clientToken')
        router.push('/client/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setInvoices(data)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
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
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-4">My Invoices</h1>
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
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : invoices.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No invoices found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-brand-light">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Invoice #</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Due Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Paid Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-brand-light/50">
                        <td className="px-4 py-3 text-sm text-gray-300 font-mono">{invoice.invoiceNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {invoice.currency} {invoice.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-button text-xs ${
                            invoice.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                            invoice.status === 'overdue' ? 'bg-red-500/20 text-red-400' :
                            invoice.status === 'sent' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {new Date(invoice.createdAt).toLocaleDateString()}
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

