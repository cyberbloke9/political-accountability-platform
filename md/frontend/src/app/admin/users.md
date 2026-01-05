# Admin Users Page (admin/users/page.tsx)

## Overview

**File Path:** `frontend/src/app/admin/users/page.tsx`
**URL:** `/admin/users`
**Type:** Client Component (`'use client'`)

## Purpose

The Admin Users Page provides user management functionality for administrators. It displays a searchable, filterable table of all platform users with their roles, citizen scores, and ban status.

## Data Fetching

### Users Data
- Fetches from Supabase `users` table with role joins
- Includes user roles via nested select: `user_roles(role:admin_roles(name, level))`
- Limited to 500 users
- Ordered by `created_at` descending

### Ban Status
- Checks each user's ban status via `isUserBanned()` from `@/lib/banManagement`
- Runs in parallel using `Promise.all`

## Components Used

### Layout Components
- `AdminGuard` - Permission check: `view_user_details`
- `AdminLayout` - Admin page wrapper with breadcrumbs

### UI Components
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Input` - Search input
- `Button` - Action buttons
- `Badge` - Role and status badges
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`

### Icons (Lucide React)
- `Users` - Total users stat
- `Search` - Search icon
- `Shield` - Admin users stat
- `Ban` - Banned status
- `Award` - Citizen score
- `Calendar` - Join date
- `Loader2` - Loading spinner
- `ExternalLink` - View profile link
- `UserX` - Banned users stat

## User Interface

```typescript
interface User {
  id: string
  username: string
  email: string
  citizen_score: number
  created_at: string
  roles?: Array<{
    role: Array<{
      name: string
      level: number
    }>
  }>
  banned?: boolean
}
```

## Stats Cards

| Title | Icon | Color | Description |
|-------|------|-------|-------------|
| Total Users | Users | blue | All registered users |
| Admin Users | Shield | purple | Users with admin roles |
| Banned Users | UserX | red | Currently banned users |
| High Score (250+) | Award | green | Users with 250+ citizen score |

## Filter Options

### Search
- Filters by username or email
- Case-insensitive

### Role Filter
- All Roles
- Admins (users with roles)
- Regular Users (no roles)

### Status Filter
- All Status
- Active (not banned)
- Banned

### Score Filter
- All Scores
- High (250+)
- Medium (100-249)
- Low (<100)

## Table Columns

| Column | Content |
|--------|---------|
| Username | User's display name |
| Email | User's email (muted) |
| Roles | Role badges (purple) or "Regular User" |
| Citizen Score | Score with color-coded badge |
| Status | Active (green) or Banned (red) |
| Joined | Date with calendar icon |
| Actions | External link to profile |

## Score Badge Colors

| Score Range | Color |
|-------------|-------|
| 250+ | Green |
| 100-249 | Blue |
| <100 | Gray |

## User Interactions

1. **Search Input** - Filter users by name/email
2. **Role Filter** - Filter by admin/regular status
3. **Status Filter** - Filter by active/banned status
4. **Score Filter** - Filter by citizen score range
5. **Clear Filters Button** - Reset all filters
6. **Refresh Button** - Reload user data
7. **View Profile Link** - Opens user profile in new tab

## Authentication Requirements

- **Required:** Yes (Admin)
- Permission: `view_user_details`
- Wrapped in `AdminGuard`

## Loading States

- Centered spinner during initial load
- Button loading state during refresh

## Empty States

- "No users found matching your filters" message

## Navigation Links

| Element | Destination |
|---------|-------------|
| Profile Link | `/profile/[userId]` (new tab) |
