# PromiseCard Component

## File Location
`frontend/src/components/promises/PromiseCard.tsx`

## Component Purpose

The `PromiseCard` component displays a summary card for a political promise. It shows:

- Politician name
- Promise text (truncated)
- Promise status with color-coded badge
- Promise date
- View count and verification count
- Category badge (if available)
- Link to full promise details

## Props Interface

```typescript
interface PromiseCardProps {
  promise: {
    id: string
    politician_name: string
    promise_text: string
    promise_date: string
    category?: string
    status: 'pending' | 'in_progress' | 'fulfilled' | 'broken' | 'stalled'
    view_count?: number
    verification_count?: number
    created_at: string
  }
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `promise` | `object` | Yes | Promise data object |

### Promise Object Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | Yes | Unique promise identifier |
| `politician_name` | `string` | Yes | Name of the politician |
| `promise_text` | `string` | Yes | Full text of the promise |
| `promise_date` | `string` | Yes | Date the promise was made |
| `category` | `string` | No | Category/tag for the promise |
| `status` | `Status` | Yes | Current status of the promise |
| `view_count` | `number` | No | Number of views |
| `verification_count` | `number` | No | Number of verifications |
| `created_at` | `string` | Yes | Creation timestamp |

## State and Hooks Used

This is a stateless presentational component. No hooks are used.

## Status Configuration

```typescript
const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'bg-muted text-muted-foreground',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-warning text-warning-foreground',
  },
  fulfilled: {
    label: 'Fulfilled',
    className: 'bg-success text-success-foreground',
  },
  broken: {
    label: 'Broken',
    className: 'bg-destructive text-destructive-foreground',
  },
  stalled: {
    label: 'Stalled',
    className: 'bg-muted text-muted-foreground',
  },
}
```

## Rendered Elements

### Card Structure
```
Card
├── CardHeader
│   ├── Title Section (flex)
│   │   ├── CardTitle (politician_name)
│   │   └── CardDescription (promise_text)
│   └── Status Badge
├── CardContent
│   ├── Meta Info (date, views, verifications)
│   └── Category Badge (if present)
└── CardFooter
    └── View Details Button (Link)
```

## Dependencies

### Internal Components
- `@/components/ui/card`: Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
- `@/components/ui/badge`: Badge
- `@/components/ui/button`: Button

### External Libraries
- `lucide-react`: Calendar, Eye, FileText, ExternalLink icons
- `next/link`: Link for navigation

## Usage Examples

### Basic Usage
```tsx
import { PromiseCard } from '@/components/promises/PromiseCard'

const promise = {
  id: '123',
  politician_name: 'John Smith',
  promise_text: 'I promise to improve healthcare for all citizens...',
  promise_date: '2024-01-15',
  status: 'in_progress',
  view_count: 150,
  verification_count: 3,
  created_at: '2024-01-15T10:00:00Z'
}

<PromiseCard promise={promise} />
```

### In a Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {promises.map((promise) => (
    <PromiseCard key={promise.id} promise={promise} />
  ))}
</div>
```

### With Category
```tsx
const promise = {
  id: '456',
  politician_name: 'Jane Doe',
  promise_text: 'Investment in renewable energy infrastructure...',
  promise_date: '2024-02-20',
  category: 'Environment',
  status: 'fulfilled',
  view_count: 250,
  verification_count: 8,
  created_at: '2024-02-20T14:30:00Z'
}

<PromiseCard promise={promise} />
```

### Minimal Promise (Without Optional Fields)
```tsx
const promise = {
  id: '789',
  politician_name: 'Alex Johnson',
  promise_text: 'Reduce unemployment by 5%',
  promise_date: '2024-03-10',
  status: 'pending',
  created_at: '2024-03-10T09:00:00Z'
}

<PromiseCard promise={promise} />
```

## Styling Notes

- Card has hover shadow effect (`hover:shadow-md transition-shadow`)
- Title and description use `line-clamp-2` for text truncation
- Status badge is positioned in the top-right of header
- Meta information displayed in flex-wrap layout
- Date formatted using `toLocaleDateString` with 'en-US' locale
- Icons are 16x16 pixels (h-4 w-4)
- View Details button spans full width with outline variant
- Category badge (if present) uses outline variant

## Date Formatting

```typescript
new Date(promise.promise_date).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})
// Output: "Jan 15, 2024"
```

## Navigation

Clicking "View Details" navigates to `/promises/{promise.id}` using Next.js Link component.
