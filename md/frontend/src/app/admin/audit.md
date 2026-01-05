# Admin Audit Log Page (admin/audit/page.tsx)

## Overview

**File Path:** `frontend/src/app/admin/audit/page.tsx`
**URL:** `/admin/audit`
**Type:** Client Component (`'use client'`)

## Purpose

The Admin Audit Log Page provides a comprehensive audit trail of all administrative actions on the platform. It supports advanced filtering, date ranges, and export functionality for compliance and transparency.

## Data Fetching

### Admin Actions
- Uses `getAdminActions()` from `@/lib/adminActions`
- Supports filtering by action type, target type, search, date range
- Paginated with 50 actions per page

### Stats
- Uses `getAdminActionStats()` for summary statistics
- Includes today's activity and action breakdown

## Components Used

### Layout Components
- `AdminGuard` - Minimum level: 1 (admin)
- `AdminLayout` - Admin page wrapper

### UI Components
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Badge` - Action type badges
- `Input` - Search and date inputs
- `Label` - Form labels
- `Button` - Action buttons
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`

### Icons (Lucide React)
- `Shield` - Top admins section
- `CheckCircle` - Approved actions
- `XCircle` - Rejected actions
- `AlertTriangle` - Fraud flags
- `Download` - Export buttons
- `RefreshCw` - Refresh/loading
- `Calendar` - Timestamps
- `User` - Admin username
- `FileText` - Actions timeline
- `TrendingUp` - Activity stats
- `Search` - Filters section

## State Management

```typescript
const [actions, setActions] = useState<AdminAction[]>([])
const [stats, setStats] = useState({...})
const [loading, setLoading] = useState(true)
const [totalCount, setTotalCount] = useState(0)
const [currentPage, setCurrentPage] = useState(1)
const [filters, setFilters] = useState({
  action_type: '',
  target_type: '',
  search: '',
  start_date: '',
  end_date: ''
})
```

## Stats Cards (5 columns)

| Stat | Icon | Color |
|------|------|-------|
| Total Actions | FileText | gray |
| Actions Today | TrendingUp | blue |
| Approved Today | CheckCircle | green |
| Rejected Today | XCircle | red |
| Fraud Flags Today | AlertTriangle | orange |

## Advanced Filter Options

### Action Type Filter
- Approve Verification
- Reject Verification
- Flag Fraud
- Update Reputation
- Ban User
- Unban User
- Auto-Approve

### Target Type Filter
- Verification
- User
- Politician

### Search
- Searches in reason and action text

### Date Range
- Start Date (date input)
- End Date (date input)

## Export Functionality

### CSV Export
```typescript
const exportToCSV = () => {
  const headers = ['Timestamp', 'Action Type', 'Admin', 'Target Type', 'Target ID', 'Reason', 'Metadata']
  const rows = actions.map(action => [...])
  // Download as CSV file
}
```

### JSON Export
```typescript
const exportToJSON = () => {
  const jsonContent = JSON.stringify(actions, null, 2)
  // Download as JSON file
}
```

## User Interactions

1. **Refresh Button** - Reload audit data
2. **Export CSV Button** - Download as CSV
3. **Export JSON Button** - Download as JSON
4. **Action Type Filter** - Filter by action type
5. **Target Type Filter** - Filter by target type
6. **Search Input** - Text search
7. **Date Range Inputs** - Filter by date
8. **Clear Filters Button** - Reset all filters
9. **Pagination** - Navigate pages
10. **View Metadata** - Expand action metadata
11. **Target Links** - Navigate to target

## Action Timeline Entry

Each entry displays:
- Action type badge (color-coded)
- Admin username
- Timestamp
- Reason (if provided)
- Target type and ID
- Link to view target
- Expandable metadata section

## Additional Sections

### Action Type Breakdown
- Sorted by count (descending)
- Shows action type badge and count

### Most Active Moderators
- Top admins by action count
- Ranked list with action counts

## Authentication Requirements

- **Required:** Yes (Admin)
- Minimum Level: 1
- Uses `AdminGuard` with `minLevel={1}`

## Pagination

- 50 actions per page
- Previous/Next buttons
- Current page indicator

## Loading States

- Centered spinner during data fetch
- Disabled state on buttons during load

## Styling

- Responsive grid layouts
- Collapsible metadata sections
- Color-coded action badges
