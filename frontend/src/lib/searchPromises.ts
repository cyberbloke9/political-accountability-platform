import { supabase } from './supabase'

export interface SearchFilters {
  query?: string
  status?: string[]
  party?: string[]
  tags?: string[]
  dateFrom?: string
  dateTo?: string
  sortBy?: 'newest' | 'oldest' | 'most_verified' | 'trending'
  page?: number
  pageSize?: number
}

export interface SearchResult {
  promises: any[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function searchPromises(filters: SearchFilters = {}): Promise<SearchResult> {
  const {
    query = '',
    status = [],
    party = [],
    tags = [],
    dateFrom,
    dateTo,
    sortBy = 'newest',
    page = 1,
    pageSize = 12
  } = filters

  // Start building the query
  let queryBuilder = supabase
    .from('promises')
    .select(`
      *,
      promise_tag_mappings(
        tag:promise_tags(id, name, slug, color, icon)
      )
    `, { count: 'exact' })

  // Text search: politician_name OR promise_text OR party
  if (query.trim()) {
    queryBuilder = queryBuilder.or(
      `politician_name.ilike.%${query}%,promise_text.ilike.%${query}%,party.ilike.%${query}%`
    )
  }

  // Filter by status
  if (status.length > 0) {
    queryBuilder = queryBuilder.in('status', status)
  }

  // Filter by party
  if (party.length > 0) {
    queryBuilder = queryBuilder.in('party', party)
  }

  // Filter by tags (if tags selected)
  if (tags.length > 0) {
    queryBuilder = queryBuilder.in('promise_tag_mappings.tag.slug', tags)
  }

  // Filter by date range
  if (dateFrom) {
    queryBuilder = queryBuilder.gte('created_at', dateFrom)
  }
  if (dateTo) {
    queryBuilder = queryBuilder.lte('created_at', dateTo)
  }

  // Sorting
  switch (sortBy) {
    case 'oldest':
      queryBuilder = queryBuilder.order('created_at', { ascending: true })
      break
    case 'newest':
    default:
      queryBuilder = queryBuilder.order('created_at', { ascending: false })
      break
    // Note: most_verified and trending require additional joins/calculations
    // We'll implement these in a moment
  }

  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  queryBuilder = queryBuilder.range(from, to)

  // Execute query
  const { data, error, count } = await queryBuilder

  if (error) {
    console.error('Search error:', error)
    throw error
  }

  // Transform data to include tags array
  const promises = (data || []).map((promise: any) => ({
    ...promise,
    tags: promise.promise_tag_mappings?.map((m: any) => m.tag) || []
  }))

  return {
    promises,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  }
}

// Get all unique parties for filter dropdown
export async function getAllParties(): Promise<string[]> {
  const { data, error } = await supabase
    .from('promises')
    .select('party')
    .not('party', 'is', null)
    .order('party')

  if (error) {
    console.error('Error fetching parties:', error)
    return []
  }

  // Get unique parties
  const uniqueParties = [...new Set(data.map(p => p.party))]
  return uniqueParties.filter(Boolean)
}

// Get all tags for filter
export async function getAllTags() {
  const { data, error } = await supabase
    .from('promise_tags')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching tags:', error)
    return []
  }

  return data || []
}
