import { supabase } from './supabase'

// =====================================================
// TYPES
// =====================================================

export interface ComparisonPolitician {
  id: string
  name: string
  slug: string
  party: string | null
  politician_position: string | null
  state: string | null
  image_url: string | null
  total_promises: number
  fulfilled_count: number
  broken_count: number
  in_progress_count: number
  pending_count: number
  stalled_count: number
  fulfillment_rate: number | null
  grade: string | null
  category_breakdown: { category: string; total: number; fulfilled: number; broken: number }[]
}

export interface ComparisonSearchResult {
  id: string
  name: string
  slug: string
  party: string | null
  politician_position: string | null
  state: string | null
  image_url: string | null
  total_promises: number
  fulfillment_rate: number | null
}

// =====================================================
// FETCH COMPARISON DATA
// =====================================================

/**
 * Get comparison data for multiple politicians
 */
export async function getPoliticianComparison(
  slugs: string[]
): Promise<{ data: ComparisonPolitician[] | null; error?: string }> {
  if (slugs.length === 0) {
    return { data: [] }
  }

  const { data, error } = await supabase.rpc('get_politician_comparison', {
    p_slugs: slugs
  })

  if (error) {
    console.error('Comparison fetch error:', error)
    return { data: null, error: error.message }
  }

  return { data: data || [] }
}

/**
 * Search politicians for comparison selector
 */
export async function searchPoliticiansForComparison(
  query: string,
  excludeSlugs: string[] = [],
  limit: number = 10
): Promise<{ data: ComparisonSearchResult[] | null; error?: string }> {
  if (!query || query.trim().length < 2) {
    return { data: [] }
  }

  const { data, error } = await supabase.rpc('search_politicians_for_comparison', {
    p_query: query.trim(),
    p_exclude_slugs: excludeSlugs,
    p_limit: limit
  })

  if (error) {
    console.error('Search comparison error:', error)
    return { data: null, error: error.message }
  }

  return { data: data || [] }
}

/**
 * Get popular politicians for comparison suggestions
 */
export async function getPopularPoliticiansForComparison(
  excludeSlugs: string[] = [],
  limit: number = 8
): Promise<{ data: ComparisonSearchResult[] | null; error?: string }> {
  let query = supabase
    .from('politician_comparison_data')
    .select('id, name, slug, party, position, state, image_url, total_promises, fulfillment_rate')

  // Only apply exclusion filter if there are slugs to exclude
  if (excludeSlugs.length > 0) {
    query = query.not('slug', 'in', `(${excludeSlugs.join(',')})`)
  }

  const { data, error } = await query
    .order('total_promises', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Popular politicians error:', error)
    return { data: null, error: error.message }
  }

  // Map 'position' from view to 'politician_position' for consistency
  const mappedData = (data || []).map(p => ({
    ...p,
    politician_position: p.position,
  })) as ComparisonSearchResult[]

  return { data: mappedData }
}

// =====================================================
// URL HELPERS
// =====================================================

/**
 * Generate a shareable comparison URL
 */
export function generateComparisonUrl(slugs: string[]): string {
  if (slugs.length === 0) return '/compare'
  return `/compare/${slugs.join('/')}`
}

/**
 * Parse slugs from comparison URL path
 */
export function parseComparisonSlugs(slugsPath: string[] | undefined): string[] {
  if (!slugsPath || slugsPath.length === 0) return []
  return slugsPath.filter(slug => slug && slug.trim().length > 0)
}

/**
 * Generate OG image URL for comparison
 */
export function generateComparisonOgUrl(
  politicians: ComparisonPolitician[],
  baseUrl: string = ''
): string {
  if (politicians.length < 2) return `${baseUrl}/api/og`

  const params = new URLSearchParams({
    type: 'comparison',
    name1: politicians[0].name,
    grade1: politicians[0].grade || 'C',
    rate1: String(Math.round(politicians[0].fulfillment_rate || 0)),
    name2: politicians[1].name,
    grade2: politicians[1].grade || 'C',
    rate2: String(Math.round(politicians[1].fulfillment_rate || 0)),
  })

  return `${baseUrl}/api/og?${params.toString()}`
}

