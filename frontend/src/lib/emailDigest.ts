import { supabase } from './supabase'

// =====================================================
// TYPES
// =====================================================

export interface DigestSettings {
  digest_enabled: boolean
  digest_frequency: 'daily' | 'weekly' | 'monthly'
  digest_day: number // 0-6, Sunday = 0
  digest_time: string // HH:MM:SS
  last_digest_sent: string | null
}

export interface DigestData {
  followed_politicians: {
    id: string
    name: string
    party: string
    image_url: string | null
    promises_updated: number
  }[]
  promise_updates: {
    id: string
    politician_name: string
    promise_text: string
    status: string
    previous_status: string | null
    updated_at: string
  }[]
  new_verifications: number
  period_start: string
  period_end: string
}

export interface PromiseReminder {
  id: string
  user_id: string
  promise_id: string
  remind_at: string
  note: string | null
  sent: boolean
  sent_at: string | null
  created_at: string
  promise?: {
    id: string
    politician_name: string
    promise_text: string
    status: string
  }
}

// =====================================================
// DIGEST SETTINGS
// =====================================================

export async function getDigestSettings(): Promise<DigestSettings | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) return null

    const { data, error } = await supabase
      .from('user_notification_settings')
      .select('digest_enabled, digest_frequency, digest_day, digest_time, last_digest_sent')
      .eq('user_id', userData.id)
      .single()

    if (error) {
      console.error('Error fetching digest settings:', error)
      return null
    }

    return data as DigestSettings
  } catch (error) {
    console.error('Error in getDigestSettings:', error)
    return null
  }
}

export async function updateDigestSettings(
  settings: Partial<DigestSettings>
): Promise<{ success: boolean }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) return { success: false }

    const { error } = await supabase
      .from('user_notification_settings')
      .update(settings)
      .eq('user_id', userData.id)

    if (error) {
      console.error('Error updating digest settings:', error)
      return { success: false }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in updateDigestSettings:', error)
    return { success: false }
  }
}

// =====================================================
// PROMISE REMINDERS
// =====================================================

export async function createReminder(
  promiseId: string,
  remindAt: Date,
  note?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) return { success: false, error: 'User not found' }

    const { data, error } = await supabase
      .from('promise_reminders')
      .insert({
        user_id: userData.id,
        promise_id: promiseId,
        remind_at: remindAt.toISOString(),
        note: note || null
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'You already have a reminder set for this date' }
      }
      console.error('Error creating reminder:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data.id }
  } catch (error) {
    console.error('Error in createReminder:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function getReminders(): Promise<{ data: PromiseReminder[] | null; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Not authenticated' }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) return { data: null, error: 'User not found' }

    const { data, error } = await supabase
      .from('promise_reminders')
      .select(`
        *,
        promise:promises (
          id,
          politician_name,
          promise_text,
          status
        )
      `)
      .eq('user_id', userData.id)
      .eq('sent', false)
      .order('remind_at', { ascending: true })

    if (error) {
      console.error('Error fetching reminders:', error)
      return { data: null, error: error.message }
    }

    return { data: data as PromiseReminder[] }
  } catch (error) {
    console.error('Error in getReminders:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

export async function deleteReminder(reminderId: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase
      .from('promise_reminders')
      .delete()
      .eq('id', reminderId)

    if (error) {
      console.error('Error deleting reminder:', error)
      return { success: false }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteReminder:', error)
    return { success: false }
  }
}

export async function getUpcomingReminders(days: number = 7): Promise<PromiseReminder[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) return []

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    const { data, error } = await supabase
      .from('promise_reminders')
      .select(`
        *,
        promise:promises (
          id,
          politician_name,
          promise_text,
          status
        )
      `)
      .eq('user_id', userData.id)
      .eq('sent', false)
      .lte('remind_at', futureDate.toISOString())
      .order('remind_at', { ascending: true })

    if (error) {
      console.error('Error fetching upcoming reminders:', error)
      return []
    }

    return data as PromiseReminder[]
  } catch (error) {
    console.error('Error in getUpcomingReminders:', error)
    return []
  }
}
