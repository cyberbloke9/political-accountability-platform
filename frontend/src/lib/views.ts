import { supabase } from './supabase'

// Generate a unique session ID for anonymous view tracking
function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = sessionStorage.getItem('view_session_id')
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    sessionStorage.setItem('view_session_id', sessionId)
  }
  return sessionId
}

// Track which promises have been viewed in this session (client-side dedup)
function hasViewedInSession(promiseId: string): boolean {
  if (typeof window === 'undefined') return false

  const viewedKey = `viewed_${promiseId}`
  return sessionStorage.getItem(viewedKey) === 'true'
}

function markViewedInSession(promiseId: string): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(`viewed_${promiseId}`, 'true')
}

/**
 * Record a view for a promise
 * Implements client-side deduplication + server-side unique constraints
 */
export async function recordPromiseView(promiseId: string): Promise<boolean> {
  // Client-side dedup: don't even call the server if already viewed
  if (hasViewedInSession(promiseId)) {
    return false
  }

  try {
    const sessionId = getSessionId()

    const { data, error } = await supabase.rpc('record_promise_view', {
      p_promise_id: promiseId,
      p_session_id: sessionId
    })

    if (error) {
      console.error('Error recording view:', error)
      return false
    }

    // Mark as viewed in session regardless of server response
    markViewedInSession(promiseId)

    return data === true
  } catch (error) {
    console.error('Error recording view:', error)
    return false
  }
}

/**
 * Get view count for a promise
 */
export async function getPromiseViewCount(promiseId: string): Promise<number> {
  const { data, error } = await supabase
    .from('promises')
    .select('view_count')
    .eq('id', promiseId)
    .single()

  if (error) {
    console.error('Error fetching view count:', error)
    return 0
  }

  return data?.view_count || 0
}
