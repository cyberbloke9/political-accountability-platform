import { supabase } from './supabase'

export interface AutoApprovalRules {
  id: string
  enabled: boolean
  min_citizen_score: number
  min_evidence_length: number
  require_source_url: boolean
  min_account_age_days: number
  min_approved_verifications: number
  max_recent_rejections: number
  rejection_lookback_days: number
  description: string
  updated_at: string
}

export interface AutoApprovalLog {
  id: string
  verification_id: string
  user_id: string
  auto_approved: boolean
  reason: string
  criteria_met: Record<string, any>
  rules_snapshot: Record<string, any>
  created_at: string
}

/**
 * Get current auto-approval rules
 */
export async function getAutoApprovalRules(): Promise<{
  data: AutoApprovalRules | null
  error: any
}> {
  try {
    const { data, error } = await supabase
      .from('auto_approval_rules')
      .select('*')
      .single()

    if (error) return { data: null, error }

    return { data: data as AutoApprovalRules, error: null }
  } catch (error) {
    console.error('Error fetching auto-approval rules:', error)
    return { data: null, error }
  }
}

/**
 * Update auto-approval rules (SuperAdmin only)
 */
export async function updateAutoApprovalRules(
  updates: Partial<Omit<AutoApprovalRules, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current rules to update
    const { data: currentRules } = await getAutoApprovalRules()

    if (!currentRules) {
      return { success: false, error: 'No rules found' }
    }

    const { error } = await supabase
      .from('auto_approval_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentRules.id)

    if (error) {
      console.error('Error updating auto-approval rules:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating auto-approval rules:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get auto-approval logs with optional filtering
 */
export async function getAutoApprovalLogs(filters?: {
  auto_approved?: boolean
  limit?: number
}): Promise<{
  data: AutoApprovalLog[] | null
  error: any
}> {
  try {
    let query = supabase
      .from('auto_approval_log')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.auto_approved !== undefined) {
      query = query.eq('auto_approved', filters.auto_approved)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    } else {
      query = query.limit(50)
    }

    const { data, error } = await query

    if (error) return { data: null, error }

    return { data: data as AutoApprovalLog[], error: null }
  } catch (error) {
    console.error('Error fetching auto-approval logs:', error)
    return { data: null, error }
  }
}

/**
 * Get auto-approval statistics
 */
export async function getAutoApprovalStats(): Promise<{
  totalChecked: number
  totalApproved: number
  totalRejected: number
  approvalRate: number
  todayApproved: number
  topUsers: Array<{
    user_id: string
    username: string
    auto_approved_count: number
  }>
}> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [allLogs, todayLogs] = await Promise.all([
      supabase.from('auto_approval_log').select('auto_approved'),
      supabase
        .from('auto_approval_log')
        .select('auto_approved')
        .eq('auto_approved', true)
        .gte('created_at', today.toISOString())
    ])

    const totalChecked = allLogs.data?.length || 0
    const totalApproved = allLogs.data?.filter(l => l.auto_approved).length || 0
    const totalRejected = totalChecked - totalApproved
    const approvalRate = totalChecked > 0 ? Math.round((totalApproved / totalChecked) * 100) : 0
    const todayApproved = todayLogs.data?.length || 0

    return {
      totalChecked,
      totalApproved,
      totalRejected,
      approvalRate,
      todayApproved,
      topUsers: [] // TODO: Implement if needed
    }
  } catch (error) {
    console.error('Error fetching auto-approval stats:', error)
    return {
      totalChecked: 0,
      totalApproved: 0,
      totalRejected: 0,
      approvalRate: 0,
      todayApproved: 0,
      topUsers: []
    }
  }
}

/**
 * Estimate how many recent submissions would qualify
 */
export async function estimateQualificationRate(rules: AutoApprovalRules): Promise<{
  totalRecent: number
  wouldQualify: number
  qualificationRate: number
}> {
  try {
    // Get recent verifications (last 7 days)
    const { data: recentVerifications } = await supabase
      .from('verifications')
      .select('submitted_by')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (!recentVerifications || recentVerifications.length === 0) {
      return { totalRecent: 0, wouldQualify: 0, qualificationRate: 0 }
    }

    // Get unique submitters
    const uniqueSubmitters = [...new Set(recentVerifications.map(v => v.submitted_by))]

    // Check how many would qualify (simplified check - just citizen score)
    const { data: users } = await supabase
      .from('users')
      .select('id, citizen_score')
      .in('id', uniqueSubmitters)
      .gte('citizen_score', rules.min_citizen_score)

    const totalRecent = recentVerifications.length
    const wouldQualify = users?.length || 0
    const qualificationRate = totalRecent > 0 ? Math.round((wouldQualify / totalRecent) * 100) : 0

    return { totalRecent, wouldQualify, qualificationRate }
  } catch (error) {
    console.error('Error estimating qualification rate:', error)
    return { totalRecent: 0, wouldQualify: 0, qualificationRate: 0 }
  }
}
