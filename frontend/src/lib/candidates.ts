import { supabase } from './supabase'

// Candidacy status types
export type CandidacyStatus =
  | 'potential'      // Could potentially run
  | 'speculated'     // Media speculation
  | 'considering'    // Publicly considering
  | 'announced'      // Officially announced
  | 'filed'          // Filed nomination
  | 'confirmed'      // Nomination accepted
  | 'withdrawn'      // Withdrew candidacy
  | 'disqualified'   // Disqualified by election commission

// Potential candidate interface
export interface PotentialCandidate {
  id: string
  politician_id: string | null
  name: string
  photo_url: string | null
  bio: string | null

  // Location
  country_id: string | null
  state_id: string | null
  constituency_id: string | null
  home_district: string | null

  // Eligibility
  eligible_positions: string[]
  eligible_election_types: string[]
  eligible_election_levels: string[]

  // Status
  candidacy_status: CandidacyStatus

  // Party
  party_id: string | null
  party_name: string | null
  party_short_name?: string | null
  is_independent: boolean

  // Current position
  current_position: string | null
  current_constituency: string | null

  // Experience
  political_experience_years: number
  previous_elections_contested: number
  previous_elections_won: number
  win_rate: number | null

  // Announcement
  announced_for_election_id: string | null
  announced_for_election?: string | null  // Election name from joins
  announced_for_constituency_id: string | null
  announced_for_constituency?: string | null  // Constituency name from joins
  announcement_date: string | null
  announcement_source: string | null

  // Filing
  nomination_filing_date: string | null
  affidavit_url: string | null

  // Social
  social_media: {
    twitter?: string
    facebook?: string
    instagram?: string
    youtube?: string
    linkedin?: string
  }

  // Contact
  contact_info: {
    email?: string
    phone?: string
    office_address?: string
    website?: string
  }

  // Metrics
  social_followers_count: number
  news_mentions_count: number
  last_news_mention_date: string | null

  // Tags
  tags: string[]
  notes: string | null

  // State info (from joins)
  state_name?: string | null

  is_active: boolean
  created_at: string
  updated_at: string
}

// Candidate status summary
export interface CandidateStatusSummary {
  candidacy_status: CandidacyStatus
  count: number
}

/**
 * Get potential candidates by state
 */
export async function getPotentialCandidatesByState(
  stateCode: string,
  filters?: {
    countryCode?: string
    partyId?: string
    status?: CandidacyStatus
  },
  limit: number = 50
): Promise<{ data: PotentialCandidate[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_potential_candidates_by_state', {
      p_state_code: stateCode,
      p_country_code: filters?.countryCode || 'IND',
      p_party_id: filters?.partyId || null,
      p_status: filters?.status || null,
      p_limit: limit
    })

    if (error) {
      console.error('Error fetching potential candidates:', error)
      return { data: null, error: error.message }
    }

    return { data: data as PotentialCandidate[] }
  } catch (error) {
    console.error('Error fetching potential candidates:', error)
    return { data: null, error: 'Failed to fetch candidates' }
  }
}

/**
 * Get potential candidates for an election
 */
export async function getPotentialCandidatesForElection(
  electionId: string,
  constituencyId?: string,
  includeAllEligible: boolean = false
): Promise<{ data: PotentialCandidate[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_potential_candidates_for_election', {
      p_election_id: electionId,
      p_constituency_id: constituencyId || null,
      p_include_all_eligible: includeAllEligible
    })

    if (error) {
      console.error('Error fetching candidates for election:', error)
      return { data: null, error: error.message }
    }

    return { data: data as PotentialCandidate[] }
  } catch (error) {
    console.error('Error fetching candidates for election:', error)
    return { data: null, error: 'Failed to fetch candidates' }
  }
}

/**
 * Get announced candidates (those who have announced for any election)
 */
