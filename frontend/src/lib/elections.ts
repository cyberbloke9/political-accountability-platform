import { supabase } from './supabase'

// Extended election types
export type ElectionType =
  | 'lok_sabha' | 'rajya_sabha' | 'state_assembly' | 'municipal' | 'panchayat' | 'by_election'
  // National level
  | 'presidential' | 'parliamentary' | 'senate' | 'house_of_representatives'
  // State level
  | 'gubernatorial' | 'state_senate' | 'state_legislative'
  // Regional/District level
  | 'regional_council' | 'district_council' | 'zilla_parishad'
  // Municipal level
  | 'mayoral' | 'municipal_corporation' | 'municipal_council' | 'town_council'
  // Local level
  | 'gram_sabha' | 'ward_council' | 'block_council'
  // Special
  | 'referendum' | 'recall' | 'primary' | 'runoff'

export type ElectionLevel = 'national' | 'state' | 'regional' | 'district' | 'municipal' | 'local' | 'special'

export type ElectionStatus = 'announced' | 'nominations_open' | 'campaigning' | 'polling' | 'counting' | 'completed' | 'cancelled'
export type ConstituencyType = 'lok_sabha' | 'state_assembly' | 'municipal_ward' | 'panchayat' | 'rajya_sabha_state'
export type ReservationType = 'general' | 'sc' | 'st' | 'obc' | 'women' | null
export type NominationStatus = 'filed' | 'accepted' | 'rejected' | 'withdrawn'
export type PromiseType = 'policy' | 'infrastructure' | 'welfare' | 'governance' | 'economic' | 'social' | 'environmental' | 'defense' | 'other'

// Calendar event types
export type CalendarEventType =
  | 'announcement' | 'notification' | 'nomination_start' | 'nomination_end'
  | 'scrutiny' | 'withdrawal_deadline' | 'campaign_start' | 'campaign_end'
  | 'polling_day' | 'polling_phase' | 'counting_day' | 'results_day'
  | 'oath_ceremony' | 'recount' | 'by_poll_notification'
  | 'model_code_start' | 'model_code_end'

// Country interface
export interface Country {
  id: string
  name: string
  code: string      // ISO 3166-1 alpha-3
  code_2: string    // ISO 3166-1 alpha-2
  continent: string | null
  government_type: string | null
  capital: string | null
  population: number | null
  flag_emoji: string | null
  election_system: string | null
  voting_age: number
  has_compulsory_voting: boolean
  is_active: boolean
}

// State/Province interface
export interface StateProvince {
  id: string
  country_id: string
  name: string
  code: string | null
  local_name: string | null
  state_type: 'state' | 'province' | 'territory' | 'union_territory' | 'federal_district' | 'autonomous_region' | 'prefecture' | 'canton' | 'emirate' | 'county' | 'region'
  capital: string | null
  largest_city: string | null
  population: number | null
  total_constituencies: number
  assembly_seats: number
  official_languages: string[]
  is_active: boolean
}

// Election Calendar Event interface
export interface ElectionCalendarEvent {
  id: string
  election_id: string
  election_name?: string
  election_type?: ElectionType
  election_level?: ElectionLevel
  event_type: CalendarEventType
  event_date: string
  event_time: string | null
  event_end_date: string | null
  phase_number: number | null
  total_phases: number | null
  title: string | null
  description: string | null
  is_tentative: boolean
  is_completed: boolean
  days_until?: number
  constituencies_count?: number
  states_count?: number
}

export interface Election {
  id: string
  name: string
  election_type: ElectionType
  election_level: ElectionLevel | null
  country: string
  country_id: string | null
  state: string | null
  state_id: string | null
  announcement_date: string | null
  nomination_start: string | null
  nomination_end: string | null
  polling_start: string
  polling_end: string
  counting_date: string | null
  results_date: string | null
  status: ElectionStatus
  total_constituencies: number
  total_voters_registered: number | null
  total_votes_cast: number | null
  voter_turnout_percent: number | null
  official_url: string | null
  created_at: string
  // Computed fields from queries
  days_until?: number
}

