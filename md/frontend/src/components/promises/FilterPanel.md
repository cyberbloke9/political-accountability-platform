# FilterPanel Component

## File Location
`frontend/src/components/promises/FilterPanel.tsx`

## Component Purpose

The `FilterPanel` component provides a comprehensive filtering interface for promises. It allows users to filter promises by:

- Status (pending, in_progress, fulfilled, broken, stalled)
- Political party
- Categories/tags

The filters are displayed in a slide-out Sheet component triggered by a button.

## Props Interface

```typescript
export interface FilterState {
  status: string[]
  party: string[]
  tags: string[]
  dateFrom?: string
  dateTo?: string
}

interface FilterPanelProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `filters` | `FilterState` | Yes | Current filter state |
| `onChange` | `(filters: FilterState) => void` | Yes | Callback when filters change |

### FilterState

| Field | Type | Description |
|-------|------|-------------|
| `status` | `string[]` | Selected status values |
| `party` | `string[]` | Selected party names |
| `tags` | `string[]` | Selected tag slugs |
| `dateFrom` | `string?` | Start date (not yet implemented) |
| `dateTo` | `string?` | End date (not yet implemented) |

## State and Hooks Used

### Local State

| State Variable | Type | Initial Value | Purpose |
|---------------|------|---------------|---------|
| `parties` | `string[]` | `[]` | Available political parties |
| `tags` | `any[]` | `[]` | Available category tags |
| `isOpen` | `boolean` | `false` | Sheet open state |

### Hooks

| Hook | Source | Purpose |
|------|--------|---------|
| `useState` | React | Manages local component state |
| `useEffect` | React | Loads filter options on mount |

### Side Effects

```typescript
useEffect(() => {
  const loadFilterOptions = async () => {
    const [partiesData, tagsData] = await Promise.all([
      getAllParties(),
      getAllTags()
    ])
    setParties(partiesData)
    setTags(tagsData)
  }
  loadFilterOptions()
}, [])
```

## Rendered Elements

### Trigger Button
- Shows filter icon with "Filters" text
- Badge displays active filter count

### Sheet Content
1. **Header**
   - Title: "Filters"
   - Clear all button (when filters active)

2. **Status Filter Section**
   - Checkboxes for each status
   - Color-coded indicators

3. **Party Filter Section** (if parties available)
   - Scrollable checkbox list
   - Shows party names

4. **Tags/Categories Section** (if tags available)
   - Badge-style clickable tags
   - Color-coded when selected

5. **Apply Button**
   - Closes sheet and applies current selections

## Dependencies

### Internal Components
- `@/components/ui/button`: Button component
- `@/components/ui/badge`: Badge component
- `@/components/ui/sheet`: Sheet components
- `@/components/ui/checkbox`: Checkbox component
- `@/components/ui/label`: Label component

### External Libraries
- `lucide-react`: Filter, X icons

### Services
- `@/lib/searchPromises`: getAllParties, getAllTags functions

## Usage Examples

### Basic Usage
```tsx
import { FilterPanel, FilterState } from '@/components/promises/FilterPanel'

const [filters, setFilters] = useState<FilterState>({
  status: [],
  party: [],
  tags: []
})

<FilterPanel
  filters={filters}
  onChange={setFilters}
/>
```

### With Initial Filters
```tsx
const [filters, setFilters] = useState<FilterState>({
  status: ['pending', 'in_progress'],
  party: [],
  tags: ['economy']
})

<FilterPanel filters={filters} onChange={setFilters} />
```

### In Promise List Page
```tsx
function PromiseListPage() {
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    party: [],
    tags: []
  })
  const [promises, setPromises] = useState([])

  useEffect(() => {
    // Fetch promises based on filters
    fetchPromises(filters).then(setPromises)
  }, [filters])

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1>Promises</h1>
        <FilterPanel filters={filters} onChange={setFilters} />
      </div>
      <div className="grid gap-4">
        {promises.map(promise => (
          <PromiseCard key={promise.id} promise={promise} />
        ))}
      </div>
    </div>
  )
}
```

## Filter Configuration

### Status Options
```typescript
const statuses = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'fulfilled', label: 'Fulfilled', color: 'bg-green-500' },
  { value: 'broken', label: 'Broken', color: 'bg-red-500' },
  { value: 'stalled', label: 'Stalled', color: 'bg-yellow-500' }
]
```

## Internal Functions

### Toggle Functions
```typescript
const toggleStatus = (status: string) => { ... }  // Toggle status selection
const toggleParty = (party: string) => { ... }    // Toggle party selection
const toggleTag = (tagSlug: string) => { ... }    // Toggle tag selection
const clearAllFilters = () => { ... }             // Reset all filters
```

### Active Filter Count
```typescript
const activeFilterCount =
  filters.status.length +
  filters.party.length +
  filters.tags.length
```

## Styling Notes

- Sheet width: 400px (mobile) / 540px (desktop)
- Scrollable party list with max height
- Tags displayed as flex-wrapped badges
- Color-coded status indicators
- Active filter count in trigger button badge
- Responsive layout in sheet content

## Future Enhancements

Date range filtering is prepared but commented out in the code for future implementation.
