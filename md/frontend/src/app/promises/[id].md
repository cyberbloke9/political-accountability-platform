# Promise Detail Page (promises/[id]/page.tsx)

## Overview

**File Path:** `frontend/src/app/promises/[id]/page.tsx`
**URL:** `/promises/[id]`
**Type:** Client Component (`'use client'`)

## Purpose

The Promise Detail Page displays comprehensive information about a specific political promise, including its status, metadata, source links, and community verifications. It allows users to view evidence and submit new verifications.

## Data Fetching

### Promise Data
- Fetches from Supabase `promises` table
- Includes creator info via foreign key join: `creator:users!created_by(username)`
- Single record fetch using `.single()`

### Verification Count
- Separate count query on `verifications` table
- Uses `{ count: 'exact', head: true }` for efficient counting

### Verifications List
- Fetches all verifications for the promise
- Includes submitter info: `submitter:users!submitted_by(username, citizen_score)`
- Ordered by `created_at` descending

### View Count Increment
- Automatically increments `view_count` when page loads

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### Custom Components
- `VerificationCard` - Displays individual verification with voting

### UI Components
- `Button` - Action buttons
- `Badge` - Status badges
- `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle`
- `Separator` - Visual dividers
- `Image` (Next.js) - Promise images

### Icons (Lucide React)
- `Calendar` - Promise date
- `Eye` - View count
- `FileText` - Verifications
- `ExternalLink` - Source link
- `ShieldCheck` - Logo/404 state
- `ArrowLeft` - Back button
- `Share2` - Share button
- `Tag` - Category/tags
- `User` - Submitter

## Interfaces

```typescript
interface Promise {
  id: string
  politician_name: string
  promise_text: string
  promise_date: string
  source_url?: string
  category?: string
  tags?: string[]
  status: 'pending' | 'in_progress' | 'fulfilled' | 'broken' | 'stalled'
  image_url?: string
  view_count: number
  created_at: string
  updated_at: string
  created_by: string
  creator?: { username: string }
}

interface Verification {
  id: string
  verdict: 'fulfilled' | 'broken' | 'in_progress' | 'stalled'
  evidence_text: string
  evidence_urls?: string[]
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  upvotes: number
  downvotes: number
  submitter?: { username: string; citizen_score: number }
}
```

## Status Configuration

| Status | Label | Class | Description |
|--------|-------|-------|-------------|
| pending | Pending Verification | `bg-muted` | Awaiting evidence |
| in_progress | In Progress | `bg-warning` | Work has begun |
| fulfilled | Fulfilled | `bg-success` | Promise completed |
| broken | Broken | `bg-destructive` | Promise not kept |
| stalled | Stalled | `bg-muted` | No progress made |

## User Interactions

1. **Back Button** - Navigate to `/promises`
2. **Share Button** - Web Share API or clipboard copy
3. **Source Link** - Opens external source URL
4. **Submit Verification Button** - Navigate to `/verifications/new?promise=[id]`
5. **Add Verification Button** - Same as above
6. **Verification Voting** - Upvote/downvote verifications

## Share Functionality

```typescript
const handleShare = async () => {
  if (navigator.share) {
    await navigator.share({
      title: `Promise by ${promise?.politician_name}`,
      text: promise?.promise_text,
      url: window.location.href,
    })
  } else {
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard!')
  }
}
```

## Loading States

- Skeleton loading for promise content
- Separate loading state for verifications
- Loading spinner while fetching verifications

## Error States

- **Promise Not Found**: Shows icon, message, and back button
- **Fetch Errors**: Toast notifications via `sonner`

## Authentication Requirements

- **Required:** No for viewing
- Required for submitting verifications (redirected)

## Metadata Grid

| Icon | Label | Value |
|------|-------|-------|
| Calendar | Promise Date | Formatted date |
| Eye | Views | View count |
| FileText | Verifications | Count submitted |
| User | Submitted by | Creator username |

## Navigation Links

| Element | Destination |
|---------|-------------|
| Back to Promises | `/promises` |
| Submit Verification | `/verifications/new?promise=[id]` |
| Add Verification | `/verifications/new?promise=[id]` |