export async function getAnnouncedCandidates(
  filters?: {
    countryCode?: string
    stateCode?: string
  },
  limit: number = 50
): Promise<{ data: PotentialCandidate[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_announced_candidates', {
      p_country_code: filters?.countryCode || null,
      p_state_code: filters?.stateCode || null,
      p_limit: limit
    })

    if (error) {
      console.error('Error fetching announced candidates:', error)
      return { data: null, error: error.message }
    }

    return { data: data as PotentialCandidate[] }
  } catch (error) {
    console.error('Error fetching announced candidates:', error)
    return { data: null, error: 'Failed to fetch candidates' }
  }
}

/**
 * Search potential candidates
 */
export async function searchPotentialCandidates(
  query: string,
  filters?: {
    countryCode?: string
    stateCode?: string
    partyId?: string
  },
  limit: number = 20
): Promise<{ data: PotentialCandidate[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('search_potential_candidates', {
      p_search: query,
      p_country_code: filters?.countryCode || null,
      p_state_code: filters?.stateCode || null,
      p_party_id: filters?.partyId || null,
      p_limit: limit
    })

    if (error) {
      console.error('Error searching candidates:', error)
      return { data: null, error: error.message }
    }

    return { data: data as PotentialCandidate[] }
  } catch (error) {
    console.error('Error searching candidates:', error)
    return { data: null, error: 'Failed to search candidates' }
  }
}

/**
 * Get candidate status summary by state
 */
export async function getCandidateStatusSummaryByState(
  stateCode: string,
  countryCode: string = 'IND'
): Promise<{ data: CandidateStatusSummary[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_candidate_status_summary_by_state', {
      p_state_code: stateCode,
      p_country_code: countryCode
    })

    if (error) {
      console.error('Error fetching status summary:', error)
      return { data: null, error: error.message }
    }

    return { data: data as CandidateStatusSummary[] }
  } catch (error) {
    console.error('Error fetching status summary:', error)
    return { data: null, error: 'Failed to fetch summary' }
  }
}

/**
 * Get all potential candidates with pagination
 */
export async function getAllPotentialCandidates(
  filters?: {
    countryCode?: string
    stateCode?: string
    partyId?: string
    status?: CandidacyStatus
    search?: string
  },
  limit: number = 20,
  offset: number = 0
): Promise<{ data: PotentialCandidate[] | null; count: number; error?: string }> {
  try {
    let query = supabase
      .from('potential_candidates')
      .select(`
        *,
        parties!potential_candidates_party_id_fkey (name, short_name),
        states_provinces!potential_candidates_state_id_fkey (name, code),
        elections!potential_candidates_announced_for_election_id_fkey (name)
      `, { count: 'exact' })
      .eq('is_active', true)

    if (filters?.status) {
      query = query.eq('candidacy_status', filters.status)
    }
    if (filters?.partyId) {
      query = query.eq('party_id', filters.partyId)
    }
    if (filters?.stateCode) {
      query = query.eq('states_provinces.code', filters.stateCode.toUpperCase())
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    const { data, error, count } = await query
      .order('candidacy_status', { ascending: true })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching candidates:', error)
      return { data: null, count: 0, error: error.message }
    }

    return { data: data as PotentialCandidate[], count: count || 0 }
  } catch (error) {
    console.error('Error fetching candidates:', error)
    return { data: null, count: 0, error: 'Failed to fetch candidates' }
  }
}

/**
 * Get potential candidate by ID
 */
