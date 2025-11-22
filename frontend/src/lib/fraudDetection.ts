import { supabase } from './supabase'

export interface FraudFlag {
  id: string
  flag_type: 'spam' | 'vote_manipulation' | 'low_quality' | 'duplicate' | 'coordinated_voting'
  target_type: 'verification' | 'user' | 'vote'
  target_id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'reviewed' | 'confirmed' | 'dismissed'
  confidence_score: number
  details: Record<string, any>
  auto_detected: boolean
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
}

export interface FraudFlagWithTarget extends FraudFlag {
  verification?: {
    id: string
    verdict: string
    evidence: string
    promise: {
      id: string
      title: string
      politician: {
        name: string
      }
    }
    submitted_by_user: {
      username: string
      citizen_score: number
    }
  }
  user?: {
    id: string
    username: string
    citizen_score: number
    created_at: string
  }
}

/**
 * Fetch all fraud flags with optional filtering
 */
export async function getFraudFlags(filters?: {
  status?: string
  severity?: string
  flag_type?: string
}): Promise<{ data: FraudFlagWithTarget[] | null; error: any }> {
  try {
    let query = supabase
      .from('fraud_flags')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.severity) {
      query = query.eq('severity', filters.severity)
    }
    if (filters?.flag_type) {
      query = query.eq('flag_type', filters.flag_type)
    }

    const { data: flags, error } = await query

    if (error) return { data: null, error }
    if (!flags) return { data: [], error: null }

    // Fetch related target data
    const enrichedFlags = await Promise.all(
      flags.map(async (flag) => {
        if (flag.target_type === 'verification') {
          const { data: verification } = await supabase
            .from('verifications')
            .select(`
              id,
              verdict,
              evidence,
              promise:promises(
                id,
                title,
                politician:politicians(name)
              ),
              submitted_by_user:users!verifications_submitted_by_fkey(
                username,
                citizen_score
              )
            `)
            .eq('id', flag.target_id)
            .single()

          return { ...flag, verification }
        } else if (flag.target_type === 'user') {
          const { data: user } = await supabase
            .from('users')
            .select('id, username, citizen_score, created_at')
            .eq('id', flag.target_id)
            .single()

          return { ...flag, user }
        }
        return flag
      })
    )

    return { data: enrichedFlags as FraudFlagWithTarget[], error: null }
  } catch (error) {
    console.error('Error fetching fraud flags:', error)
    return { data: null, error }
  }
}

/**
 * Run fraud detection algorithms manually
 */
export async function runFraudDetection(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('run_fraud_detection')

    if (error) {
      console.error('Error running fraud detection:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error running fraud detection:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Review a fraud flag (confirm or dismiss)
 */
export async function reviewFraudFlag(
  flagId: string,
  newStatus: 'confirmed' | 'dismissed',
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!adminUser) {
      return { success: false, error: 'Admin user not found' }
    }

    const { error } = await supabase.rpc('review_fraud_flag', {
      flag_id: flagId,
      admin_user_id: adminUser.id,
      new_status: newStatus,
      admin_notes: adminNotes || null
    })

    if (error) {
      console.error('Error reviewing fraud flag:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error reviewing fraud flag:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get fraud statistics for the dashboard
 */
export async function getFraudStats(): Promise<{
  total: number
  pending: number
  confirmed: number
  dismissed: number
  bySeverity: Record<string, number>
  byType: Record<string, number>
}> {
  try {
    const { data: flags } = await supabase
      .from('fraud_flags')
      .select('status, severity, flag_type')

    if (!flags) {
      return {
        total: 0,
        pending: 0,
        confirmed: 0,
        dismissed: 0,
        bySeverity: {},
        byType: {}
      }
    }

    const stats = {
      total: flags.length,
      pending: flags.filter(f => f.status === 'pending').length,
      confirmed: flags.filter(f => f.status === 'confirmed').length,
      dismissed: flags.filter(f => f.status === 'dismissed').length,
      bySeverity: flags.reduce((acc, f) => {
        acc[f.severity] = (acc[f.severity] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byType: flags.reduce((acc, f) => {
        acc[f.flag_type] = (acc[f.flag_type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    return stats
  } catch (error) {
    console.error('Error fetching fraud stats:', error)
    return {
      total: 0,
      pending: 0,
      confirmed: 0,
      dismissed: 0,
      bySeverity: {},
      byType: {}
    }
  }
}
