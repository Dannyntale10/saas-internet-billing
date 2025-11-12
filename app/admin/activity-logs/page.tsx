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

interface ActivityLog {
  id: string
  action: string
  entityType: string
  entityId: string | null
  description: string
  createdAt: string
  user: { name: string | null; email: string } | null
}

export default function ActivityLogsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/login?role=admin')
      return
    }

    fetchLogs()
  }, [session, status, router])

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/activity-logs')

      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login?role=admin')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setLogs(data)
      } else {
        const errorData = await res.json()
        setError(new Error(errorData.error || 'Failed to fetch activity logs'))
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch activity logs')
      setError(error)
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    const csv = [
      ['Date', 'User', 'Action', 'Entity Type', 'Description'].join(','),
      ...filteredLogs.map((log) =>
        [
          new Date(log.createdAt).toLocaleString(),
          log.user?.email || 'System',
          log.action,
          log.entityType,
          log.description,
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter

    return matchesSearch && matchesAction && matchesEntity
  })

  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)))
  const uniqueEntities = Array.from(new Set(logs.map((log) => log.entityType)))

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
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">Activity Logs</h1>
            <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
              View system activity and audit logs
            </p>
          </div>
          <Button 
            onClick={handleExport} 
            variant="outline" 
            className="w-full sm:w-auto border-2 border-green-600 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:border-green-700 dark:hover:border-green-500 transition-all font-bold shadow-lg hover:shadow-xl"
          >
            Export CSV
          </Button>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorDisplay error={error} onRetry={fetchLogs} />
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6 animate-slide-up">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="all">All Actions</option>
                {uniqueActions.map((action) => (
                  <option key={action} value={action}>
                    {action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
              <select
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
              >
                <option value="all">All Entities</option>
                {uniqueEntities.map((entity) => (
                  <option key={entity} value={entity}>
                    {entity}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Activity Logs ({filteredLogs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">
                <LoadingSpinner size="md" text="Loading activity logs..." />
              </div>
            ) : filteredLogs.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No activity logs found.</p>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col gap-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-white font-medium">{log.description}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {log.user?.email || 'System'} • {log.action} • {log.entityType}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
