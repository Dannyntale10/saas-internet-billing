'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'

interface TaxRate {
  id: string
  name: string
  rate: number
  type: string
  country: string | null
  region: string | null
  isActive: boolean
  createdAt: string
}

export default function TaxRatesPage() {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    rate: '',
    type: 'VAT',
    country: '',
    region: '',
    isActive: true,
  })
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }
    fetchTaxRates()
  }, [router])

  const fetchTaxRates = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/tax-rates', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setTaxRates(data)
      }
    } catch (error) {
      console.error('Error fetching tax rates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/tax-rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowForm(false)
        setFormData({
          name: '',
          rate: '',
          type: 'VAT',
          country: '',
          region: '',
          isActive: true,
        })
        fetchTaxRates()
      }
    } catch (error) {
      console.error('Error creating tax rate:', error)
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Tax Rates</h1>
            <p className="text-gray-400">Manage tax rates for invoices</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'Add Tax Rate'}
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Standard VAT"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Rate (%)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                      placeholder="18"
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
                      <option value="VAT">VAT</option>
                      <option value="GST">GST</option>
                      <option value="Sales Tax">Sales Tax</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Country (Optional)</label>
                    <Input
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Uganda"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Region (Optional)</label>
                    <Input
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      placeholder="Kampala"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-300">Active</label>
                </div>
                <Button type="submit" className="w-full sm:w-auto">Add Tax Rate</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : taxRates.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No tax rates found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-brand-light">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Rate</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Country</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Region</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {taxRates.map((taxRate) => (
                      <tr key={taxRate.id} className="hover:bg-brand-light/50">
                        <td className="px-4 py-3 text-sm text-gray-300">{taxRate.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{taxRate.rate}%</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{taxRate.type}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{taxRate.country || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{taxRate.region || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-button text-xs ${
                            taxRate.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {taxRate.isActive ? 'Active' : 'Inactive'}
                          </span>
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

