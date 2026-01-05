# Politician Profile Page (politicians/[slug]/page.tsx)

## Overview

**File Path:** `frontend/src/app/politicians/[slug]/page.tsx`
**URL:** `/politicians/[slug]`
**Type:** Client Component (`'use client'`)

## Purpose

The Politician Profile Page displays detailed information about a specific political leader, including their bio, social links, and a comprehensive list of their promises organized by status.

## Data Fetching

### Politician Data
- Uses `getPoliticianBySlug(slug)` from `@/lib/politicians`
- Returns politician profile information

### Promises Data
- Uses `getPoliticianPromises(politicianName)` from `@/lib/politicians`
- Fetches all promises associated with the politician
- Includes verification counts

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Badge` - Party, position, status badges
- `Button` - Action buttons
- `Progress` - Fulfillment rate bar
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` - Promise status tabs

### Icons (Lucide React)
- `User` - Avatar placeholder
- `MapPin` - State/location
- `Building2` - Position
- `Calendar` - Promise date
- `ExternalLink` - External links
- `Twitter` - Twitter handle
- `Globe` - Official website
- `BookOpen` - Wikipedia
- `CheckCircle` - Fulfilled status
- `XCircle` - Broken status
- `Clock` - In progress status
- `AlertTriangle` - Pending status
- `PauseCircle` - Stalled status
- `TrendingUp` - Verification count
- `ArrowLeft` - Back button
- `Loader2` - Loading spinner
- `FileText` - Promises section header

## Interfaces

```typescript
interface Politician {
  name: string
  party?: string
  position?: string
  state?: string
  bio?: string
  image_url?: string
  twitter_handle?: string
  wikipedia_url?: string
  official_website?: string
}

interface Promise {
  id: string
  politician_name: string
  promise_text: string
  promise_date: string
  status: string
  source_url: string
  tags: string[]
  verifications: Array<{
    id: string
    verdict: string
    status: string
  }>
}

interface Stats {
  total: number
  fulfilled: number
  broken: number
  in_progress: number
  pending: number
  stalled: number
  fulfillment_rate: number | null
}
```

## State Management

```typescript
const [politician, setPolitician] = useState<Politician | null>(null)
const [promises, setPromises] = useState<Promise[]>([])
const [stats, setStats] = useState<Stats>({...})
const [loading, setLoading] = useState(true)
const [activeTab, setActiveTab] = useState('all')
const [promiseCount, setPromiseCount] = useState(0)
```

## Page Sections

### 1. Profile Header Card
- Avatar (image or placeholder)
- Politician name
- Party badge (color-coded)
- Position badge
- State/location badge
- Bio text
- Social/external links

### 2. Stats Summary Card
- Total promises count
- Fulfillment rate with progress bar
- Breakdown: Fulfilled, Broken, In Progress, Pending

### 3. Promises Section with Tabs
Tabs for filtering promises:
- All
- Fulfilled
- In Progress
- Pending
- Broken
- Stalled

## Status Icon/Badge Mapping

| Status | Icon | Color |
|--------|------|-------|
| fulfilled | CheckCircle | green-600 |
| broken | XCircle | red-600 |
| in_progress | Clock | blue-600 |
| pending | AlertTriangle | yellow-600 |
| stalled | PauseCircle | orange-600 |

## User Interactions

1. **Back Link** - Navigate to `/politicians`
2. **Twitter Link** - Opens Twitter profile
3. **Wikipedia Link** - Opens Wikipedia page
4. **Official Website Link** - Opens official website
5. **Status Tabs** - Filter promises by status
6. **Promise Card Click** - Navigate to `/promises/[id]`

## Social Links

Each link opens in new tab with `rel="noopener noreferrer"`:
- Twitter: `https://twitter.com/{handle}`
- Wikipedia: Direct URL from database
- Official Website: Direct URL from database

## Loading States

- Centered spinner while loading politician data
- "Politician Not Found" card if no data returned

## Error States

- 404-style card with back button if politician not found
- Console error logging for data fetch failures

## Authentication Requirements

- **Required:** No
- Public page accessible to all visitors

## Promise Card Content

Each promise displays:
- Status icon and badge
- Promise date
- Promise text (2-line clamp)
- Tags (max 4, with +N indicator)
- Verification count

## Navigation Links

| Element | Destination |
|---------|-------------|
| Back to Politicians | `/politicians` |
| Promise Card | `/promises/[id]` |
| View All Politicians (404) | `/politicians` |
