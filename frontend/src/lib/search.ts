import { supabase } from './supabase'

// =====================================================
// TYPES
// =====================================================

export interface SearchResult {
  id: string
  type: 'promise' | 'politician' | 'election'
  title: string
  subtitle: string
  url: string
  rank: number
}

export interface AutocompleteSuggestion {
  suggestion: string
  type: 'politician' | 'party' | 'category' | 'state' | 'recent'
  count: number
}

export interface AdvancedSearchFilters {
  query?: string
  status?: string[]
  party?: string[]
  category?: string[]
  state?: string[]
  dateFrom?: string
  dateTo?: string
  sortBy?: 'relevance' | 'newest' | 'oldest' | 'most_viewed' | 'most_verified'
  page?: number
  pageSize?: number
}

export interface AdvancedSearchResult {
  promises: any[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  searchTime: number
}

// =====================================================
// UNIFIED SEARCH (Quick Search)
// =====================================================

/**
 * Search across all entities (promises, politicians)
 * Uses PostgreSQL full-text search with ranking
 */
export async function searchAll(query: string, limit: number = 10): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) {
    return []
  }

  const { data, error } = await supabase.rpc('search_all', {
    search_query: query.trim(),
    search_limit: limit
  })

  if (error) {
    console.error('Search error:', error)
    return []
  }

  return data || []
}

// =====================================================
// AUTOCOMPLETE
// =====================================================

/**
 * Get autocomplete suggestions for search input
 */
export async function getAutocompleteSuggestions(
  prefix: string,
  maxResults: number = 8
): Promise<AutocompleteSuggestion[]> {
  if (!prefix || prefix.trim().length < 2) {
    return []
  }

  const { data, error } = await supabase.rpc('search_autocomplete', {
    search_prefix: prefix.trim(),
    max_results: maxResults
  })

  if (error) {
    console.error('Autocomplete error:', error)
    return []
  }

  return data || []
}

// =====================================================
// ADVANCED PROMISE SEARCH
// =====================================================

/**
 * Advanced search with full-text search and filters
 */
export async function advancedSearch(
  filters: AdvancedSearchFilters
): Promise<AdvancedSearchResult> {
  const startTime = performance.now()

  const {
    query = '',
    status = [],
    party = [],
    category = [],
    state = [],
    dateFrom,
    dateTo,
    sortBy = 'relevance',
    page = 1,
    pageSize = 12
  } = filters

  // Build query
  let queryBuilder = supabase
    .from('promises')
    .select(`
      *,
      promise_tag_mappings(
        tag:promise_tags(id, name, slug, color, icon)
      )
    `, { count: 'exact' })

  // Full-text search using search_vector
  if (query.trim()) {
    // Use websearch_to_tsquery for more natural search syntax
    queryBuilder = queryBuilder.textSearch('search_vector', query, {
      type: 'websearch',
      config: 'english'
    })
  }

  // Apply filters
  if (status.length > 0) {
    queryBuilder = queryBuilder.in('status', status)
  }

  if (party.length > 0) {
    queryBuilder = queryBuilder.in('party', party)
  }

  if (category.length > 0) {
    queryBuilder = queryBuilder.in('category', category)
  }

  if (state.length > 0) {
    queryBuilder = queryBuilder.in('state', state)
  }

  if (dateFrom) {
    queryBuilder = queryBuilder.gte('promise_date', dateFrom)
  }

  if (dateTo) {
    queryBuilder = queryBuilder.lte('promise_date', dateTo)
  }

  // Sorting
  switch (sortBy) {
    case 'newest':
      queryBuilder = queryBuilder.order('created_at', { ascending: false })
      break
    case 'oldest':
      queryBuilder = queryBuilder.order('created_at', { ascending: true })
      break
    case 'most_viewed':
      queryBuilder = queryBuilder.order('view_count', { ascending: false })
      break
    case 'relevance':
    default:
      // For relevance, we rely on the full-text search ranking
      // but add a secondary sort by date for ties
      queryBuilder = queryBuilder.order('created_at', { ascending: false })
      break
  }

  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  queryBuilder = queryBuilder.range(from, to)

  // Execute query
  const { data, error, count } = await queryBuilder

  const searchTime = performance.now() - startTime

  if (error) {
    console.error('Advanced search error:', error)
    throw error
  }

  // Log the search query
  logSearch(query, count || 0, { status, party, category, state })

  // Transform data
  const promises = (data || []).map((promise: any) => ({
    ...promise,
    tags: promise.promise_tag_mappings?.map((m: any) => m.tag) || []
  }))

  return {
    promises,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
    searchTime
  }
}

// =====================================================
// SEARCH LOGGING
// =====================================================

/**
 * Log a search query for analytics
 */
async function logSearch(
  query: string,
  resultCount: number,
  filters: Record<string, any>
): Promise<void> {
  if (!query || query.trim().length < 2) return

  try {
    await supabase.rpc('log_search', {
      p_query: query,
      p_result_count: resultCount,
      p_filters: filters
    })
  } catch (error) {
    // Silently fail - search logging is not critical
    console.warn('Failed to log search:', error)
  }
}

// =====================================================
// POPULAR SEARCHES
// =====================================================

/**
 * Get popular searches from the last 7 days
 */
export async function getPopularSearches(): Promise<{ query: string; count: number }[]> {
  const { data, error } = await supabase
    .from('popular_searches')
    .select('normalized_query, search_count')
    .limit(10)

  if (error) {
    console.error('Error fetching popular searches:', error)
    return []
  }

  return (data || []).map(row => ({
    query: row.normalized_query,
    count: row.search_count
  }))
}

// =====================================================
// FILTER OPTIONS
// =====================================================

/**
 * Get all available filter options
 */
export async function getSearchFilterOptions() {
  const [parties, categories, states, statuses] = await Promise.all([
    getDistinctValues('party'),
    getDistinctValues('category'),
    getDistinctValues('state'),
    Promise.resolve(['pending', 'in_progress', 'fulfilled', 'broken', 'stalled'])
  ])

  return {
    parties,
    categories,
    states,
    statuses
  }
}

async function getDistinctValues(column: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('promises')
    .select(column)
    .not(column, 'is', null)
    .order(column)

  if (error) {
    console.error(`Error fetching distinct ${column}:`, error)
    return []
  }

  // Get unique values
  const unique = [...new Set(data.map((row: any) => row[column]))]
  return unique.filter(Boolean)
}

// =====================================================
// HIGHLIGHT SEARCH TERMS
// =====================================================

/**
 * Highlight search terms in text
 */
export function highlightSearchTerms(text: string, query: string): string {
  if (!query || !text) return text

  const terms = query.trim().split(/\s+/).filter(t => t.length >= 2)
  if (terms.length === 0) return text

  let result = text
  terms.forEach(term => {
    const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi')
    result = result.replace(regex, '<mark>$1</mark>')
  })

  return result
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// =====================================================
// SEARCH HISTORY (User's Recent Searches)
// =====================================================

/**
 * Get user's recent search queries
 */
export async function getUserSearchHistory(limit: number = 10): Promise<string[]> {
  const { data, error } = await supabase
    .from('search_queries')
    .select('normalized_query')
    .order('searched_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching search history:', error)
    return []
  }

  // Get unique queries
  const unique = [...new Set(data.map(row => row.normalized_query))]
  return unique.slice(0, limit)
}

/**
 * Clear user's search history
 */
export async function clearSearchHistory(): Promise<boolean> {
  const { error } = await supabase
    .from('search_queries')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all user's queries

  if (error) {
    console.error('Error clearing search history:', error)
    return false
  }

  return true
}
