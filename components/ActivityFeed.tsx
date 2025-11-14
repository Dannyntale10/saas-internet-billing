'use client'

import { useState, useEffect } from 'react'
import { Clock, User, CreditCard, Ticket, Package, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  type: 'user' | 'payment' | 'voucher' | 'package' | 'system'
  action: string
  user?: string
  details?: string
  timestamp: Date
  status?: 'success' | 'error' | 'warning' | 'info'
}

interface ActivityFeedProps {
  limit?: number
  realTime?: boolean
}

const activityIcons = {
  user: User,
  payment: CreditCard,
  voucher: Ticket,
  package: Package,
  system: AlertCircle,
}

const statusColors = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  info: 'text-blue-600 dark:text-blue-400',
}

export function ActivityFeed({ limit = 20, realTime = false }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    fetchActivities()

    if (realTime) {
      // Subscribe to real-time updates
      const interval = setInterval(fetchActivities, 5000)
      return () => clearInterval(interval)
    }
  }, [realTime])

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activity?limit=' + limit)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  if (activities.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        No recent activity
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.type] || AlertCircle
        const StatusIcon = activity.status === 'success' ? CheckCircle2 :
                          activity.status === 'error' ? XCircle :
                          AlertCircle

        return (
          <div
            key={activity.id}
            className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className={`p-2 rounded-lg ${
              activity.status === 'success' ? 'bg-green-100 dark:bg-green-900/20' :
              activity.status === 'error' ? 'bg-red-100 dark:bg-red-900/20' :
              activity.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
              'bg-blue-100 dark:bg-blue-900/20'
            }`}>
              <Icon className={`h-5 w-5 ${
                activity.status === 'success' ? 'text-green-600 dark:text-green-400' :
                activity.status === 'error' ? 'text-red-600 dark:text-red-400' :
                activity.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                'text-blue-600 dark:text-blue-400'
              }`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.action}
                </p>
                {activity.status && (
                  <StatusIcon className={`h-4 w-4 ${statusColors[activity.status]}`} />
                )}
              </div>

              {activity.user && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  by {activity.user}
                </p>
              )}

              {activity.details && (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {activity.details}
                </p>
              )}

              <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 dark:text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

