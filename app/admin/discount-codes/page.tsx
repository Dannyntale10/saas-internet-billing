'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'

interface DiscountCode {
  id: string
  code: string
  type: string
  value: number
  minAmount: number | null
  maxDiscount: number | null
  usageLimit: number | null
  usedCount: number
  isActive: boolean
  startsAt: string | null
  expiresAt: string | null
  createdAt: string
}

export default function DiscountCodesPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: '',
    minAmount: '',
    maxDiscount: '',
    usageLimit: '',
    isActive: true,
    startsAt: '',
    expiresAt: '',
  })
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }
    fetchCodes()
  }, [router])

  const fetchCodes = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/discount-codes', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setCodes(data)
      }
    } catch (error) {
      console.error('Error fetching discount codes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/discount-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value),
          minAmount: formData.minAmount ? parseFloat(formData.minAmount) : null,
          maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
          startsAt: formData.startsAt || null,
          expiresAt: formData.expiresAt || null,
        }),
      })

      if (res.ok) {
        setShowForm(false)
        setFormData({
          code: '',
          type: 'percentage',
          value: '',
          minAmount: '',
          maxDiscount: '',
          usageLimit: '',
          isActive: true,
          startsAt: '',
          expiresAt: '',
        })
        fetchCodes()
      }
    } catch (error) {
      console.error('Error creating discount code:', error)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/discount-codes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (res.ok) {
        fetchCodes()
      }
    } catch (error) {
      console.error('Error updating discount code:', error)
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Discount Codes</h1>
            <p className="text-gray-400">Manage discount codes and promotions</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'Create Code'}
            </Button>
            <Link href="/admin/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Code</label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="DISCOUNT10"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 rounded-button bg-brand-light text-white border border-brand-accent"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Value {formData.type === 'percentage' ? '(%)' : '(Amount)'}
                    </label>
                    <Input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Min Amount (Optional)</label>
                    <Input
                      type="number"
                      value={formData.minAmount}
                      onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Max Discount (Optional)</label>
                    <Input
                      type="number"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Usage Limit (Optional)</label>
                    <Input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full sm:w-auto">Create Code</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : codes.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No discount codes found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-brand-light">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Code</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Value</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Used</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {codes.map((code) => (
                      <tr key={code.id} className="hover:bg-brand-light/50">
                        <td className="px-4 py-3 text-sm text-gray-300 font-mono">{code.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{code.type}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {code.type === 'percentage' ? `${code.value}%` : `${code.value}`}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {code.usedCount} / {code.usageLimit || '∞'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-button text-xs ${
                            code.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {code.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(code.id, code.isActive)}
                            className="w-full sm:w-auto"
                          >
                            {code.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
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

