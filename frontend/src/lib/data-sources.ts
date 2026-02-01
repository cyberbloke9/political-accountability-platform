import { createClient } from '@/lib/supabase/client'

// Data source types
export type DataSourceType =
  | 'manual'
  | 'eci_website'
  | 'data_gov_in'
  | 'datameet_github'
  | 'kaggle'
  | 'myneta'
  | 'csep'
  | 'state_ec'
  | 'news_media'
  | 'other'

export interface ElectionDataSource {
  id: string
  name: string
  source_type: DataSourceType
  url: string | null
  description: string | null
  license: string | null
  reliability_score: number | null
  last_updated: string | null
  is_active: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ElectionDataImport {
  id: string
  source_id: string | null
  import_type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  records_processed: number
  records_created: number
  records_updated: number
  records_failed: number
  error_log: unknown[]
  started_at: string | null
  completed_at: string | null
  imported_by: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// Fetch all data sources
export async function getDataSources(activeOnly: boolean = true): Promise<{
  data: ElectionDataSource[] | null
  error: string | undefined
}> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('get_election_data_sources', {
    p_active_only: activeOnly
  })

  return {
    data: data as ElectionDataSource[] | null,
    error: error?.message
  }
}

// Fetch data source by ID
export async function getDataSourceById(id: string): Promise<{
  data: ElectionDataSource | null
  error: string | undefined
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('election_data_sources')
    .select('*')
    .eq('id', id)
    .single()

  return {
    data: data as ElectionDataSource | null,
    error: error?.message
  }
}

// Get import history
export async function getImportHistory(
  limit: number = 50,
  sourceId?: string
): Promise<{
  data: ElectionDataImport[] | null
  error: string | undefined
}> {
  const supabase = createClient()

  let query = supabase
    .from('election_data_imports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (sourceId) {
    query = query.eq('source_id', sourceId)
  }

  const { data, error } = await query

  return {
    data: data as ElectionDataImport[] | null,
    error: error?.message
  }
}

// Start a new import
export async function startImport(
  sourceId: string,
  importType: string,
  metadata?: Record<string, unknown>
): Promise<{
  importId: string | null
  error: string | undefined
}> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('start_data_import', {
    p_source_id: sourceId,
    p_import_type: importType,
    p_user_id: null, // Will be set by RLS
    p_metadata: metadata || {}
  })

  return {
    importId: data as string | null,
    error: error?.message
  }
}

// Update import progress
export async function updateImportProgress(
  importId: string,
  progress: {
    recordsProcessed: number
    recordsCreated?: number
    recordsUpdated?: number
    recordsFailed?: number
    status?: 'pending' | 'running' | 'completed' | 'failed'
  }
): Promise<{ error: string | undefined }> {
  const supabase = createClient()

  const { error } = await supabase.rpc('update_import_progress', {
    p_import_id: importId,
    p_records_processed: progress.recordsProcessed,
    p_records_created: progress.recordsCreated || 0,
    p_records_updated: progress.recordsUpdated || 0,
    p_records_failed: progress.recordsFailed || 0,
    p_status: progress.status || null
  })

  return { error: error?.message }
}

// Data source type labels
export function getDataSourceTypeLabel(type: DataSourceType): string {
  const labels: Record<DataSourceType, string> = {
    manual: 'Manual Entry',
    eci_website: 'ECI Website',
    data_gov_in: 'Data.gov.in',
    datameet_github: 'DataMeet GitHub',
    kaggle: 'Kaggle',
    myneta: 'MyNeta (ADR)',
    csep: 'CSEP Academic',
    state_ec: 'State EC',
    news_media: 'News Media',
    other: 'Other'
  }
  return labels[type] || type
}

// Data source type colors
export function getDataSourceTypeColor(type: DataSourceType): string {
  const colors: Record<DataSourceType, string> = {
    manual: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    eci_website: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    data_gov_in: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    datameet_github: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    kaggle: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    myneta: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    csep: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    state_ec: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    news_media: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
  return colors[type] || colors.other
}

// Import status colors
export function getImportStatusColor(
  status: 'pending' | 'running' | 'completed' | 'failed'
): string {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    running: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
  return colors[status]
}

// Reliability score badge
export function getReliabilityBadge(score: number | null): {
  label: string
  color: string
} {
  if (score === null) return { label: 'Unknown', color: 'bg-gray-100 text-gray-600' }
  if (score >= 9) return { label: 'Official', color: 'bg-green-100 text-green-700' }
  if (score >= 7) return { label: 'Reliable', color: 'bg-blue-100 text-blue-700' }
  if (score >= 5) return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-700' }
  return { label: 'Unverified', color: 'bg-red-100 text-red-700' }
}

// Available data sources info (for documentation)
export const DATA_SOURCE_INFO = {
  eci: {
    name: 'Election Commission of India',
    website: 'https://eci.gov.in',
    hasApi: false,
    dataTypes: ['election schedules', 'results', 'candidate lists'],
    notes: 'No public API. Data must be manually entered or scraped.'
  },
  dataGovIn: {
    name: 'Data.gov.in',
    website: 'https://data.gov.in',
    hasApi: true,
    dataTypes: ['electoral statistics', 'voter data', 'historical results'],
    notes: 'Open Government Data Platform. API available with registration.'
  },
  datameet: {
    name: 'DataMeet India Elections',
    website: 'https://github.com/datameet/india-election-data',
    hasApi: false,
    dataTypes: ['historical results 1951-2019', 'constituency data'],
    notes: 'Open dataset under ODbL license. CSV format.'
  },
  myneta: {
    name: 'MyNeta (ADR)',
    website: 'https://myneta.info',
    hasApi: false,
    dataTypes: ['candidate affidavits', 'criminal records', 'assets'],
    notes: 'Association for Democratic Reforms. No scraping allowed.'
  },
  csep: {
    name: 'CSEP Election Dataset',
    website: 'https://csep.org',
    hasApi: false,
    dataTypes: ['comprehensive 1991-2023 data'],
    notes: 'Academic dataset. Requires access request.'
  }
}
