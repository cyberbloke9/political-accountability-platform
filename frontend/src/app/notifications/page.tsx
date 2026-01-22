'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotificationCard, NotificationGroup } from '@/components/notifications'
import { useNotifications } from '@/hooks/useNotifications'
import { deleteNotification, Notification } from '@/lib/notifications'
import {
  Bell,
  CheckCheck,
  Settings,
  Loader2,
  RefreshCw,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { isToday, isYesterday, isThisWeek, format } from 'date-fns'

type FilterType = 'all' | 'unread' | 'promise' | 'verification'

export default function NotificationsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterType>('all')

  const {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
    hasMore
  } = useNotifications({ limit: 50 })

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filter === 'unread') return !n.read
      if (filter === 'promise') return n.type.includes('promise')
      if (filter === 'verification') return n.type.includes('verification')
      return true
    })
  }, [notifications, filter])

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: { title: string; notifications: Notification[] }[] = []
    const today: Notification[] = []
    const yesterday: Notification[] = []
    const thisWeek: Notification[] = []
    const older: Notification[] = []

    filteredNotifications.forEach(n => {
      const date = new Date(n.created_at)
      if (isToday(date)) today.push(n)
      else if (isYesterday(date)) yesterday.push(n)
      else if (isThisWeek(date)) thisWeek.push(n)
      else older.push(n)
    })

    if (today.length > 0) groups.push({ title: 'Today', notifications: today })
    if (yesterday.length > 0) groups.push({ title: 'Yesterday', notifications: yesterday })
    if (thisWeek.length > 0) groups.push({ title: 'This Week', notifications: thisWeek })
    if (older.length > 0) groups.push({ title: 'Older', notifications: older })

    return groups
  }, [filteredNotifications])

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      markAsRead([notification.id])
      router.push(notification.link)
    }
  }

  const handleDelete = async (notification: Notification) => {
    await deleteNotification(notification.id)
    refresh()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-7 w-7" />
              <div>
                <h1 className="text-2xl font-bold">Notifications</h1>
                <p className="text-sm text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refresh()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/settings/notifications">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between gap-4">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread
                  {unreadCount > 0 && (
                    <span className="ml-1 text-xs">({unreadCount})</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="promise">Promises</TabsTrigger>
                <TabsTrigger value="verification">Verifications</TabsTrigger>
              </TabsList>
            </Tabs>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="text-muted-foreground"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Error State */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6 text-center text-destructive">
                {error}
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && notifications.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredNotifications.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-1">No notifications</h3>
                <p className="text-sm text-muted-foreground">
                  {filter === 'all'
                    ? "You're all caught up! Check back later."
                    : `No ${filter} notifications to show.`}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Notifications List */}
          {filteredNotifications.length > 0 && (
            <Card>
              <div className="divide-y">
                {groupedNotifications.map(group => (
                  <NotificationGroup
                    key={group.title}
                    title={group.title}
                    notifications={group.notifications}
                    onNotificationClick={handleNotificationClick}
                    onNotificationDelete={handleDelete}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="p-4 text-center border-t">
                  <Button
                    variant="outline"
                    onClick={() => loadMore()}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Load More
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