export interface Constituency {
  id: string
  name: string
  code: string | null
  constituency_type: ConstituencyType
  state: string
  district: string | null
  reservation_type: ReservationType
  total_voters_registered: number | null
  area_sq_km: number | null
  parent_constituency_id: string | null
  is_active: boolean
}

export interface Candidate {
  id: string
  politician_id: string | null
  name: string
  photo_url: string | null
  election_id: string
  constituency_id: string
  party_id: string | null
  party_name: string | null
  is_independent: boolean
  nomination_date: string | null
  nomination_status: NominationStatus
  votes_received: number | null
  vote_share_percent: number | null
  rank_in_constituency: number | null
  is_winner: boolean
  margin_of_victory: number | null
  criminal_cases_count: number
  has_serious_charges: boolean
  declared_assets_inr: number | null
  declared_liabilities_inr: number | null
  education_level: string | null
  affidavit_url: string | null
}

export interface Party {
  id: string
  name: string
  short_name: string
  symbol_name: string | null
  party_type: 'national' | 'state' | 'registered_unrecognized' | null
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
  president_name: string | null
  founded_year: number | null
  headquarters: string | null
  website_url: string | null
  twitter_handle: string | null
  facebook_url: string | null
  total_politicians_tracked: number
  total_promises_tracked: number
  is_active: boolean
}

export interface Manifesto {
  id: string
  party_id: string
  election_id: string
  title: string
  language: string
  summary: string | null
  full_text: string | null
  document_url: string | null
  document_hash: string | null
  page_count: number | null
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  promises_extracted: number
  release_date: string | null
  created_at: string
}

export interface ManifestoPromise {
  id: string
  manifesto_id: string
  promise_id: string | null
  promise_text: string
  category: string | null
  page_number: number | null
  section_title: string | null
  promise_type: PromiseType | null
  ai_confidence_score: number | null
  ai_extracted: boolean
  is_tracked: boolean
}

export interface ElectionResult {
  id: string
  election_id: string
  constituency_id: string
  winning_candidate_id: string | null
  winning_party_id: string | null
  total_voters_registered: number | null
  total_votes_cast: number | null
  valid_votes: number | null
  rejected_votes: number | null
  nota_votes: number | null
  voter_turnout_percent: number | null
  winning_margin: number | null
  winning_margin_percent: number | null
  result_declared_at: string | null
  official_result_url: string | null
}

/**
 * Get upcoming elections
 */
export async function getUpcomingElections(
  limit: number = 10
): Promise<{ data: Election[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_upcoming_elections', {
      p_limit: limit
    })

    if (error) {
      console.error('Error fetching upcoming elections:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Election[] }
  } catch (error) {
    console.error('Error fetching upcoming elections:', error)
    return { data: null, error: 'Failed to fetch elections' }
  }
}

/**
 * Get all elections with optional filters
 */
export async function getElections(
  filters?: {
    type?: ElectionType
    status?: ElectionStatus
    state?: string
    year?: number
  },
  limit: number = 20,
  offset: number = 0
): Promise<{ data: Election[] | null; count: number; error?: string }> {
  try {
    let query = supabase
      .from('elections')
      .select('*', { count: 'exact' })

    if (filters?.type) {
      query = query.eq('election_type', filters.type)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.state) {
      query = query.eq('state', filters.state)
    }
    if (filters?.year) {
      query = query
        .gte('polling_start', `${filters.year}-01-01`)
        .lte('polling_end', `${filters.year}-12-31`)
    }

    const { data, error, count } = await query
      .order('polling_start', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching elections:', error)
      return { data: null, count: 0, error: error.message }
    }

    return { data: data as Election[], count: count || 0 }
  } catch (error) {
    console.error('Error fetching elections:', error)
    return { data: null, count: 0, error: 'Failed to fetch elections' }
  }
}

/**
 * Get election by ID
 */