// =====================================================
// GRADE HELPERS
// =====================================================

export const GRADE_CONFIG = {
  A: { label: 'Excellent', color: '#22C55E', bgColor: '#22C55E20', minRate: 80 },
  B: { label: 'Good', color: '#3B82F6', bgColor: '#3B82F620', minRate: 60 },
  C: { label: 'Average', color: '#F59E0B', bgColor: '#F59E0B20', minRate: 40 },
  D: { label: 'Poor', color: '#F97316', bgColor: '#F9731620', minRate: 20 },
  F: { label: 'Failing', color: '#EF4444', bgColor: '#EF444420', minRate: 0 },
} as const

export function getGradeFromRate(fulfillmentRate: number | null): keyof typeof GRADE_CONFIG | null {
  if (fulfillmentRate === null) return null
  if (fulfillmentRate >= 80) return 'A'
  if (fulfillmentRate >= 60) return 'B'
  if (fulfillmentRate >= 40) return 'C'
  if (fulfillmentRate >= 20) return 'D'
  return 'F'
}

export function getGradeConfig(grade: string | null) {
  if (!grade || !(grade in GRADE_CONFIG)) return null
  return GRADE_CONFIG[grade as keyof typeof GRADE_CONFIG]
}

// =====================================================
// COMPARISON ANALYTICS
// =====================================================

export interface ComparisonInsight {
  type: 'winner' | 'tie' | 'insight'
  metric: string
  winner?: string
  message: string
}

/**
 * Generate comparison insights
 */
export function generateComparisonInsights(
  politicians: ComparisonPolitician[]
): ComparisonInsight[] {
  if (politicians.length < 2) return []

  const insights: ComparisonInsight[] = []
  const [p1, p2] = politicians

  // Fulfillment rate comparison
  if (p1.fulfillment_rate !== null && p2.fulfillment_rate !== null) {
    const rateDiff = Math.abs(p1.fulfillment_rate - p2.fulfillment_rate)
    if (rateDiff < 5) {
      insights.push({
        type: 'tie',
        metric: 'fulfillment_rate',
        message: `Both have similar fulfillment rates (~${Math.round((p1.fulfillment_rate + p2.fulfillment_rate) / 2)}%)`
      })
    } else {
      const winner = p1.fulfillment_rate > p2.fulfillment_rate ? p1 : p2
      insights.push({
        type: 'winner',
        metric: 'fulfillment_rate',
        winner: winner.name,
        message: `${winner.name} has a ${Math.round(rateDiff)}% higher fulfillment rate`
      })
    }
  }

  // Total promises comparison
  const promiseDiff = Math.abs(p1.total_promises - p2.total_promises)
  if (promiseDiff < 3) {
    insights.push({
      type: 'tie',
      metric: 'total_promises',
      message: `Both have tracked a similar number of promises`
    })
  } else {
    const morePromises = p1.total_promises > p2.total_promises ? p1 : p2
    insights.push({
      type: 'insight',
      metric: 'total_promises',
      message: `${morePromises.name} has ${promiseDiff} more promises being tracked`
    })
  }

  // Broken promises comparison
  if (p1.broken_count > 0 || p2.broken_count > 0) {
    const brokenRatio1 = p1.total_promises > 0 ? (p1.broken_count / p1.total_promises) * 100 : 0
    const brokenRatio2 = p2.total_promises > 0 ? (p2.broken_count / p2.total_promises) * 100 : 0

    if (Math.abs(brokenRatio1 - brokenRatio2) > 10) {
      const lessBroken = brokenRatio1 < brokenRatio2 ? p1 : p2
      insights.push({
        type: 'insight',
        metric: 'broken_ratio',
        message: `${lessBroken.name} has broken fewer promises proportionally`
      })
    }
  }

  return insights
}
