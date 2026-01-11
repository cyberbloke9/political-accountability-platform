import { supabase } from './supabase'

// Types
export type ConfidenceLevel = 'very_high' | 'high' | 'medium' | 'low' | 'very_low' | 'pending'
export type NoteType = 'context' | 'correction' | 'source_update' | 'outdated' | 'misleading' | 'needs_sources'
export type NoteStatus = 'pending' | 'shown' | 'hidden' | 'rejected'

export interface SourceAnalysis {
  sources: {
    url: string
    domain: string
    display_name: string
    tier: number
    type: string
    verified: boolean
  }[]
}

export interface VerificationQuality {
  id: string
  quality_score: number
  confidence_level: ConfidenceLevel
  source_analysis: SourceAnalysis
  corroboration_count: number
  trust_level: string
  verification_weight: number
  community_notes_count: number
}

export interface CommunityNote {
  id: string
  target_type: 'verification' | 'promise'
  target_id: string
  note_text: string
  note_type: NoteType
  supporting_urls: string[] | null
  author_id: string
  author?: {
    username: string
    citizen_score: number
  }
  helpful_count: number
  not_helpful_count: number
  status: NoteStatus
  is_visible: boolean
  created_at: string
  user_vote?: 'helpful' | 'not_helpful' | null
}

export interface Corroboration {
  id: string
  verification_id: string
  user_id: string
  user?: {
    username: string
  }
  evidence_text: string | null
  evidence_urls: string[] | null
  agrees_with_verdict: boolean
  created_at: string
}

export interface SourceDomain {
  id: string
  domain: string
  display_name: string
  credibility_tier: number
  source_type: string
  is_verified: boolean
}

/**
 * Get verification quality details
 */
export async function getVerificationQuality(
  verificationId: string
): Promise<{ data: VerificationQuality | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_verification_quality', {
      p_verification_id: verificationId
    })

    if (error) {
      console.error('Error fetching verification quality:', error)
      return { data: null, error: error.message }
    }

    return { data: data?.[0] || null }
  } catch (error) {
    console.error('Error fetching verification quality:', error)
    return { data: null, error: 'Failed to fetch quality data' }
  }
}

/**
 * Get community notes for a target
 */
export async function getCommunityNotes(
  targetType: 'verification' | 'promise',
  targetId: string
): Promise<{ data: CommunityNote[] | null; error?: string }> {
  try {
    // Get current user for vote status
    const { data: { user } } = await supabase.auth.getUser()
    let userId: string | null = null

    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single()
      userId = userData?.id || null
    }

    const { data, error } = await supabase
      .from('community_notes')
      .select(`
        *,
        author:users!author_id(username, citizen_score)
      `)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .order('helpful_count', { ascending: false })

    if (error) {
      console.error('Error fetching community notes:', error)
      return { data: null, error: error.message }
    }

    // Get user's votes if logged in
    if (userId && data) {
      const noteIds = data.map(n => n.id)
      const { data: votes } = await supabase
        .from('community_note_votes')
        .select('note_id, vote_type')
        .eq('user_id', userId)
        .in('note_id', noteIds)

      const voteMap = new Map(votes?.map(v => [v.note_id, v.vote_type]) || [])

      return {
        data: data.map(note => ({
          ...note,
          user_vote: voteMap.get(note.id) || null
        }))
      }
    }

    return { data: data as CommunityNote[] }
  } catch (error) {
    console.error('Error fetching community notes:', error)
    return { data: null, error: 'Failed to fetch notes' }
  }
}

/**
 * Add a community note
 */
export async function addCommunityNote(
  targetType: 'verification' | 'promise',
  targetId: string,
  noteText: string,
  noteType: NoteType,
  supportingUrls?: string[]
): Promise<{ data: string | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('add_community_note', {
      p_target_type: targetType,
      p_target_id: targetId,
      p_note_text: noteText,
      p_note_type: noteType,
      p_supporting_urls: supportingUrls || null
    })

    if (error) {
      console.error('Error adding community note:', error)
      return { data: null, error: error.message }
    }

    return { data: data as string }
  } catch (error) {
    console.error('Error adding community note:', error)
    return { data: null, error: 'Failed to add note' }
  }
}

/**
 * Vote on a community note
 */
export async function voteOnCommunityNote(
  noteId: string,
  voteType: 'helpful' | 'not_helpful'
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.rpc('vote_on_community_note', {
      p_note_id: noteId,
      p_vote_type: voteType
    })

    if (error) {
      console.error('Error voting on note:', error)
      return { error: error.message }
    }

    return {}
  } catch (error) {
    console.error('Error voting on note:', error)
    return { error: 'Failed to vote' }
  }
}