export async function getElectionById(
  electionId: string
): Promise<{ data: Election | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('elections')
      .select('*')
      .eq('id', electionId)
      .single()

    if (error) {
      console.error('Error fetching election:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Election }
  } catch (error) {
    console.error('Error fetching election:', error)
    return { data: null, error: 'Failed to fetch election' }
  }
}

/**
 * Get constituencies by state
 */
export async function getConstituenciesByState(
  state: string,
  type?: ConstituencyType
): Promise<{ data: Constituency[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_constituencies_by_state', {
      p_state: state,
      p_type: type || null
    })

    if (error) {
      console.error('Error fetching constituencies:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Constituency[] }
  } catch (error) {
    console.error('Error fetching constituencies:', error)
    return { data: null, error: 'Failed to fetch constituencies' }
  }
}

/**
 * Get all constituencies
 */
export async function getConstituencies(
  filters?: {
    type?: ConstituencyType
    state?: string
    district?: string
    reservation?: ReservationType
  },
  limit: number = 50,
  offset: number = 0
): Promise<{ data: Constituency[] | null; count: number; error?: string }> {
  try {
    let query = supabase
      .from('constituencies')
      .select('*', { count: 'exact' })
      .eq('is_active', true)

    if (filters?.type) {
      query = query.eq('constituency_type', filters.type)
    }
    if (filters?.state) {
      query = query.eq('state', filters.state)
    }
    if (filters?.district) {
      query = query.eq('district', filters.district)
    }
    if (filters?.reservation) {
      query = query.eq('reservation_type', filters.reservation)
    }

    const { data, error, count } = await query
      .order('name')
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching constituencies:', error)
      return { data: null, count: 0, error: error.message }
    }

    return { data: data as Constituency[], count: count || 0 }
  } catch (error) {
    console.error('Error fetching constituencies:', error)
    return { data: null, count: 0, error: 'Failed to fetch constituencies' }
  }
}

/**
 * Get candidates for an election
 */
export async function getElectionCandidates(
  electionId: string,
  constituencyId?: string
): Promise<{ data: Candidate[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_election_candidates', {
      p_election_id: electionId,
      p_constituency_id: constituencyId || null
    })

    if (error) {
      console.error('Error fetching candidates:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Candidate[] }
  } catch (error) {
    console.error('Error fetching candidates:', error)
    return { data: null, error: 'Failed to fetch candidates' }
  }
}

/**
 * Get all parties
 */
