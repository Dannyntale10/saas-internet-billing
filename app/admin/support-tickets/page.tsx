'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface SupportTicket {
  id: string
  subject: string
  description: string
  status: string
  priority: string
  assignedTo: string | null
  resolvedAt: string | null
  createdAt: string
  user: { id: string; email: string; name: string | null } | null
  client: { id: string; name: string } | null
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }
    fetchTickets()
  }, [router, statusFilter, priorityFilter])

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (priorityFilter) params.append('priority', priorityFilter)

      const res = await fetch(`/api/admin/support-tickets?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setTickets(data)
      }
    } catch (error) {
      console.error('Error fetching support tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/support-tickets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        fetchTickets()
      }
    } catch (error) {
      console.error('Error updating ticket:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400'
      case 'high': return 'bg-orange-500/20 text-orange-400'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Support Tickets</h1>
            <p className="text-gray-400">Manage customer support tickets</p>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-button bg-brand-light text-white border border-brand-accent"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 rounded-button bg-brand-light text-white border border-brand-accent"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No support tickets found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-brand-light">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Subject</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">User</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Client</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Priority</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Created</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-brand-light/50">
                        <td className="px-4 py-3 text-sm text-gray-300">{ticket.subject}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{ticket.user?.email || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{ticket.client?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-button text-xs ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-button text-xs ${
                            ticket.status === 'resolved' || ticket.status === 'closed' ? 'bg-green-500/20 text-green-400' :
                            ticket.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-col sm:flex-row gap-2">
                            {ticket.status === 'open' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(ticket.id, 'in_progress')}
                                className="w-full sm:w-auto"
                              >
                                Start
                              </Button>
                            )}
                            {ticket.status === 'in_progress' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                                className="w-full sm:w-auto"
                              >
                                Resolve
                              </Button>
                            )}
                            <Link href={`/admin/support-tickets/${ticket.id}`}>
                              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                View
                              </Button>
                            </Link>
                          </div>
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

