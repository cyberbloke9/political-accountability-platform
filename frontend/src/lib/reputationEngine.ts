import { supabase } from './supabase'

export interface ReputationRule {
  id: string
  rule_name: string
  event_type: string
  points_change: number
  description: string
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface ReputationHistory {
  id: string
  user_id: string
  points_change: number
  reason: string
  event_type: string | null
  related_id: string | null
  previous_score: number
  new_score: number
  created_at: string
}

export interface UserActivityStatus {
  user_id: string
  last_verification_at: string | null
  last_vote_at: string | null
  last_active_at: string
  total_verifications: number
  total_votes: number
  inactive_days: number
  updated_at: string
}

/**
 * Get all reputation rules
 */
export async function getReputationRules(): Promise<{
  data: ReputationRule[] | null
  error: any
}> {
  try {
    const { data, error } = await supabase
      .from('reputation_rules')
      .select('*')
      .order('event_type', { ascending: true })

    if (error) return { data: null, error }

    return { data: data as ReputationRule[], error: null }
  } catch (error) {
    console.error('Error fetching reputation rules:', error)
    return { data: null, error }
  }
}

/**
 * Update a reputation rule (SuperAdmin only)
 */
export async function updateReputationRule(
  ruleId: string,
  updates: Partial<Pick<ReputationRule, 'points_change' | 'description' | 'enabled'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('reputation_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', ruleId)

    if (error) {
      console.error('Error updating reputation rule:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating reputation rule:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get reputation history for a user
 */
export async function getUserReputationHistory(
  userId: string,
  limit: number = 50
): Promise<{
  data: ReputationHistory[] | null
  error: any
}> {
  try {
    const { data, error } = await supabase
      .from('reputation_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return { data: null, error }

    return { data: data as ReputationHistory[], error: null }
  } catch (error) {
    console.error('Error fetching reputation history:', error)
    return { data: null, error }
  }
}

/**
 * Get reputation history breakdown (by event type)
 */
export async function getReputationBreakdown(userId: string): Promise<{
  data: Array<{
    event_type: string
    total_points: number
    count: number
  }> | null
  error: any
}> {
  try {
    const { data, error } = await supabase
      .from('reputation_history')
      .select('event_type, points_change')
      .eq('user_id', userId)

    if (error) return { data: null, error }

    // Group by event type and sum points
    const breakdown = data.reduce((acc: any, record: any) => {
      const type = record.event_type || 'other'
      if (!acc[type]) {
        acc[type] = { event_type: type, total_points: 0, count: 0 }
      }
      acc[type].total_points += record.points_change
      acc[type].count += 1
      return acc
    }, {})

    return { data: Object.values(breakdown), error: null }
  } catch (error) {
    console.error('Error fetching reputation breakdown:', error)
    return { data: null, error }
  }
}

/**
 * Get user activity status
 */
export async function getUserActivityStatus(userId: string): Promise<{
  data: UserActivityStatus | null
  error: any
}> {
  try {
    const { data, error } = await supabase
      .from('user_activity_status')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // User might not have activity status yet
      if (error.code === 'PGRST116') {
        return { data: null, error: null }
      }
      return { data: null, error }
    }

    return { data: data as UserActivityStatus, error: null }
  } catch (error) {
    console.error('Error fetching user activity status:', error)
    return { data: null, error }
  }
}

/**
 * Apply reputation decay (admin action)
 */
export async function applyReputationDecay(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { error } = await supabase.rpc('apply_reputation_decay')

    if (error) {
      console.error('Error applying reputation decay:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error applying reputation decay:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get reputation statistics
 */
export async function getReputationStats(): Promise<{
  totalUsers: number
  avgReputation: number
  highestReputation: number
  usersWithDecay: number
}> {
  try {
    const [usersResult, activityResult] = await Promise.all([
      supabase.from('users').select('citizen_score', { count: 'exact' }),
      supabase
        .from('user_activity_status')
        .select('inactive_days', { count: 'exact' })
        .gte('inactive_days', 30)
    ])

    const users = usersResult.data || []
    const totalUsers = usersResult.count || 0
    const avgReputation = users.length
      ? Math.round(users.reduce((sum, u) => sum + (u.citizen_score || 0), 0) / users.length)
      : 0
    const highestReputation = users.length
      ? Math.max(...users.map(u => u.citizen_score || 0))
      : 0
    const usersWithDecay = activityResult.count || 0

    return {
      totalUsers,
      avgReputation,
      highestReputation,
      usersWithDecay
    }
  } catch (error) {
    console.error('Error fetching reputation stats:', error)
    return {
      totalUsers: 0,
      avgReputation: 0,
      highestReputation: 0,
      usersWithDecay: 0
    }
  }
}