export async function getParties(
  filters?: {
    type?: 'national' | 'state' | 'registered_unrecognized'
    isActive?: boolean
  },
  limit: number = 100
): Promise<{ data: Party[] | null; error?: string }> {
  try {
    let query = supabase
      .from('parties')
      .select('*')

    if (filters?.type) {
      query = query.eq('party_type', filters.type)
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    const { data, error } = await query
      .order('name')
      .limit(limit)

    if (error) {
      console.error('Error fetching parties:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Party[] }
  } catch (error) {
    console.error('Error fetching parties:', error)
    return { data: null, error: 'Failed to fetch parties' }
  }
}

/**
 * Get party by ID
 */
export async function getPartyById(
  partyId: string
): Promise<{ data: Party | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('id', partyId)
      .single()

    if (error) {
      console.error('Error fetching party:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Party }
  } catch (error) {
    console.error('Error fetching party:', error)
    return { data: null, error: 'Failed to fetch party' }
  }
}

/**
 * Get manifestos for an election
 */
export async function getManifestos(
  electionId: string,
  partyId?: string
): Promise<{ data: Manifesto[] | null; error?: string }> {
  try {
    let query = supabase
      .from('manifestos')
      .select('*')
      .eq('election_id', electionId)

    if (partyId) {
      query = query.eq('party_id', partyId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching manifestos:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Manifesto[] }
  } catch (error) {
    console.error('Error fetching manifestos:', error)
    return { data: null, error: 'Failed to fetch manifestos' }
  }
}

/**
 * Get promises from a manifesto
 */
export async function getManifestoPromises(
  partyId: string,
  electionId: string,
  category?: string,
  limit: number = 50
): Promise<{ data: ManifestoPromise[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_manifesto_promises', {
      p_party_id: partyId,
      p_election_id: electionId,
      p_category: category || null,
      p_limit: limit
    })

    if (error) {
      console.error('Error fetching manifesto promises:', error)
      return { data: null, error: error.message }
    }

    return { data: data as ManifestoPromise[] }
  } catch (error) {
    console.error('Error fetching manifesto promises:', error)
    return { data: null, error: 'Failed to fetch promises' }
  }
}

/**
 * Convert a manifesto promise to a tracked promise
 */
export async function trackManifestoPromise(
  manifestoPromiseId: string,
  politicianId: string
): Promise<{ data: string | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('track_manifesto_promise', {
      p_manifesto_promise_id: manifestoPromiseId,
      p_politician_id: politicianId
    })

    if (error) {
      console.error('Error tracking manifesto promise:', error)
      return { data: null, error: error.message }
    }

    return { data: data as string }
  } catch (error) {
    console.error('Error tracking manifesto promise:', error)
    return { data: null, error: 'Failed to track promise' }
  }
}

/**
 * Get election results
 */
export async function getElectionResults(
  electionId: string,
  constituencyId?: string
): Promise<{ data: ElectionResult[] | null; error?: string }> {
  try {
    let query = supabase
      .from('election_results')
      .select('*')
      .eq('election_id', electionId)

    if (constituencyId) {
      query = query.eq('constituency_id', constituencyId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching results:', error)
      return { data: null, error: error.message }
    }

    return { data: data as ElectionResult[] }
  } catch (error) {
    console.error('Error fetching results:', error)
    return { data: null, error: 'Failed to fetch results' }
  }
}

/**
 * Get Indian states list
 */
export function getIndianStates(): string[] {
  return [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    // Union Territories
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry'
  ]
}

/**
 * Format election type for display
 */
export function formatElectionType(type: ElectionType): string {
  const labels: Record<ElectionType, string> = {
    lok_sabha: 'Lok Sabha',
    rajya_sabha: 'Rajya Sabha',
    state_assembly: 'State Assembly',
    municipal: 'Municipal',
    panchayat: 'Panchayat',
    by_election: 'By-Election'
  }
  return labels[type] || type
}

/**
 * Format election status for display
 */
export function formatElectionStatus(status: ElectionStatus): string {
  const labels: Record<ElectionStatus, string> = {
    announced: 'Announced',
    nominations_open: 'Nominations Open',
    campaigning: 'Campaigning',
    polling: 'Polling',
    counting: 'Counting',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }
  return labels[status] || status
}

/**
 * Get status color class
 */
export function getElectionStatusColor(status: ElectionStatus): string {
  const colors: Record<ElectionStatus, string> = {
    announced: 'bg-blue-100 text-blue-800',
    nominations_open: 'bg-purple-100 text-purple-800',
    campaigning: 'bg-orange-100 text-orange-800',
    polling: 'bg-red-100 text-red-800',
    counting: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

// =====================================================
// ELECTION LEVEL FUNCTIONS
// =====================================================

/**
 * Get elections by level (national, state, local, municipal, etc.)
 */
export async function getElectionsByLevel(
  level: ElectionLevel,
  filters?: {
    countryCode?: string
    stateCode?: string
    status?: ElectionStatus
    year?: number
  },
  limit: number = 50
): Promise<{ data: Election[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_elections_by_level', {
      p_level: level,
      p_country_code: filters?.countryCode || null,
      p_state_code: filters?.stateCode || null,
      p_status: filters?.status || null,
      p_year: filters?.year || null,
      p_limit: limit
    })

    if (error) {
      console.error('Error fetching elections by level:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Election[] }
  } catch (error) {
    console.error('Error fetching elections by level:', error)
    return { data: null, error: 'Failed to fetch elections' }
  }
}

/**
 * Get elections by country
 */
export async function getElectionsByCountry(
  countryCode: string,
  filters?: {
    level?: ElectionLevel
    status?: ElectionStatus
  },
  limit: number = 50
): Promise<{ data: Election[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_elections_by_country', {
      p_country_code: countryCode,
      p_level: filters?.level || null,
      p_status: filters?.status || null,
      p_limit: limit
    })

    if (error) {
      console.error('Error fetching elections by country:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Election[] }
  } catch (error) {
    console.error('Error fetching elections by country:', error)
    return { data: null, error: 'Failed to fetch elections' }
  }
}

/**
 * Get municipal elections by state
 */
export async function getMunicipalElectionsByState(
  stateCode: string,
  countryCode: string = 'IND',
  status?: ElectionStatus
): Promise<{ data: Election[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_municipal_elections_by_state', {
      p_state_code: stateCode,
      p_country_code: countryCode,
      p_status: status || null
    })

    if (error) {
      console.error('Error fetching municipal elections:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Election[] }
  } catch (error) {
    console.error('Error fetching municipal elections:', error)
    return { data: null, error: 'Failed to fetch municipal elections' }
  }
}

/**
 * Get local elections by state (panchayat, block, district)
 */
export async function getLocalElectionsByState(
  stateCode: string,
  countryCode: string = 'IND',
  electionTypes?: string[]
): Promise<{ data: Election[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_local_elections_by_state', {
      p_state_code: stateCode,
      p_country_code: countryCode,
      p_election_types: electionTypes || null
    })

    if (error) {
      console.error('Error fetching local elections:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Election[] }
  } catch (error) {
    console.error('Error fetching local elections:', error)
    return { data: null, error: 'Failed to fetch local elections' }
  }
}

/**
 * Get upcoming elections with optional filters
 */
export async function getUpcomingElectionsByLevel(
  filters?: {
    level?: ElectionLevel
    countryCode?: string
    stateCode?: string
    monthsAhead?: number
  },
  limit: number = 20
): Promise<{ data: Election[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_upcoming_elections_by_level', {
      p_level: filters?.level || null,
      p_country_code: filters?.countryCode || null,
      p_state_code: filters?.stateCode || null,
      p_months_ahead: filters?.monthsAhead || 12,
      p_limit: limit
    })

    if (error) {
      console.error('Error fetching upcoming elections:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Election[] }
  } catch (error) {
    console.error('Error fetching upcoming elections:', error)
    return { data: null, error: 'Failed to fetch upcoming elections' }
  }
}

// =====================================================
// COUNTRY & STATE FUNCTIONS
// =====================================================

/**
 * Get all countries
 */
export async function getCountries(
  filters?: {
    continent?: string
    search?: string
  }
): Promise<{ data: Country[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_countries', {
      p_continent: filters?.continent || null,
      p_search: filters?.search || null
    })

    if (error) {
      console.error('Error fetching countries:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Country[] }
  } catch (error) {
    console.error('Error fetching countries:', error)
    return { data: null, error: 'Failed to fetch countries' }
  }
}

/**
 * Get country by code
 */
export async function getCountryByCode(
  code: string
): Promise<{ data: Country | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_country_by_code', {
      p_code: code
    })

    if (error) {
      console.error('Error fetching country:', error)
      return { data: null, error: error.message }
    }

    return { data: data?.[0] as Country || null }
  } catch (error) {
    console.error('Error fetching country:', error)
    return { data: null, error: 'Failed to fetch country' }
  }
}

/**
 * Get states/provinces by country
 */
export async function getStatesByCountry(
  countryCode: string,
  stateType?: string
): Promise<{ data: StateProvince[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_states_by_country', {
      p_country_code: countryCode,
      p_state_type: stateType || null
    })

    if (error) {
      console.error('Error fetching states:', error)
      return { data: null, error: error.message }
    }

    return { data: data as StateProvince[] }
  } catch (error) {
    console.error('Error fetching states:', error)
    return { data: null, error: 'Failed to fetch states' }
  }
}

