import { supabase } from './supabase'

export interface TimelineEvent {
  event_type: 'status_change' | 'verification'
  event_id: string
  old_status: string | null
  new_status: string
  change_source: string
  reason: string | null
  created_at: string
  actor_name: string | null
  verdict: string | null
  evidence_preview: string | null
}

export interface PromiseLifecycle {
  days_since_created: number
  days_in_current_status: number
  total_status_changes: number
  total_verifications: number
  first_verification_at: string | null
  last_activity_at: string | null
}

export interface StatusHistoryEntry {
  id: string
  promise_id: string
  old_status: string | null
  new_status: string
  changed_by: string | null
  change_source: string
  reason: string | null
  verification_id: string | null
  created_at: string
  user?: {
    username: string
  }
}

/**
 * Get complete timeline for a promise (status changes + verifications)
 */
export async function getPromiseTimeline(promiseId: string): Promise<{
  data: TimelineEvent[] | null
  error?: string
}> {
  try {
    const { data, error } = await supabase.rpc('get_promise_timeline', {
      p_promise_id: promiseId
    })

    if (error) {
      console.error('Error fetching timeline:', error)
      return { data: null, error: error.message }
    }

    return { data: data as TimelineEvent[] }
  } catch (error) {
    console.error('Error fetching timeline:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get promise lifecycle summary
 */
export async function getPromiseLifecycle(promiseId: string): Promise<{
  data: PromiseLifecycle | null
  error?: string
}> {
  try {
    const { data, error } = await supabase.rpc('get_promise_lifecycle', {
      p_promise_id: promiseId
    })

    if (error) {
      console.error('Error fetching lifecycle:', error)
      return { data: null, error: error.message }
    }

    return { data: data?.[0] as PromiseLifecycle || null }
  } catch (error) {
    console.error('Error fetching lifecycle:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get status history for a promise
 */
export async function getStatusHistory(promiseId: string): Promise<{
  data: StatusHistoryEntry[] | null
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('promise_status_history')
      .select(`
        *,
        user:users!changed_by(username)
      `)
      .eq('promise_id', promiseId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching status history:', error)
      return { data: null, error: error.message }
    }

    return { data: data as StatusHistoryEntry[] }
  } catch (error) {
    console.error('Error fetching status history:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get timeline event icon based on event type and status
 */
export function getTimelineIcon(event: TimelineEvent): {
  icon: string
  color: string
  bgColor: string
} {
  if (event.event_type === 'verification') {
    const verdictColors: Record<string, { icon: string; color: string; bgColor: string }> = {
      fulfilled: { icon: 'CheckCircle', color: 'text-green-600', bgColor: 'bg-green-100' },
      broken: { icon: 'XCircle', color: 'text-red-600', bgColor: 'bg-red-100' },
      in_progress: { icon: 'Clock', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      stalled: { icon: 'AlertCircle', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    }
    return verdictColors[event.verdict || 'in_progress'] || verdictColors.in_progress
  }

  // Status change
  if (event.change_source === 'creation') {
    return { icon: 'Plus', color: 'text-purple-600', bgColor: 'bg-purple-100' }
  }

  const statusColors: Record<string, { icon: string; color: string; bgColor: string }> = {
    pending: { icon: 'Clock', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    fulfilled: { icon: 'CheckCircle', color: 'text-green-600', bgColor: 'bg-green-100' },
    broken: { icon: 'XCircle', color: 'text-red-600', bgColor: 'bg-red-100' },
    in_progress: { icon: 'ArrowRight', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    stalled: { icon: 'AlertCircle', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
  }

  return statusColors[event.new_status] || statusColors.pending
}

/**
 * Format timeline event for display
 */
export function formatTimelineEvent(event: TimelineEvent): {
  title: string
  description: string
} {
  if (event.event_type === 'verification') {
    return {
      title: `Verification Submitted`,
      description: event.evidence_preview
        ? `${event.actor_name || 'Anonymous'} claimed this promise is "${event.verdict}": "${event.evidence_preview}..."`
        : `${event.actor_name || 'Anonymous'} submitted verification with verdict: ${event.verdict}`
    }
  }

  // Status change
  if (event.change_source === 'creation') {
    return {
      title: 'Promise Created',
      description: `Promise was created with initial status: ${event.new_status}`
    }
  }

  if (event.old_status) {
    return {
      title: `Status Changed: ${event.old_status} → ${event.new_status}`,
      description: event.reason || `Status updated from ${event.old_status} to ${event.new_status}${event.actor_name ? ` by ${event.actor_name}` : ''}`
    }
  }

  return {
    title: `Status: ${event.new_status}`,
    description: event.reason || `Status set to ${event.new_status}`
  }
}

/**
 * Calculate time between events for timeline spacing
 */
export function calculateEventGaps(events: TimelineEvent[]): Array<{
  event: TimelineEvent
  daysSincePrevious: number
  isSignificantGap: boolean
}> {
  return events.map((event, index) => {
    if (index === 0) {
      return { event, daysSincePrevious: 0, isSignificantGap: false }
    }

    const prevDate = new Date(events[index - 1].created_at)
    const currDate = new Date(event.created_at)
    const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

    return {
      event,
      daysSincePrevious: daysDiff,
      isSignificantGap: daysDiff > 30 // More than a month is significant
    }
  })
}

/**
 * Get status label for display
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    fulfilled: 'Fulfilled',
    broken: 'Broken',
    in_progress: 'In Progress',
    stalled: 'Stalled',
    partially_fulfilled: 'Partially Fulfilled'
  }
  return labels[status] || status
}

/**
 * Get verdict label for display
 */
export function getVerdictLabel(verdict: string): string {
  const labels: Record<string, string> = {
    fulfilled: 'Fulfilled',
    broken: 'Broken',
    in_progress: 'In Progress',
    stalled: 'Stalled'
  }
  return labels[verdict] || verdict
}
