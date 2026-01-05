# Dashboard Page (dashboard/page.tsx)

## Overview

**File Path:** `frontend/src/app/dashboard/page.tsx`
**URL:** `/dashboard`
**Type:** Client Component (`'use client'`)

## Purpose

The Dashboard Page serves as the authenticated user's home base, displaying their contribution statistics, quick actions, and activity tabs for tracked promises and submitted verifications.

## Data Fetching

- Currently uses placeholder data (static stats with value '0')
- Authentication check via `useAuth()` hook
- No real-time data fetching implemented yet

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle`
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
- `Button` - Quick action buttons

### Icons (Lucide React)
- `ShieldCheck` - Promises tracked
- `TrendingUp` - View leaderboard
- `FileText` - Verifications
- `Vote` - Votes cast
- `Trophy` - Citizen score
- `Activity` - Activity tab
- `Plus` - Submit promise

## Stats Cards

| Title | Icon | Color | Description |
|-------|------|-------|-------------|
| Promises Tracked | ShieldCheck | primary | Promises you are following |
| Verifications | FileText | secondary | Evidence you submitted |
| Votes Cast | Vote | success | Total votes on verifications |
| Citizen Score | Trophy | warning | Your contribution points |

## User Interactions

1. **Submit Promise Button** - Navigate to `/promises/new`
2. **Browse Promises Button** - Navigate to `/promises`
3. **View Leaderboard Button** - Navigate to `/leaderboard`
4. **Activity Tab** - View recent activity (placeholder)
5. **Tracked Promises Tab** - View tracked promises (placeholder)
6. **Verifications Tab** - View submitted verifications (placeholder)

## Tab Content

### Activity Tab
- Empty state with Activity icon
- "No activity yet" message
- Suggestion to start tracking or submitting

### Tracked Promises Tab
- Empty state with ShieldCheck icon
- "No tracked promises" message
- "Browse Promises" button

### Verifications Tab
- Empty state with FileText icon
- "No verifications yet" message
- Suggestion to help verify promises

## Quick Actions Section

Three quick action buttons in a responsive grid:
1. Submit Promise -> `/promises/new`
2. Browse Promises -> `/promises`
3. View Leaderboard -> `/leaderboard`

## Authentication Requirements

- **Required:** Yes
- Redirects to `/auth/login` if not authenticated
- Uses `useEffect` to handle redirect on auth state change

## Authentication Flow

```typescript
useEffect(() => {
  if (!loading && !isAuthenticated) {
    router.push('/auth/login')
  }
}, [loading, isAuthenticated, router])
```

## Loading State

- Centered spinner while checking authentication
- "Loading..." text below spinner

## Styling

- Responsive grid for stats: 1 column mobile, 2 tablet, 4 desktop
- Responsive grid for quick actions: 1-2-3 columns
- Mobile-optimized tabs with abbreviated text

## Navigation Links

| Element | Destination |
|---------|-------------|
| Submit Promise | `/promises/new` |
| Browse Promises | `/promises` |
| View Leaderboard | `/leaderboard` |
| If Not Authenticated | `/auth/login` |

## Future Enhancements

The page is structured to support:
- Real user statistics
- Activity feed with recent contributions
- List of tracked promises
- List of user's verifications with status
