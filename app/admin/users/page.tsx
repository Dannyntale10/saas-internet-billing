'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  isActive: boolean
  lastLogin: string | null
  createdAt: string
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/login?role=admin')
      return
    }

    fetchUsers()
  }, [session, status, router, roleFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (roleFilter) params.append('role', roleFilter)

      const res = await fetch(`/api/admin/users?${params}`)

      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login?role=admin')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      } else {
        const errorData = await res.json()
        setError(new Error(errorData.error || 'Failed to fetch users'))
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch users')
      setError(error)
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (searchTerm) {
      const timeout = setTimeout(() => {
        fetchUsers()
      }, 300)
      return () => clearTimeout(timeout)
    } else {
      fetchUsers()
    }
  }, [searchTerm])

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}?`)) return

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      })

      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login?role=admin')
        return
      }

      if (res.ok) {
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login?role=admin')
        return
      }

      if (res.ok) {
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      alert('Failed to update user')
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading..." />
        </div>
      </DashboardLayout>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <ErrorDisplay error="Access denied. Please login as admin." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mobile-padding">
        <div className="mb-6 sm:mb-8">
          <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
            Manage system users and their permissions
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorDisplay error={error} onRetry={fetchUsers} />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="CLIENT">Client</option>
            <option value="END_USER">End User</option>
          </select>
        </div>

        <Card className="animate-slide-up">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <LoadingSpinner size="md" text="Loading users..." />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Last Login</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{user.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                          <span className="px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-lg text-xs ${
                            user.isActive
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(user.id, user.isActive)}
                              className="w-full sm:w-auto border-2 border-blue-600 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-700 dark:hover:border-blue-500 transition-all font-bold"
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(user.id, user.email)}
                              className="w-full sm:w-auto border-2 border-red-600 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-700 dark:hover:border-red-500 transition-all font-bold"
                            >
                              Delete
                            </Button>
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
    </DashboardLayout>
  )
}
