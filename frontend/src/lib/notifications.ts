import { supabase } from './supabase'

// =====================================================
// TYPES
// =====================================================

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  action_url: string | null
  read: boolean
  category: string
  priority: 'low' | 'normal' | 'high'
  related_type: string | null
  related_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface NotificationSettings {
  in_app_enabled: boolean
  in_app_promise_updates: boolean
  in_app_verification_updates: boolean
  in_app_new_promises: boolean
  in_app_discussion_replies: boolean
  in_app_mentions: boolean
  email_enabled: boolean
  email_address: string | null
  email_verified: boolean
  email_frequency: 'instant' | 'daily' | 'weekly' | 'never'
  email_promise_updates: boolean
  email_verification_updates: boolean
  email_new_promises: boolean
  email_weekly_digest: boolean
  quiet_hours_enabled: boolean
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  timezone: string
}

// =====================================================
// GET NOTIFICATIONS
// =====================================================

export async function getNotifications(options?: {
  limit?: number
  offset?: number
  unreadOnly?: boolean
  category?: string
}): Promise<{ data: Notification[] | null; error?: string }> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Not authenticated' }

    // Get internal user ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) return { data: null, error: 'User not found' }

    const { data, error } = await supabase.rpc('get_user_notifications', {
      p_user_id: userData.id,
      p_limit: options?.limit || 20,
      p_offset: options?.offset || 0,
      p_unread_only: options?.unreadOnly || false,
      p_category: options?.category || null
    })

    if (error) {
      console.error('Error fetching notifications:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Notification[] }
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// GET UNREAD COUNT
// =====================================================

export async function getUnreadCount(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) return 0

    const { data } = await supabase.rpc('get_unread_notification_count', {
      p_user_id: userData.id
    })

    return data || 0
  } catch {
    return 0
  }
}

// =====================================================
// MARK AS READ
// =====================================================

export async function markAsRead(notificationIds?: string[]): Promise<{
  success: boolean
  count: number
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, count: 0 }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) return { success: false, count: 0 }

    const { data } = await supabase.rpc('mark_notifications_read', {
      p_user_id: userData.id,
      p_notification_ids: notificationIds || null
    })

    return { success: true, count: data || 0 }
  } catch {
    return { success: false, count: 0 }
  }
}

export async function markAllAsRead(): Promise<{ success: boolean; count: number }> {
  return markAsRead()
}

// =====================================================
// DELETE NOTIFICATION
// =====================================================

export async function deleteNotification(notificationId: string): Promise<{
  success: boolean
}> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    return { success: !error }
  } catch {
    return { success: false }
  }
}

// =====================================================
// NOTIFICATION SETTINGS
// =====================================================

export async function getNotificationSettings(): Promise<NotificationSettings | null> {
  try {
    const { data, error } = await supabase.rpc('get_notification_settings')

    if (error) {
      console.error('Error fetching settings:', error)
      return null
    }

    return data?.[0] as NotificationSettings || null
  } catch {
    return null
  }
}

export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>
): Promise<{ success: boolean }> {
  try {
    const { data, error } = await supabase.rpc('update_notification_settings', {
      p_settings: settings
    })

    if (error) {
      console.error('Error updating settings:', error)
      return { success: false }
    }

    return { success: !!data }
  } catch {
    return { success: false }
  }
}

// =====================================================
// REAL-TIME SUBSCRIPTION
// =====================================================

export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
): () => void {
  const subscription = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new as Notification)
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

// =====================================================
// NOTIFICATION ICONS & COLORS
// =====================================================

export function getNotificationIcon(type: string): {
  icon: string
  color: string
  bgColor: string
} {
  const icons: Record<string, { icon: string; color: string; bgColor: string }> = {
    promise_update: { icon: 'RefreshCw', color: 'text-blue-500', bgColor: 'bg-blue-100' },
    new_verification: { icon: 'FileText', color: 'text-green-500', bgColor: 'bg-green-100' },
    new_promise: { icon: 'Plus', color: 'text-purple-500', bgColor: 'bg-purple-100' },
    verification_approved: { icon: 'CheckCircle', color: 'text-green-500', bgColor: 'bg-green-100' },
    verification_rejected: { icon: 'XCircle', color: 'text-red-500', bgColor: 'bg-red-100' },
    mention: { icon: 'AtSign', color: 'text-blue-500', bgColor: 'bg-blue-100' },
    follow: { icon: 'UserPlus', color: 'text-purple-500', bgColor: 'bg-purple-100' },
    system: { icon: 'Bell', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  }

  return icons[type] || icons.system
}