/**
 * Get Indian states from database
 */
export async function getIndianStatesFromDB(
  includeUTs: boolean = true
): Promise<{ data: StateProvince[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_indian_states', {
      p_include_uts: includeUTs
    })

    if (error) {
      console.error('Error fetching Indian states:', error)
      return { data: null, error: error.message }
    }

    return { data: data as StateProvince[] }
  } catch (error) {
    console.error('Error fetching Indian states:', error)
    return { data: null, error: 'Failed to fetch states' }
  }
}

/**
 * Search states/provinces
 */
export async function searchStates(
  search: string,
  countryCode?: string,
  limit: number = 20
): Promise<{ data: StateProvince[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('search_states', {
      p_search: search,
      p_country_code: countryCode || null,
      p_limit: limit
    })

    if (error) {
      console.error('Error searching states:', error)
      return { data: null, error: error.message }
    }

    return { data: data as StateProvince[] }
  } catch (error) {
    console.error('Error searching states:', error)
    return { data: null, error: 'Failed to search states' }
  }
}

// =====================================================
// ELECTION CALENDAR FUNCTIONS
// =====================================================

/**
 * Get upcoming election events
 */
export async function getUpcomingElectionEvents(
  filters?: {
    countryCode?: string
    stateCode?: string
    level?: ElectionLevel
    eventTypes?: CalendarEventType[]
    daysAhead?: number
  },
  limit: number = 50
): Promise<{ data: ElectionCalendarEvent[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_upcoming_election_events', {
      p_country_code: filters?.countryCode || null,
      p_state_code: filters?.stateCode || null,
      p_election_level: filters?.level || null,
      p_event_types: filters?.eventTypes || null,
      p_days_ahead: filters?.daysAhead || 90,
      p_limit: limit
    })

    if (error) {
      console.error('Error fetching election events:', error)
      return { data: null, error: error.message }
    }

    return { data: data as ElectionCalendarEvent[] }
  } catch (error) {
    console.error('Error fetching election events:', error)
    return { data: null, error: 'Failed to fetch events' }
  }
}