/**
 * Get corroborations for a verification
 */
export async function getCorroborations(
  verificationId: string
): Promise<{ data: Corroboration[] | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('evidence_corroborations')
      .select(`
        *,
        user:users!user_id(username)
      `)
      .eq('verification_id', verificationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching corroborations:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Corroboration[] }
  } catch (error) {
    console.error('Error fetching corroborations:', error)
    return { data: null, error: 'Failed to fetch corroborations' }
  }
}

/**
 * Add corroboration to a verification
 */
export async function addCorroboration(
  verificationId: string,
  evidenceText?: string,
  evidenceUrls?: string[],
  agrees: boolean = true
): Promise<{ data: string | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('add_corroboration', {
      p_verification_id: verificationId,
      p_evidence_text: evidenceText || null,
      p_evidence_urls: evidenceUrls || null,
      p_agrees: agrees
    })

    if (error) {
      console.error('Error adding corroboration:', error)
      return { data: null, error: error.message }
    }

    return { data: data as string }
  } catch (error) {
    console.error('Error adding corroboration:', error)
    return { data: null, error: 'Failed to add corroboration' }
  }
}

/**
 * Get source domains (for reference)
 */
export async function getSourceDomains(
  tier?: number
): Promise<{ data: SourceDomain[] | null; error?: string }> {
  try {
    let query = supabase
      .from('source_domains')
      .select('*')
      .order('credibility_tier')
      .order('display_name')

    if (tier) {
      query = query.eq('credibility_tier', tier)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching source domains:', error)
      return { data: null, error: error.message }
    }

    return { data: data as SourceDomain[] }
  } catch (error) {
    console.error('Error fetching source domains:', error)
    return { data: null, error: 'Failed to fetch sources' }
  }
}

/**
 * Get confidence level display info
 */
export function getConfidenceDisplay(level: ConfidenceLevel): {
  label: string
  color: string
  bgColor: string
  description: string
} {
  const displays: Record<ConfidenceLevel, {
    label: string
    color: string
    bgColor: string
    description: string
  }> = {
    very_high: {
      label: 'Very High Confidence',
      color: 'text-green-700 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      description: 'Multiple high-quality sources, strong corroboration'
    },
    high: {
      label: 'High Confidence',
      color: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      description: 'Reliable sources with good evidence'
    },
    medium: {
      label: 'Medium Confidence',
      color: 'text-yellow-700 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      description: 'Some verified sources, needs more evidence'
    },
    low: {
      label: 'Low Confidence',
      color: 'text-orange-700 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      description: 'Limited or unverified sources'
    },
    very_low: {
      label: 'Very Low Confidence',
      color: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      description: 'Insufficient evidence, needs verification'
    },
    pending: {
      label: 'Pending Analysis',
      color: 'text-gray-700 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-900/30',
      description: 'Quality score being calculated'
    }
  }

  return displays[level] || displays.pending
}

/**
 * Get tier display info
 */
export function getTierDisplay(tier: number): {
  label: string
  color: string
  description: string
} {
  const displays: Record<number, {
    label: string
    color: string
    description: string
  }> = {
    1: {
      label: 'Tier 1 - Official',
      color: 'text-green-600',
      description: 'Government, courts, RTI responses'
    },
    2: {
      label: 'Tier 2 - Major News',
      color: 'text-blue-600',
      description: 'National newspapers, wire services'
    },
    3: {
      label: 'Tier 3 - Regional',
      color: 'text-yellow-600',
      description: 'Regional news, verified journalists'
    },
    4: {
      label: 'Tier 4 - Unverified',
      color: 'text-red-600',
      description: 'Social media, blogs, unverified'
    }
  }

  return displays[tier] || displays[4]
}

/**
 * Format quality score as percentage
 */
export function formatQualityScore(score: number): string {
  return `${Math.round(score)}%`
}

/**
 * Get note type display info
 */
export function getNoteTypeDisplay(type: NoteType): {
  label: string
  icon: string
  color: string
} {
  const displays: Record<NoteType, { label: string; icon: string; color: string }> = {
    context: { label: 'Added Context', icon: 'info', color: 'text-blue-600' },
    correction: { label: 'Correction', icon: 'edit', color: 'text-orange-600' },
    source_update: { label: 'Source Update', icon: 'link', color: 'text-green-600' },
    outdated: { label: 'Outdated', icon: 'clock', color: 'text-yellow-600' },
    misleading: { label: 'Misleading', icon: 'alert-triangle', color: 'text-red-600' },
    needs_sources: { label: 'Needs Sources', icon: 'file-question', color: 'text-purple-600' }
  }

  return displays[type] || displays.context
}
