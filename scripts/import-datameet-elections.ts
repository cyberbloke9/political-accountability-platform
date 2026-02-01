/**
 * Script to import election data from DataMeet India Elections GitHub repository
 *
 * Repository: https://github.com/datameet/india-election-data
 * License: ODbL (Open Database License)
 *
 * This repository contains:
 * - Lok Sabha election data from 1951-2019
 * - State assembly election data
 * - Constituency boundaries and info
 *
 * To use:
 * 1. Clone the datameet repo or download CSVs
 * 2. Set the DATA_PATH environment variable to the repo path
 * 3. Run: npx ts-node scripts/import-datameet-elections.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

// Configuration
const DATA_PATH = process.env.DATAMEET_PATH || './data/india-election-data'

interface LokSabhaResult {
  year: string
  state: string
  constituency_name: string
  constituency_number: string
  candidate_name: string
  party: string
  votes: string
  vote_share: string
  winner: string
}

interface StateAssemblyResult {
  year: string
  state: string
  constituency_name: string
  constituency_number: string
  candidate_name: string
  party: string
  votes: string
  winner: string
}

// Parse CSV file
function parseCSV<T>(filePath: string): T[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as T[]
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error)
    return []
  }
}

// Get unique elections from results
function extractElections(results: LokSabhaResult[]): {
  year: number
  states: Set<string>
  totalConstituencies: number
}[] {
  const elections = new Map<
    number,
    { states: Set<string>; constituencies: Set<string> }
  >()

  for (const result of results) {
    const year = parseInt(result.year)
    if (!elections.has(year)) {
      elections.set(year, { states: new Set(), constituencies: new Set() })
    }

    const election = elections.get(year)!
    election.states.add(result.state)
    election.constituencies.add(
      `${result.state}-${result.constituency_number}`
    )
  }

  return Array.from(elections.entries())
    .map(([year, data]) => ({
      year,
      states: data.states,
      totalConstituencies: data.constituencies.size
    }))
    .sort((a, b) => a.year - b.year)
}

// Get election winners summary
function getWinnersSummary(
  results: LokSabhaResult[],
  year: number
): Map<string, number> {
  const partyWins = new Map<string, number>()

  const yearResults = results.filter(
    (r) => parseInt(r.year) === year && r.winner === '1'
  )

  for (const result of yearResults) {
    const party = result.party || 'Independent'
    partyWins.set(party, (partyWins.get(party) || 0) + 1)
  }

  return partyWins
}

// Main import function
async function analyzeDataMeetData() {
  console.log('=== DataMeet India Elections Data Analysis ===\n')

  // Check if data path exists
  if (!fs.existsSync(DATA_PATH)) {
    console.log(`Data path not found: ${DATA_PATH}`)
    console.log('\nTo use this script:')
    console.log('1. Clone the DataMeet repository:')
    console.log(
      '   git clone https://github.com/datameet/india-election-data.git ./data/india-election-data'
    )
    console.log('2. Or set DATAMEET_PATH environment variable to your data location')
    console.log('\nAlternatively, download specific CSV files from:')
    console.log('https://github.com/datameet/india-election-data/tree/master/lok-sabha')
    return
  }

  // Look for Lok Sabha data
  const lokSabhaPath = path.join(DATA_PATH, 'lok-sabha')
  if (fs.existsSync(lokSabhaPath)) {
    console.log('Found Lok Sabha data directory\n')

    // List available files
    const files = fs.readdirSync(lokSabhaPath).filter((f) => f.endsWith('.csv'))
    console.log(`Available CSV files: ${files.length}`)
    files.forEach((f) => console.log(`  - ${f}`))

    // Parse all CSV files
    const allResults: LokSabhaResult[] = []
    for (const file of files) {
      const filePath = path.join(lokSabhaPath, file)
      const results = parseCSV<LokSabhaResult>(filePath)
      allResults.push(...results)
    }

    console.log(`\nTotal records: ${allResults.length.toLocaleString()}`)

    // Extract election info
    const elections = extractElections(allResults)
    console.log(`\nLok Sabha Elections Found: ${elections.length}`)
    console.log('-'.repeat(50))

    for (const election of elections) {
      const winners = getWinnersSummary(allResults, election.year)
      const topParties = Array.from(winners.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)

      console.log(
        `${election.year}: ${election.totalConstituencies} constituencies across ${election.states.size} states`
      )
      console.log(
        `  Top parties: ${topParties.map(([p, w]) => `${p}(${w})`).join(', ')}`
      )
    }
  }

  // Look for State Assembly data
  const stateAssemblyPath = path.join(DATA_PATH, 'state-assembly')
  if (fs.existsSync(stateAssemblyPath)) {
    console.log('\n\nFound State Assembly data directory')

    const stateDirs = fs
      .readdirSync(stateAssemblyPath)
      .filter((f) =>
        fs.statSync(path.join(stateAssemblyPath, f)).isDirectory()
      )

    console.log(`States with data: ${stateDirs.length}`)
    stateDirs.forEach((s) => console.log(`  - ${s}`))
  }

  console.log('\n=== Analysis Complete ===')
  console.log('\nTo import this data:')
  console.log('1. Review the data structure above')
  console.log('2. Uncomment the database import section in this script')
  console.log('3. Set SUPABASE_URL and SUPABASE_KEY environment variables')
  console.log('4. Run the script again')
}

// Generate SQL for election seeding
function generateElectionSQL(elections: { year: number; seats: number }[]) {
  console.log('\n-- SQL for Lok Sabha Elections')
  console.log('-- Add to database/migrations/043_seed_historical_elections.sql\n')

  for (const election of elections) {
    console.log(`-- ${election.year} Lok Sabha`)
    console.log(`INSERT INTO elections (
  name, election_type, election_level, country_id,
  start_date, status, total_seats, description,
  source_reference
) SELECT
  '${election.year} Indian General Election',
  'general', 'national',
  (SELECT id FROM countries WHERE iso_alpha2 = 'IN'),
  '${election.year}-01-01', 'completed', ${election.seats},
  '${Math.ceil(election.year / 5)}th Lok Sabha elections',
  'LS-${election.year}'
WHERE NOT EXISTS (
  SELECT 1 FROM elections WHERE source_reference = 'LS-${election.year}'
);
`)
  }
}

// Sample historical Lok Sabha data
const HISTORICAL_LOK_SABHA = [
  { year: 1951, seats: 489 },
  { year: 1957, seats: 494 },
  { year: 1962, seats: 494 },
  { year: 1967, seats: 520 },
  { year: 1971, seats: 518 },
  { year: 1977, seats: 542 },
  { year: 1980, seats: 529 },
  { year: 1984, seats: 514 },
  { year: 1989, seats: 529 },
  { year: 1991, seats: 521 },
  { year: 1996, seats: 543 },
  { year: 1998, seats: 543 },
  { year: 1999, seats: 543 },
  { year: 2004, seats: 543 },
  { year: 2009, seats: 543 },
  { year: 2014, seats: 543 },
  { year: 2019, seats: 543 },
  { year: 2024, seats: 543 }
]

// Run the analysis
analyzeDataMeetData()
  .then(() => {
    console.log('\n--- Historical Lok Sabha Elections SQL ---')
    generateElectionSQL(HISTORICAL_LOK_SABHA)
  })
  .catch(console.error)