/**
 * Get election calendar for a specific election
 */
export async function getElectionCalendar(
  electionId: string
): Promise<{ data: ElectionCalendarEvent[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_election_calendar', {
      p_election_id: electionId
    })

    if (error) {
      console.error('Error fetching election calendar:', error)
      return { data: null, error: error.message }
    }

    return { data: data as ElectionCalendarEvent[] }
  } catch (error) {
    console.error('Error fetching election calendar:', error)
    return { data: null, error: 'Failed to fetch calendar' }
  }
}

/**
 * Get election events by month (for calendar view)
 */
export async function getElectionEventsByMonth(
  year: number,
  month: number,
  filters?: {
    countryCode?: string
    level?: ElectionLevel
  }
): Promise<{ data: ElectionCalendarEvent[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_election_events_by_month', {
      p_year: year,
      p_month: month,
      p_country_code: filters?.countryCode || null,
      p_election_level: filters?.level || null
    })

    if (error) {
      console.error('Error fetching events by month:', error)
      return { data: null, error: error.message }
    }

    return { data: data as ElectionCalendarEvent[] }
  } catch (error) {
    console.error('Error fetching events by month:', error)
    return { data: null, error: 'Failed to fetch events' }
  }
}

/**
 * Get polling phases for phased elections
 */
export async function getPollingPhases(
  electionId: string
): Promise<{ data: ElectionCalendarEvent[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_polling_phases', {
      p_election_id: electionId
    })

    if (error) {
      console.error('Error fetching polling phases:', error)
      return { data: null, error: error.message }
    }

    return { data: data as ElectionCalendarEvent[] }
  } catch (error) {
    console.error('Error fetching polling phases:', error)
    return { data: null, error: 'Failed to fetch phases' }
  }
}

/**
 * Get next important event for an election
 */