export async function getPotentialCandidateById(
  id: string
): Promise<{ data: PotentialCandidate | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('potential_candidates')
      .select(`
        *,
        parties!potential_candidates_party_id_fkey (name, short_name, logo_url, primary_color),
        states_provinces!potential_candidates_state_id_fkey (name, code),
        constituencies!potential_candidates_constituency_id_fkey (name, code),
        elections!potential_candidates_announced_for_election_id_fkey (name, election_type, polling_start)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching candidate:', error)
      return { data: null, error: error.message }
    }

    return { data: data as PotentialCandidate }
  } catch (error) {
    console.error('Error fetching candidate:', error)
    return { data: null, error: 'Failed to fetch candidate' }
  }
}

// =====================================================
// FORMATTING HELPERS
// =====================================================

/**
 * Format candidacy status for display
 */
export function formatCandidacyStatus(status: CandidacyStatus): string {
  const labels: Record<CandidacyStatus, string> = {
    potential: 'Potential',
    speculated: 'Speculated',
    considering: 'Considering',
    announced: 'Announced',
    filed: 'Filed',
    confirmed: 'Confirmed',
    withdrawn: 'Withdrawn',
    disqualified: 'Disqualified'
  }
  return labels[status] || status
}

/**
 * Get candidacy status color class
 */
export function getCandidacyStatusColor(status: CandidacyStatus): string {
  const colors: Record<CandidacyStatus, string> = {
    potential: 'bg-gray-100 text-gray-800',
    speculated: 'bg-yellow-100 text-yellow-800',
    considering: 'bg-blue-100 text-blue-800',
    announced: 'bg-purple-100 text-purple-800',
    filed: 'bg-indigo-100 text-indigo-800',
    confirmed: 'bg-green-100 text-green-800',
    withdrawn: 'bg-orange-100 text-orange-800',
    disqualified: 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Get candidacy status icon color for timeline/badges
 */
export function getCandidacyStatusIconColor(status: CandidacyStatus): string {
  const colors: Record<CandidacyStatus, string> = {
    potential: 'text-gray-500',
    speculated: 'text-yellow-500',
    considering: 'text-blue-500',
    announced: 'text-purple-500',
    filed: 'text-indigo-500',
    confirmed: 'text-green-500',
    withdrawn: 'text-orange-500',
    disqualified: 'text-red-500'
  }
  return colors[status] || 'text-gray-500'
}

/**
 * Get all candidacy statuses for filtering
 */
export function getCandidacyStatuses(): { value: CandidacyStatus; label: string }[] {
  return [
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'filed', label: 'Filed' },
    { value: 'announced', label: 'Announced' },
    { value: 'considering', label: 'Considering' },
    { value: 'speculated', label: 'Speculated' },
    { value: 'potential', label: 'Potential' },
    { value: 'withdrawn', label: 'Withdrawn' },
    { value: 'disqualified', label: 'Disqualified' }
  ]
}

/**
 * Get active candidacy statuses (for filtering out withdrawn/disqualified)
 */
export function getActiveCandidacyStatuses(): CandidacyStatus[] {
  return ['potential', 'speculated', 'considering', 'announced', 'filed', 'confirmed']
}

/**
 * Format win rate
 */
export function formatWinRate(winRate: number | null): string {
  if (winRate === null || winRate === undefined) return 'N/A'
  return `${winRate.toFixed(1)}%`
}

/**
 * Get win rate color based on percentage
 */
export function getWinRateColor(winRate: number | null): string {
  if (winRate === null || winRate === undefined) return 'text-gray-500'
  if (winRate >= 75) return 'text-green-600'
  if (winRate >= 50) return 'text-blue-600'
  if (winRate >= 25) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Format eligible positions as readable string
 */
export function formatEligiblePositions(positions: string[]): string {
  if (!positions || positions.length === 0) return 'Not specified'
  return positions.join(', ')
}

/**
 * Get social media link with icon name
 */
export function getSocialMediaLinks(socialMedia: PotentialCandidate['social_media']): {
  platform: string
  url: string
  icon: string
}[] {
  const links: { platform: string; url: string; icon: string }[] = []

  if (socialMedia?.twitter) {
    links.push({ platform: 'Twitter', url: `https://twitter.com/${socialMedia.twitter}`, icon: 'Twitter' })
  }
  if (socialMedia?.facebook) {
    links.push({ platform: 'Facebook', url: socialMedia.facebook, icon: 'Facebook' })
  }
  if (socialMedia?.instagram) {
    links.push({ platform: 'Instagram', url: `https://instagram.com/${socialMedia.instagram}`, icon: 'Instagram' })
  }
  if (socialMedia?.youtube) {
    links.push({ platform: 'YouTube', url: socialMedia.youtube, icon: 'Youtube' })
  }
  if (socialMedia?.linkedin) {
    links.push({ platform: 'LinkedIn', url: socialMedia.linkedin, icon: 'Linkedin' })
  }

  return links
}
