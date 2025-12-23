import { supabase } from './supabase'

export interface Politician {
  id: string
  name: string
  slug: string
  party: string | null
  position: string | null
  state: string | null
  constituency: string | null
  bio: string | null
  image_url: string | null
  twitter_handle: string | null
  wikipedia_url: string | null
  official_website: string | null
  date_of_birth: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PoliticianStats {
  politician_name: string
  total_promises: number
  fulfilled_count: number
  broken_count: number
  in_progress_count: number
  pending_count: number
  stalled_count: number
  fulfillment_rate: number | null
  latest_promise_date: string
  politician_id: string | null
  slug: string | null
  party: string | null
  position: string | null
  state: string | null
  image_url: string | null
}

export interface PoliticianWithStats extends Politician {
  stats: {
    total_promises: number
    fulfilled_count: number
    broken_count: number
    in_progress_count: number
    pending_count: number
    stalled_count: number
    fulfillment_rate: number | null
  }
}

// Get all politicians with optional filtering
export async function getPoliticians(options?: {
  party?: string
  state?: string
  position?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<{ data: Politician[] | null; count: number; error: Error | null }> {
  try {
    let query = supabase
      .from('politicians')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (options?.party) {
      query = query.ilike('party', `%${options.party}%`)
    }

    if (options?.state) {
      query = query.ilike('state', `%${options.state}%`)
    }

    if (options?.position) {
      query = query.ilike('position', `%${options.position}%`)
    }

    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,party.ilike.%${options.search}%`)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data, count, error } = await query

    if (error) throw error

    return { data, count: count || 0, error: null }
  } catch (error) {
    console.error('Error fetching politicians:', error)
    return { data: null, count: 0, error: error as Error }
  }
}

// Get politician by slug
export async function getPoliticianBySlug(slug: string): Promise<Politician | null> {
  try {
    const { data, error } = await supabase
      .from('politicians')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error fetching politician:', error)
    return null
  }
}

// Get politician by ID
export async function getPoliticianById(id: string): Promise<Politician | null> {
  try {
    const { data, error } = await supabase
      .from('politicians')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error fetching politician:', error)
    return null
  }
}

// Get politician stats from view
export async function getPoliticianStats(politicianName: string): Promise<PoliticianStats | null> {
  try {
    const { data, error } = await supabase
      .from('politician_stats')
      .select('*')
      .eq('politician_name', politicianName)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error fetching politician stats:', error)
    return null
  }
}

// Get all politician stats (for listing/leaderboard)
export async function getAllPoliticianStats(options?: {
  orderBy?: 'total_promises' | 'fulfillment_rate' | 'politician_name'
  ascending?: boolean
  limit?: number
}): Promise<PoliticianStats[]> {
  try {
    let query = supabase
      .from('politician_stats')
      .select('*')

    const orderColumn = options?.orderBy || 'total_promises'
    query = query.order(orderColumn, { ascending: options?.ascending ?? false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching politician stats:', error)
    return []
  }
}

// Get promises for a politician
export async function getPoliticianPromises(
  politicianName: string,
  options?: {
    status?: string
    limit?: number
    offset?: number
  }
): Promise<{ data: any[] | null; count: number }> {
  try {
    let query = supabase
      .from('promises')
      .select(`
        *,
        verifications (
          id,
          verdict,
          status,
          created_at
        )
      `, { count: 'exact' })
      .ilike('politician_name', politicianName)
      .order('created_at', { ascending: false })

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data, count, error } = await query

    if (error) throw error

    return { data, count: count || 0 }
  } catch (error) {
    console.error('Error fetching politician promises:', error)
    return { data: null, count: 0 }
  }
}

// Update politician (admin only)
export async function updatePolitician(
  id: string,
  updates: Partial<Omit<Politician, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('politicians')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Error updating politician:', error)
    return { success: false, error: error as Error }
  }
}

// Get unique parties
export async function getUniqueParties(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('politicians')
      .select('party')
      .not('party', 'is', null)
      .order('party')

    if (error) throw error

    const uniqueParties = [...new Set(data?.map(p => p.party).filter(Boolean))]
    return uniqueParties as string[]
  } catch (error) {
    console.error('Error fetching parties:', error)
    return []
  }
}

// Get unique states
export async function getUniqueStates(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('politicians')
      .select('state')
      .not('state', 'is', null)
      .order('state')

    if (error) throw error

    const uniqueStates = [...new Set(data?.map(p => p.state).filter(Boolean))]
    return uniqueStates as string[]
  } catch (error) {
    console.error('Error fetching states:', error)
    return []
  }
}

// Helper to get party color
export function getPartyColor(party: string | null): string {
  if (!party) return 'bg-gray-100 text-gray-800'

  const partyLower = party.toLowerCase()

  if (partyLower.includes('bjp') || partyLower.includes('bharatiya janata')) {
    return 'bg-orange-100 text-orange-800'
  }
  if (partyLower.includes('congress') || partyLower.includes('inc')) {
    return 'bg-blue-100 text-blue-800'
  }
  if (partyLower.includes('aap') || partyLower.includes('aam aadmi')) {
    return 'bg-cyan-100 text-cyan-800'
  }
  if (partyLower.includes('tmc') || partyLower.includes('trinamool')) {
    return 'bg-green-100 text-green-800'
  }
  if (partyLower.includes('dmk')) {
    return 'bg-red-100 text-red-800'
  }
  if (partyLower.includes('jdu') || partyLower.includes('janata dal')) {
    return 'bg-yellow-100 text-yellow-800'
  }
  if (partyLower.includes('shiv sena')) {
    return 'bg-amber-100 text-amber-800'
  }
  if (partyLower.includes('tdp')) {
    return 'bg-yellow-100 text-yellow-800'
  }
  if (partyLower.includes('ldf') || partyLower.includes('communist') || partyLower.includes('cpm')) {
    return 'bg-red-100 text-red-800'
  }

  return 'bg-purple-100 text-purple-800'
}

// Helper to format position
export function formatPosition(position: string | null): string {
  if (!position) return 'Politician'

  const positionMap: Record<string, string> = {
    'pm': 'Prime Minister',
    'cm': 'Chief Minister',
    'mp': 'Member of Parliament',
    'mla': 'Member of Legislative Assembly',
    'fm': 'Finance Minister',
    'hm': 'Home Minister',
  }

  const lower = position.toLowerCase()
  return positionMap[lower] || position
}
