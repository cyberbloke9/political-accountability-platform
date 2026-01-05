# Politicians List Page (politicians/page.tsx)

## Overview

**File Path:** `frontend/src/app/politicians/page.tsx`
**URL:** `/politicians`
**Type:** Client Component (`'use client'`)

## Purpose

The Politicians List Page displays a searchable, filterable grid of political leaders with their promise fulfillment statistics. Users can browse politicians, filter by party, and sort by various metrics.

## Data Fetching

### Politician Stats
- Uses `getAllPoliticianStats()` from `@/lib/politicians`
- Returns aggregated statistics per politician
- Supports sorting options

### Parties List
- Uses `getUniqueParties()` from `@/lib/politicians`
- Populates party filter dropdown

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Badge` - Party and position badges
- `Button` - Action buttons
- `Input` - Search input
- `Label` - Form labels
- `Progress` - Fulfillment rate bar
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`

### Icons (Lucide React)
- `Users` - Page header icon
- `Search` - Search icon
- `User` - Default avatar
- `CheckCircle` - Fulfilled count
- `XCircle` - Broken count
- `Clock` - In progress count
- `TrendingUp` - View profile indicator
- `RefreshCw` - Loading spinner
- `ArrowUpDown` - Sort toggle
- `Filter` - Filter section icon

## State Management

```typescript
const [politicians, setPoliticians] = useState<PoliticianStats[]>([])
const [parties, setParties] = useState<string[]>([])
const [loading, setLoading] = useState(true)
const [searchTerm, setSearchTerm] = useState('')
const [partyFilter, setPartyFilter] = useState('')
const [sortBy, setSortBy] = useState<'total_promises' | 'fulfillment_rate' | 'politician_name'>('total_promises')
const [sortAsc, setSortAsc] = useState(false)
```

## PoliticianStats Interface

```typescript
interface PoliticianStats {
  politician_name: string
  party?: string
  position?: string
  image_url?: string
  slug?: string
  total_promises: number
  fulfilled_count: number
  broken_count: number
  in_progress_count: number
  fulfillment_rate: number | null
}
```

## User Interactions

1. **Search Input** - Filter by name or party
2. **Party Dropdown** - Filter by political party
3. **Sort By Dropdown** - Sort by Total Promises, Fulfillment Rate, or Name
4. **Sort Direction Toggle** - Ascending or Descending
5. **Clear Filters Button** - Reset all filters
6. **Politician Card Click** - Navigate to politician profile

## Stats Overview Cards

| Card | Icon Color | Shows |
|------|------------|-------|
| Total Leaders | - | Count of politicians |
| Promises Fulfilled | Green | Sum of all fulfilled |
| In Progress | Blue | Sum of all in progress |
| Promises Broken | Red | Sum of all broken |

## Filter Options

### Sort By
- Total Promises (default)
- Fulfillment Rate
- Name

### Party Filter
- All Parties
- Dynamic list from database

## Politician Cards

Each card displays:
- Avatar (image or placeholder)
- Politician name
- Party badge (with color coding)
- Position badge
- Total promises count
- Fulfillment rate with progress bar
- Quick stats: Fulfilled, In Progress, Broken counts

## Loading States

- Centered spinner while loading
- "No leaders found" message for empty results

## Authentication Requirements

- **Required:** No
- Public page accessible to all visitors

## Party Color Coding

Uses `getPartyColor()` function from `@/lib/politicians` to return appropriate color classes for different parties.

## Navigation Links

| Element | Destination |
|---------|-------------|
| Politician Card | `/politicians/[slug]` |

## Slug Generation

If no slug exists, generates from politician name:
```typescript
politician.slug || encodeURIComponent(politician.politician_name.toLowerCase().replace(/\s+/g, '-'))
```
