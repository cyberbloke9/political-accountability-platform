# Transparency Page (transparency/page.tsx)

## Overview

**File Path:** `frontend/src/app/transparency/page.tsx`
**URL:** `/transparency`
**Type:** Client Component (`'use client'`)

## Purpose

The Transparency Page provides a public audit trail of all administrative and moderation actions on the platform. It demonstrates the platform's commitment to openness by making all admin activities visible.

## Data Fetching

### Admin Actions
- Uses `getAdminActions()` from `@/lib/adminActions`
- Supports filtering and pagination
- Parameters: action_type, target_type, search, limit, offset

### Stats
- Uses `getAdminActionStats()` from `@/lib/adminActions`
- Returns today's activity counts

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Badge` - Action type badges, count badges
- `Input` - Search input
- `Label` - Form labels
- `Button` - Filter/pagination buttons
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`

### Icons (Lucide React)
- `Shield` - Page header / moderators
- `CheckCircle` - Approved actions
- `XCircle` - Rejected actions
- `AlertTriangle` - Fraud flags
- `Eye` - Filter section
- `RefreshCw` - Refresh/loading
- `Calendar` - Action timestamp
- `User` - Admin username
- `FileText` - Actions timeline
- `TrendingUp` - Actions today

## Admin Action Interface

```typescript
interface AdminAction {
  id: string
  action_type: string
  target_type: string
  target_id: string
  reason?: string
  metadata?: object
  created_at: string
  admin?: { username: string }
}
```

## Stats Interface

```typescript
interface Stats {
  totalActions: number
  todayActions: number
  approvedToday: number
  rejectedToday: number
  fraudFlagsToday: number
  topAdmins: Array<{ admin_id: string; username: string; action_count: number }>
  actionsByType: Record<string, number>
}
```

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
  search: ''
})
```

## Filter Options

### Action Types
- Approve Verification
- Reject Verification
- Flag Fraud
- Update Reputation
- Ban User
- Unban User
- Auto-Approve

### Target Types
- Verification
- User
- Politician

## Page Sections

### 1. Stats Dashboard (4 cards)
- Actions Today (TrendingUp, blue)
- Approved Today (CheckCircle, green)
- Rejected Today (XCircle, red)
- Fraud Flags Today (AlertTriangle, orange)

### 2. Filter Section
- Action Type dropdown
- Target Type dropdown
- Search input
- Clear and Refresh buttons

### 3. Actions Timeline
- List of admin actions with badges
- Admin username
- Timestamp
- Reason (if provided)
- Target link (verification or user profile)
- Expandable metadata

### 4. Most Active Moderators
- Ranked list of top admins
- Action count per admin

## User Interactions

1. **Action Type Filter** - Filter by action type
2. **Target Type Filter** - Filter by target type
3. **Search Input** - Search in reasons
4. **Clear Button** - Reset all filters
5. **Refresh Button** - Reload data
6. **Pagination** - Navigate pages
7. **View Metadata** - Expand to see action metadata
8. **Target Links** - Navigate to verification or user profile

## Action Type Colors

Uses `getActionTypeColor()` and `getActionTypeDisplay()` from `@/lib/adminActions` for consistent badge styling.

## Pagination

- 20 actions per page
- Previous/Next buttons
- Current page indicator

## Authentication Requirements

- **Required:** No
- Public page - transparency is core to platform mission

## Styling

- Responsive grid for stats
- Mobile-friendly filter layout
- Expandable metadata sections

## Navigation Links

| Element | Destination |
|---------|-------------|
| View verification | `/verifications/[id]` |
| View profile | `/profile/[id]` |
