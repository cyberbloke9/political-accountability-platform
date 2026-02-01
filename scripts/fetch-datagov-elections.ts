/**
 * Script to fetch election data from Data.gov.in API
 *
 * Data.gov.in provides Open Government Data with API access.
 * API Documentation: https://data.gov.in/apis
 *
 * To use this script:
 * 1. Register at https://data.gov.in/user/register
 * 2. Get your API key from your dashboard
 * 3. Set the DATAGOV_API_KEY environment variable
 * 4. Run: npx ts-node scripts/fetch-datagov-elections.ts
 */

import { createClient } from '@supabase/supabase-js'

// Configuration
const DATAGOV_BASE_URL = 'https://api.data.gov.in/resource'
const API_KEY = process.env.DATAGOV_API_KEY

// Known resource IDs for electoral data
const ELECTORAL_RESOURCES = {
  // Voter Statistics
  voterStats: '9a0e5d49-0c1e-4ac4-8ed8-6abd0bd3c6c8',
  // Constituency-wise data
  constituencyData: '44aa0e73-5f6a-4f00-9cd2-0c2f26a4b58b',
  // Election results (various)
  results2019: 'ac858bf8-7e4e-4f6c-8888-dcc8b53f3c0a'
}

interface DataGovResponse<T> {
  status: string
  message: string
  total: number
  count: number
  limit: string
  offset: string
  records: T[]
}

interface VoterStatsRecord {
  state_name: string
  male_electors: string
  female_electors: string
  total_electors: string
  year: string
}

interface ConstituencyRecord {
  state: string
  constituency_name: string
  constituency_number: string
  reserved_category: string
  total_voters: string
}

// Fetch data from Data.gov.in API
async function fetchFromDataGov<T>(
  resourceId: string,
  params: Record<string, string> = {}
): Promise<DataGovResponse<T> | null> {
  if (!API_KEY) {
    console.error('DATAGOV_API_KEY environment variable not set')
    console.log('Get your API key from: https://data.gov.in/user/register')
    return null
  }

  const url = new URL(`${DATAGOV_BASE_URL}/${resourceId}`)
  url.searchParams.set('api-key', API_KEY)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1000')

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  try {
    console.log(`Fetching: ${url.toString().replace(API_KEY, '***')}`)
    const response = await fetch(url.toString())

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()
    return data as DataGovResponse<T>
  } catch (error) {
    console.error('Fetch error:', error)
    return null
  }
}

// Fetch voter statistics by state
async function fetchVoterStatsByState(): Promise<VoterStatsRecord[]> {
  const result = await fetchFromDataGov<VoterStatsRecord>(
    ELECTORAL_RESOURCES.voterStats
  )
  return result?.records || []
}

// Fetch constituency data
async function fetchConstituencyData(
  state?: string
): Promise<ConstituencyRecord[]> {
  const params: Record<string, string> = {}
  if (state) {
    params['filters[state]'] = state
  }

  const result = await fetchFromDataGov<ConstituencyRecord>(
    ELECTORAL_RESOURCES.constituencyData,
    params
  )
  return result?.records || []
}

// Main import function
async function importElectoralData() {
  console.log('=== Data.gov.in Electoral Data Import ===\n')

  // Check API key
  if (!API_KEY) {
    console.log('No API key found. To use this script:')
    console.log('1. Register at https://data.gov.in/user/register')
    console.log('2. Get your API key from dashboard')
    console.log('3. Set DATAGOV_API_KEY environment variable')
    console.log('\nExample:')
    console.log('  export DATAGOV_API_KEY=your_api_key_here')
    console.log('  npx ts-node scripts/fetch-datagov-elections.ts')
    return
  }

  // Test API connection
  console.log('Testing API connection...')
  const testData = await fetchVoterStatsByState()

  if (testData.length === 0) {
    console.log('No data returned. API key may be invalid or resource unavailable.')
    return
  }

  console.log(`Found ${testData.length} voter statistics records\n`)

  // Display sample data
  console.log('Sample Voter Statistics:')
  console.log('-'.repeat(60))
  testData.slice(0, 5).forEach((record) => {
    console.log(
      `${record.state_name}: ${parseInt(record.total_electors).toLocaleString()} voters (${record.year})`
    )
  })

  console.log('\n=== Import Complete ===')
  console.log('To import this data into your database:')
  console.log('1. Set SUPABASE_URL and SUPABASE_KEY environment variables')
  console.log('2. Uncomment the database import section below')
}

// Database import function (uncomment to use)
/*
async function importToDatabase(records: VoterStatsRecord[]) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  )

  // Start import tracking
  const { data: source } = await supabase
    .from('election_data_sources')
    .select('id')
    .eq('source_type', 'data_gov_in')
    .single()

  const { data: importRecord } = await supabase.rpc('start_data_import', {
    p_source_id: source?.id,
    p_import_type: 'voter_statistics',
    p_metadata: { source: 'data.gov.in', timestamp: new Date().toISOString() }
  })

  let created = 0
  let updated = 0
  let failed = 0

  for (const record of records) {
    try {
      // Upsert voter statistics
      const { error } = await supabase
        .from('voter_statistics')
        .upsert({
          state: record.state_name,
          year: parseInt(record.year),
          male_voters: parseInt(record.male_electors),
          female_voters: parseInt(record.female_electors),
          total_voters: parseInt(record.total_electors),
          source_id: source?.id
        })

      if (error) {
        failed++
      } else {
        created++
      }
    } catch (err) {
      failed++
    }
  }

  // Update import progress
  await supabase.rpc('update_import_progress', {
    p_import_id: importRecord,
    p_records_processed: records.length,
    p_records_created: created,
    p_records_updated: updated,
    p_records_failed: failed,
    p_status: 'completed'
  })

  console.log(`Import complete: ${created} created, ${updated} updated, ${failed} failed`)
}
*/

// Run the import
importElectoralData().catch(console.error)
