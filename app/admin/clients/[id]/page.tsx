'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/ui/logo'

interface Client {
  id: string
  name: string
  subdomain: string | null
  logo: string | null
  phone1: string | null
  phone2: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
}

export default function CustomizeClient() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [client, setClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    phone1: '',
    phone2: '',
    whatsapp: '',
    email: '',
    address: '',
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [notes, setNotes] = useState<Array<{ id: string; note: string; isPrivate: boolean; createdAt: string; user: { name: string | null } }>>([])
  const [newNote, setNewNote] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)

  useEffect(() => {
    fetchClient()
    fetchNotes()
  }, [clientId])

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/clients/${clientId}/notes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setNotes(data)
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return

    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/clients/${clientId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ note: newNote, isPrivate }),
      })

      if (res.ok) {
        setNewNote('')
        setIsPrivate(false)
        fetchNotes()
      }
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }

  const fetchClient = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/clients/${clientId}`, {
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
        setClient(data)
        setFormData({
          name: data.name || '',
          logo: data.logo || '',
          phone1: data.phone1 || '',
          phone2: data.phone2 || '',
          whatsapp: data.whatsapp || '',
          email: data.email || '',
          address: data.address || '',
        })
        if (data.logo) {
          setLogoPreview(data.logo)
        }
      }
    } catch (error) {
      console.error('Error fetching client:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // For now, we'll use a data URL. In production, upload to a storage service
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setLogoPreview(result)
      setFormData({ ...formData, logo: result })
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (res.status === 401) {
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
        return
      }

      if (res.ok) {
        alert('Client updated successfully!')
        router.push('/admin/dashboard')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update client')
      }
    } catch (error) {
      alert('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-dark p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Logo />
          <h1 className="text-3xl font-bold text-white mt-4">
            Customize Client: {client?.name}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client Customization</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Logo
                </label>
                {logoPreview && (
                  <div className="mb-4">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-w-xs max-h-32 object-contain bg-white p-2 rounded"
                    />
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="cursor-pointer"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Upload a logo image (PNG, JPG, SVG)
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Client Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Phone Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Primary Phone
                  </label>
                  <Input
                    value={formData.phone1}
                    onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
                    placeholder="+256702772200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Secondary Phone
                  </label>
                  <Input
                    value={formData.phone2}
                    onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                    placeholder="+256753908001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  WhatsApp Number
                </label>
                <Input
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+256702772200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="support@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Address
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Business address"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.open(`/?client=${clientId}`, '_blank')}
                  className="w-full sm:w-auto"
                >
                  Preview Client Page
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Client Notes Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-white">Client Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddNote} className="mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Add Note</label>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note about this client..."
                    className="w-full px-4 py-2 rounded-button bg-brand-light text-white border border-brand-accent min-h-[100px]"
                    rows={4}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="private"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="private" className="text-sm text-gray-300">Private note (only visible to you)</label>
                </div>
                <Button type="submit" className="w-full sm:w-auto">Add Note</Button>
              </div>
            </form>

            <div className="space-y-4">
              {notes.length === 0 ? (
                <p className="text-gray-400 text-sm">No notes yet</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="p-4 rounded-button bg-brand-light border border-brand-accent">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">{note.user.name || 'Admin'}</span>
                        {note.isPrivate && (
                          <span className="px-2 py-1 rounded-button bg-yellow-500/20 text-yellow-400 text-xs">Private</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{note.note}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

