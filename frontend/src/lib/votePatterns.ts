import { supabase } from './supabase'

export interface UserPartyBias {
  id: string
  user_id: string
  party_name: string
  upvotes_count: number
  downvotes_count: number
  total_votes: number
  bias_score: number
  last_updated: string
  user?: {
    username: string
    citizen_score: number
  }
}

export interface CoordinatedVotingGroup {
  id: string
  group_members: string[]
  verification_ids: string[]
  vote_type: string
  coordination_score: number
  time_window_minutes: number
  detected_at: string
}

/**
 * Get users with extreme partisan bias
 */
export async function getExtremeBiasUsers(minBiasScore: number = 0.8): Promise<{
  data: UserPartyBias[] | null
  error: any
}> {
  try {
    const { data, error } = await supabase
      .from('user_party_bias')
      .select(`
        *,
        user:users!user_party_bias_user_id_fkey(
          username,
          citizen_score
        )
      `)
      .or(`bias_score.gt.${minBiasScore},bias_score.lt.-${minBiasScore}`)
      .gte('total_votes', 10)
      .order('bias_score', { ascending: false })

    if (error) return { data: null, error }

    return { data: data as UserPartyBias[], error: null }
  } catch (error) {
    console.error('Error fetching extreme bias users:', error)
    return { data: null, error }
  }
}

/**
 * Get coordinated voting groups
 */
export async function getCoordinatedVotingGroups(): Promise<{
  data: CoordinatedVotingGroup[] | null
  error: any
}> {
  try {
    const { data, error } = await supabase
      .from('coordinated_voting_groups')
      .select('*')
      .order('detected_at', { ascending: false })
      .limit(50)

    if (error) return { data: null, error }

    return { data: data as CoordinatedVotingGroup[], error: null }
  } catch (error) {
    console.error('Error fetching coordinated voting groups:', error)
    return { data: null, error }
  }
}

/**
 * Get party-wise voting statistics
 */
export async function getPartyVotingStats(): Promise<{
  data: Array<{
    party_name: string
    total_users: number
    avg_bias_score: number
    total_votes: number
  }> | null
  error: any
}> {
  try {
    const { data, error } = await supabase.rpc('get_party_voting_stats')

    if (error) {
      // If function doesn't exist yet, return empty data
      console.warn('get_party_voting_stats function not found:', error)
      return { data: [], error: null }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching party voting stats:', error)
    return { data: null, error }
  }
}

/**
 * Run vote pattern analysis manually
 */
export async function runVotePatternAnalysis(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { error } = await supabase.rpc('run_vote_pattern_analysis')

    if (error) {
      console.error('Error running vote pattern analysis:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error running vote pattern analysis:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get user's own party bias (for profile page)
 */
export async function getUserPartyBias(userId: string): Promise<{
  data: UserPartyBias[] | null
  error: any
}> {
  try {
    const { data, error } = await supabase
      .from('user_party_bias')
      .select('*')
      .eq('user_id', userId)
      .order('total_votes', { ascending: false })

    if (error) return { data: null, error }

    return { data: data as UserPartyBias[], error: null }
  } catch (error) {
    console.error('Error fetching user party bias:', error)
    return { data: null, error }
  }
}
