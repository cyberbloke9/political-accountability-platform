# lib/politicians.ts

## Overview
API functions for managing politician profiles and statistics. Used by the `/politicians` listing page and `/politicians/[slug]` profile pages.

## Interfaces

### `Politician`
Full politician profile data.

```typescript
interface Politician {
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
```

### `PoliticianStats`
Aggregated promise statistics.

```typescript
interface PoliticianStats {
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
```

### `PoliticianWithStats`
Politician with embedded stats object.

## API Functions

### `getPoliticians(options?)`
Get all politicians with optional filtering.

**Parameters:**
| Option | Type | Description |
|--------|------|-------------|
| party | string | Filter by party |
| state | string | Filter by state |
| position | string | Filter by position |
| search | string | Search name/party |
| limit | number | Max results |
| offset | number | Pagination offset |

**Returns:** `{ data: Politician[], count: number, error: Error }`

### `getPoliticianBySlug(slug: string)`
Get single politician by URL slug.

**Returns:** `Politician | null`

### `getPoliticianById(id: string)`
Get single politician by UUID.

**Returns:** `Politician | null`

### `getPoliticianStats(politicianName: string)`
Get stats from `politician_stats` view.

**Returns:** `PoliticianStats | null`

### `getAllPoliticianStats(options?)`
Get stats for all politicians.

**Parameters:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| orderBy | string | 'total_promises' | Sort column |
| ascending | boolean | false | Sort direction |
| limit | number | - | Max results |

**Returns:** `PoliticianStats[]`

### `getPoliticianPromises(politicianName, options?)`
Get promises for a specific politician.

**Parameters:**
| Option | Type | Description |
|--------|------|-------------|
| status | string | Filter by status |
| limit | number | Max results |
| offset | number | Pagination |

**Returns:** `{ data: Promise[], count: number }`

### `updatePolitician(id, updates)`
Update politician profile (admin only).

**Parameters:**
- `id` - Politician UUID
- `updates` - Partial politician fields

**Returns:** `{ success: boolean, error: Error }`

### `getUniqueParties()`
Get distinct party names for filter dropdown.

**Returns:** `string[]`

### `getUniqueStates()`
Get distinct states for filter dropdown.

**Returns:** `string[]`

## Helper Functions

### `getPartyColor(party: string | null)`
Returns Tailwind CSS classes for party-colored badges.

| Party | Color |
|-------|-------|
| BJP | Orange |
| Congress/INC | Blue |
| AAP | Cyan |
| TMC | Green |
| DMK | Red |
| JDU | Yellow |
| Shiv Sena | Amber |
| TDP | Yellow |
| LDF/Communist | Red |
| Other | Purple |
| None | Gray |

**Returns:** `string` (e.g., `'bg-orange-100 text-orange-800'`)

### `formatPosition(position: string | null)`
Expands position abbreviations.

| Input | Output |
|-------|--------|
| pm | Prime Minister |
| cm | Chief Minister |
| mp | Member of Parliament |
| mla | Member of Legislative Assembly |
| fm | Finance Minister |
| hm | Home Minister |
| null | Politician |
| Other | Unchanged |

## Usage Examples

```typescript
// List politicians with filter
const { data, count } = await getPoliticians({
  party: 'BJP',
  limit: 20,
  offset: 0
})

// Get profile page data
const politician = await getPoliticianBySlug('narendra-modi')
const stats = await getPoliticianStats(politician.name)
const { data: promises } = await getPoliticianPromises(politician.name, {
  limit: 10
})

// Get party color for badge
const colorClass = getPartyColor('BJP')
// Returns: 'bg-orange-100 text-orange-800'

// Format position
const formatted = formatPosition('pm')
// Returns: 'Prime Minister'

// Get filter options
const parties = await getUniqueParties()
const states = await getUniqueStates()

// Admin update
await updatePolitician(id, {
  bio: 'Updated biography...',
  twitter_handle: '@newhandle'
})
```

## Error Handling

All functions:
- Log errors to console
- Return null/empty array on failure
- Don't throw exceptions

## Dependencies

- `@/lib/supabase` - Supabase client
