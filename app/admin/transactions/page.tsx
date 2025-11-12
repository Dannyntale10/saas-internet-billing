'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/ui/logo'

interface Transaction {
  id: string
  amount: number
  currency: string
  status: string
  paymentMethod: string | null
  createdAt: string
  user: { email: string } | null
  package: { name: string } | null
}

export default function TransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }

    fetchTransactions()
  }, [router])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (res.status === 401) {
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
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

  const handleExport = () => {
    const csv = [
      ['ID', 'Amount', 'Currency', 'Status', 'Payment Method', 'User', 'Package', 'Date'].join(','),
      ...transactions.map((t) =>
        [
          t.id,
          t.amount,
          t.currency,
          t.status,
          t.paymentMethod || 'N/A',
          t.user?.email || 'N/A',
          t.package?.name || 'N/A',
          new Date(t.createdAt).toLocaleString(),
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.package?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter
    const matchesDate =
      dateFilter === 'all' ||
      (dateFilter === 'today' &&
        new Date(t.createdAt).toDateString() === new Date().toDateString()) ||
      (dateFilter === 'week' &&
        new Date(t.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (dateFilter === 'month' &&
        new Date(t.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

    return matchesSearch && matchesStatus && matchesDate
  })

  const totalRevenue = filteredTransactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen bg-brand-dark p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Logo />
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-4">Transactions</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link href="/admin/dashboard">
              <Button variant="outline" className="w-full sm:w-auto">Back to Dashboard</Button>
            </Link>
            <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="flex h-10 w-full rounded-button border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
              <select
                className="flex h-10 w-full rounded-button border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              Total Revenue (filtered): {filteredTransactions.filter((t) => t.status === 'completed').length} transactions - UGX {totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>All Transactions ({filteredTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-400 text-center py-8">Loading...</p>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No transactions found.</p>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-background-light p-4 rounded-button"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {transaction.currency} {transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-400">
                        {transaction.package?.name || 'N/A'} • {transaction.user?.email || 'Guest'} • {transaction.paymentMethod || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-button text-xs ${
                        transaction.status === 'completed'
                          ? 'bg-green-500/20 text-green-300'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

