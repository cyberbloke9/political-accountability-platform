# Promises List Page (promises/page.tsx)

## Overview

**File Path:** `frontend/src/app/promises/page.tsx`
**URL:** `/promises`
**Type:** Client Component (`'use client'`)

## Purpose

The Promises List Page displays a searchable, filterable, and paginated list of political promises. Users can browse, search, and filter promises by status, party, and tags.

## Data Fetching

### Primary Data Source
- Uses `searchPromises()` function from `@/lib/searchPromises`
- Fetches promises with pagination (12 per page)
- Supports real-time search with debounced queries (300ms delay)

### Query Parameters
```typescript
const searchFilters = {
  query: debouncedQuery,
  ...filters,
  status: statusFilter === 'all' ? filters.status : [statusFilter],
  sortBy,
  page: currentPage,
  pageSize: 12
}
```

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### Custom Components
- `PromiseCard` - Individual promise display card
- `FilterPanel` - Advanced filtering panel

### UI Components
- `Input` - Search input
- `Button` - Action buttons
- `Tabs`, `TabsList`, `TabsTrigger` - Status filter tabs
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` - Sort dropdown

### Icons (Lucide React)
- `Search` - Search icon
- `Plus` - Add promise icon
- `X` - Clear search icon
- `ChevronLeft`, `ChevronRight` - Pagination arrows

## State Management

```typescript
const [promises, setPromises] = useState<Promise[]>([])
const [loading, setLoading] = useState(true)
const [searchQuery, setSearchQuery] = useState('')
const [debouncedQuery, setDebouncedQuery] = useState('')
const [statusFilter, setStatusFilter] = useState<string>('all')
const [filters, setFilters] = useState<FilterState>({ status: [], party: [], tags: [] })
const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
const [currentPage, setCurrentPage] = useState(1)
const [totalResults, setTotalResults] = useState(0)
const [totalPages, setTotalPages] = useState(1)
```

## Promise Interface

```typescript
interface Promise {
  id: string
  politician_name: string
  promise_text: string
  promise_date: string
  party?: string
  category?: string
  status: 'pending' | 'in_progress' | 'fulfilled' | 'broken' | 'stalled'
  view_count?: number
  verification_count?: number
  created_at: string
  tags?: any[]
}
```

## User Interactions

1. **Search Input** - Full-text search with debouncing
2. **Clear Search Button** - Clears search query
3. **Sort Dropdown** - "Newest First" or "Oldest First"
4. **Filter Panel** - Advanced filters for party, status, tags
5. **Status Tabs** - Filter by All, Pending, In Progress, Fulfilled, Broken
6. **Pagination Controls** - Navigate between pages
7. **Submit Promise Button** - Navigate to `/promises/new`
8. **Promise Cards** - Click to view promise details

## Status Tabs

| Tab | Filter Value |
|-----|--------------|
| All | `all` |
| Pending | `pending` |
| In Progress | `in_progress` |
| Fulfilled | `fulfilled` |
| Broken | `broken` |

## Loading States

- **Initial Load**: Shows 6 skeleton cards with pulse animation
- **Search/Filter**: Same skeleton loading pattern
- **Empty State**: Shows search icon with "No promises found" message

## Authentication Requirements

- **Required:** No
- Public page accessible to all visitors
- "Submit Promise" button visible to all (redirects to login if not authenticated)

## Pagination

- 12 promises per page
- Shows page numbers (up to 5 visible)
- Previous/Next buttons
- Ellipsis for many pages

## Styling

- Responsive grid: 1 column mobile, 2 columns medium, 3 columns large
- Mobile-optimized search and filters
- Skeleton loading with `animate-pulse`

## Navigation Links

| Element | Destination |
|---------|-------------|
| Submit Promise | `/promises/new` |
| Promise Card | `/promises/[id]` |
