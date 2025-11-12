'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/ui/logo'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  variables: string | null
  type: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    type: 'invoice',
    isActive: true,
  })
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }
    fetchTemplates()
  }, [router])

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/email-templates', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/email-templates', {
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
          subject: '',
          body: '',
          type: 'invoice',
          isActive: true,
        })
        fetchTemplates()
      }
    } catch (error) {
      console.error('Error creating template:', error)
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Email Templates</h1>
            <p className="text-gray-400">Manage email templates for notifications</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'Create Template'}
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
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Invoice Payment Reminder"
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
                    <option value="invoice">Invoice</option>
                    <option value="payment">Payment</option>
                    <option value="reminder">Reminder</option>
                    <option value="welcome">Welcome</option>
                    <option value="password_reset">Password Reset</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Invoice #{{invoiceNumber}} - Payment Reminder"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Body (HTML)</label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    placeholder="<p>Hello {{clientName}},</p><p>Your invoice #{{invoiceNumber}} is due on {{dueDate}}.</p>"
                    className="w-full px-4 py-2 rounded-button bg-brand-light text-white border border-brand-accent min-h-[200px]"
                    required
                  />
                </div>
                <Button type="submit" className="w-full sm:w-auto">Create Template</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : templates.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No email templates found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-brand-light">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Subject</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {templates.map((template) => (
                      <tr key={template.id} className="hover:bg-brand-light/50">
                        <td className="px-4 py-3 text-sm text-gray-300">{template.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          <span className="px-2 py-1 rounded-button bg-brand-accent/20 text-brand-accent text-xs">
                            {template.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">{template.subject}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-button text-xs ${
                            template.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {template.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Link href={`/admin/email-templates/${template.id}`}>
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                              Edit
                            </Button>
                          </Link>
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

