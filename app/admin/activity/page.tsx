'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ActivityFeed } from '@/components/ActivityFeed'

export default function ActivityPage() {
  return (
    <DashboardLayout>
      <div className="mobile-padding">
        <div className="mb-6 sm:mb-8">
          <h1 className="mobile-heading font-bold text-gray-900 dark:text-white">
            Activity Feed
          </h1>
          <p className="mt-2 mobile-text text-gray-600 dark:text-gray-400">
            View recent system activity and user actions
          </p>
        </div>

        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed limit={50} realTime={true} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

