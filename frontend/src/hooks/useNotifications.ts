'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  Notification
} from '@/lib/notifications'

interface UseNotificationsOptions {
  limit?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  loadMore: () => Promise<void>
  markAsRead: (ids: string[]) => Promise<void>
  markAllAsRead: () => Promise<void>
  hasMore: boolean
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { limit = 20, autoRefresh = true, refreshInterval = 60000 } = options

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const userIdRef = useRef<string | null>(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async (reset = false) => {
    try {
      setLoading(true)
      setError(null)

      const currentOffset = reset ? 0 : offset

      const [notifResult, countResult] = await Promise.all([
        getNotifications({ limit, offset: currentOffset }),
        getUnreadCount()
      ])

      if (notifResult.error) {
        setError(notifResult.error)
        return
      }

      const newNotifications = notifResult.data || []

      if (reset) {
        setNotifications(newNotifications)
        setOffset(newNotifications.length)
      } else {
        setNotifications(prev => [...prev, ...newNotifications])
        setOffset(prev => prev + newNotifications.length)
      }

      setHasMore(newNotifications.length >= limit)
      setUnreadCount(countResult)
    } catch {
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [limit, offset])

  // Initial fetch
  useEffect(() => {
    fetchNotifications(true)
  }, [])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchNotifications(true)
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  // Real-time subscription
  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    async function setupSubscription() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      if (!userData) return

      userIdRef.current = userData.id

      // Subscribe to new notifications
      const subscription = supabase
        .channel('user-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userData.id}`
          },
          (payload) => {
            const newNotification = payload.new as Notification
            setNotifications(prev => [newNotification, ...prev])
            setUnreadCount(prev => prev + 1)
          }
        )
        .subscribe()

      unsubscribe = () => subscription.unsubscribe()
    }

    setupSubscription()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  // Actions
  const refresh = useCallback(async () => {
    await fetchNotifications(true)
  }, [fetchNotifications])

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    await fetchNotifications(false)
  }, [hasMore, loading, fetchNotifications])

  const handleMarkAsRead = useCallback(async (ids: string[]) => {
    const result = await markAsRead(ids)
    if (result.success) {
      setNotifications(prev =>
        prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - result.count))
    }
  }, [])

  const handleMarkAllAsRead = useCallback(async () => {
    const result = await markAllAsRead()
    if (result.success) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    }
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    loadMore,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    hasMore
  }
}

// Lightweight hook for just the unread count
export function useUnreadCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let mounted = true

    async function fetchCount() {
      const count = await getUnreadCount()
      if (mounted) setCount(count)
    }

    fetchCount()

    // Refresh every minute
    const interval = setInterval(fetchCount, 60000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return count
}