export async function getNextElectionEvent(
  electionId: string
): Promise<{ data: ElectionCalendarEvent | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_next_election_event', {
      p_election_id: electionId
    })

    if (error) {
      console.error('Error fetching next event:', error)
      return { data: null, error: error.message }
    }

    return { data: data?.[0] as ElectionCalendarEvent || null }
  } catch (error) {
    console.error('Error fetching next event:', error)
    return { data: null, error: 'Failed to fetch event' }
  }
}

// =====================================================
// FORMATTING HELPERS
// =====================================================

/**
 * Format election level for display
 */
export function formatElectionLevel(level: ElectionLevel): string {
  const labels: Record<ElectionLevel, string> = {
    national: 'National',
    state: 'State',
    regional: 'Regional',
    district: 'District',
    municipal: 'Municipal',
    local: 'Local',
    special: 'Special'
  }
  return labels[level] || level
}

/**
 * Get level color class
 */
export function getElectionLevelColor(level: ElectionLevel): string {
  const colors: Record<ElectionLevel, string> = {
    national: 'bg-indigo-100 text-indigo-800',
    state: 'bg-blue-100 text-blue-800',
    regional: 'bg-cyan-100 text-cyan-800',
    district: 'bg-teal-100 text-teal-800',
    municipal: 'bg-purple-100 text-purple-800',
    local: 'bg-green-100 text-green-800',
    special: 'bg-orange-100 text-orange-800'
  }
  return colors[level] || 'bg-gray-100 text-gray-800'
}

/**
 * Format calendar event type for display
 */
export function formatCalendarEventType(type: CalendarEventType): string {
  const labels: Record<CalendarEventType, string> = {
    announcement: 'Announcement',
    notification: 'Notification',
    nomination_start: 'Nominations Open',
    nomination_end: 'Nominations Close',
    scrutiny: 'Scrutiny',
    withdrawal_deadline: 'Withdrawal Deadline',
    campaign_start: 'Campaign Begins',
    campaign_end: 'Campaign Ends',
    polling_day: 'Polling Day',
    polling_phase: 'Polling Phase',
    counting_day: 'Counting Day',
    results_day: 'Results Day',
    oath_ceremony: 'Oath Ceremony',
    recount: 'Recount',
    by_poll_notification: 'By-Poll Notification',
    model_code_start: 'Model Code Begins',
    model_code_end: 'Model Code Ends'
  }
  return labels[type] || type.replace(/_/g, ' ')
}

/**
 * Get calendar event color
 */
export function getCalendarEventColor(type: CalendarEventType): string {
  const colors: Record<CalendarEventType, string> = {
    announcement: 'bg-blue-500',
    notification: 'bg-blue-400',
    nomination_start: 'bg-purple-500',
    nomination_end: 'bg-purple-400',
    scrutiny: 'bg-indigo-500',
    withdrawal_deadline: 'bg-indigo-400',
    campaign_start: 'bg-orange-500',
    campaign_end: 'bg-orange-400',
    polling_day: 'bg-red-500',
    polling_phase: 'bg-red-400',
    counting_day: 'bg-yellow-500',
    results_day: 'bg-green-500',
    oath_ceremony: 'bg-green-400',
    recount: 'bg-amber-500',
    by_poll_notification: 'bg-teal-500',
    model_code_start: 'bg-gray-500',
    model_code_end: 'bg-gray-400'
  }
  return colors[type] || 'bg-gray-500'
}

/**
 * Get all election levels for filtering
 */
export function getElectionLevels(): { value: ElectionLevel; label: string }[] {
  return [
    { value: 'national', label: 'National' },
    { value: 'state', label: 'State' },
    { value: 'district', label: 'District' },
    { value: 'municipal', label: 'Municipal' },
    { value: 'local', label: 'Local' },
    { value: 'special', label: 'Special' }
  ]
}

/**
 * Get continents for filtering
 */
export function getContinents(): string[] {
  return [
    'Africa',
    'Asia',
    'Europe',
    'North America',
    'South America',
    'Oceania'
  ]
}
