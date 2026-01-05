# Leaderboard Page (leaderboard/page.tsx)

## Overview

**File Path:** `frontend/src/app/leaderboard/page.tsx`
**URL:** `/leaderboard`
**Type:** Client Component (`'use client'`)

## Purpose

The Leaderboard Page displays a real-time ranking of top contributors on the platform, showing their citizen scores, contribution statistics, and achievements.

## Data Fetching

### Real-time Leaderboard
- Uses `useRealtimeLeaderboard(50)` custom hook
- Fetches top 50 users ranked by score
- Updates in real-time via Supabase subscriptions

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Card`, `CardContent`
- `Badge` - Live updates indicator, user titles
- `Avatar`, `AvatarFallback` - User avatars

### Icons (Lucide React)
- `Trophy` - 1st place / empty state icon
- `Medal` - 2nd place icon
- `Award` - 3rd place icon
- `TrendingUp` - Live updates badge

## Leaderboard Entry Interface

```typescript
interface LeaderboardEntry {
  user_id: string
  username: string
  total_score: number
  total_promises_created: number
  total_verifications_submitted: number
  total_votes_cast: number
  title?: string
}
```

## Rank Icons

| Rank | Icon | Color |
|------|------|-------|
| 1st | Trophy | warning (gold) |
| 2nd | Medal | muted-foreground (silver) |
| 3rd | Award | warning/70 (bronze) |
| 4+ | Number | - |

## User Interactions

- View-only page
- No interactive elements except navigation

## Leaderboard Entry Display

Each entry shows:
- Rank (number or icon for top 3)
- Avatar with first letter of username
- Username
- Title badge (if earned)
- Contribution stats:
  - Promises created
  - Verifications submitted
  - Votes cast
- Total score (points)

## Top 3 Styling

Entries ranked 1-3 receive special styling:
- Border: `border-2 border-primary/20`
- Background: `bg-primary/5`

## Loading State

- 10 skeleton cards with pulse animation
- Height: `h-20` each

## Error State

- Simple error message: "Error loading leaderboard"
- Displayed in centered card

## Empty State

- Trophy icon (muted)
- "No citizens ranked yet" message
- Suggestion to start contributing

## Authentication Requirements

- **Required:** No
- Public page accessible to all visitors

## Real-time Updates

- "Live Updates" badge with TrendingUp icon
- Leaderboard automatically refreshes when data changes
- Uses Supabase real-time subscriptions

## Styling

- Responsive padding: `p-4 sm:p-6`
- Text sizes scale for mobile/desktop
- Avatar sizes: `h-10 w-10` mobile, `h-12 w-12` desktop
- Score prominently displayed on right side

## Score Display

```typescript
entry.total_score.toLocaleString()
```
- Formatted with thousands separators
- "points" label below
