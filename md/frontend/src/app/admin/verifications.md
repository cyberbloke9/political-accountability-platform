# Admin Verifications Page (admin/verifications/page.tsx)

## Overview

**File Path:** `frontend/src/app/admin/verifications/page.tsx`
**URL:** `/admin/verifications`
**Type:** Client Component (`'use client'`)

## Purpose

The Admin Verifications Page provides a queue-based interface for moderators to review, approve, or reject user-submitted verifications. It includes filtering by status and sorting options.

## Data Fetching

### Verifications
- Fetches from Supabase `verifications` table
- Includes nested data:
  - Promise info via `promise:promises!promise_id`
  - Submitter info via `submitter:users!submitted_by`
- Supports filtering by status
- Supports multiple sort options
- Limited to 50 per page

## Components Used

### Layout Components
- `AdminGuard` - Permission check: `view_verification_queue`
- `AdminLayout` - Admin page wrapper

### Custom Components
- `VerificationReviewCard` - Displays verification details with actions
- `RejectDialog` - Modal for entering rejection reason

### UI Components
- `Tabs`, `TabsList`, `TabsTrigger` - Status filter tabs
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` - Sort dropdown
- `Badge` - Total count badge

### Icons (Lucide React)
- `FileText` - Empty state icon
- `Loader2` - Loading spinner

### Hooks
- `useToast()` - Toast notifications

## State Management

```typescript
const [verifications, setVerifications] = useState<any[]>([])
const [loading, setLoading] = useState(true)
const [actionLoading, setActionLoading] = useState(false)
const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
const [selectedVerificationId, setSelectedVerificationId] = useState<string | null>(null)
const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
const [sortBy, setSortBy] = useState<SortBy>('newest')
const [totalCount, setTotalCount] = useState(0)
```

## Status Filters

| Tab | Value | Description |
|-----|-------|-------------|
| Pending | `pending` | Awaiting review |
| Approved | `approved` | Previously approved |
| Rejected | `rejected` | Previously rejected |
| All | `all` | All verifications |

## Sort Options

| Option | Description |
|--------|-------------|
| Newest First | Most recent submissions |
| Oldest First | Oldest submissions |
| Most Upvoted | Highest upvote count |
| Most Controversial | Highest total votes |

## User Interactions

1. **Status Tabs** - Filter by verification status
2. **Sort Dropdown** - Change sort order
3. **Approve Button** - Approve pending verification
4. **Reject Button** - Open rejection dialog
5. **Rejection Reason Input** - Enter reason for rejection
6. **Confirm Rejection** - Submit rejection with reason

## Approval Flow

1. Admin clicks Approve on a verification
2. `approveVerification(id)` from `@/lib/moderationActions` is called
3. On success: Toast notification, list refreshed
4. On error: Toast with error message

## Rejection Flow

1. Admin clicks Reject on a verification
2. Rejection dialog opens
3. Admin enters rejection reason
4. `rejectVerification(id, reason)` is called
5. On success: Dialog closes, list refreshed
6. On error: Toast with error message

## Verification Card Features

Each card shows:
- Promise info (politician name, promise text)
- Submitter info (username, citizen score)
- Evidence text and URLs
- Verdict (fulfilled, broken, etc.)
- Trust level and self-verification flag
- Upvotes/downvotes
- Status badge
- Action buttons (if pending)

## Authentication Requirements

- **Required:** Yes (Admin)
- Permission: `view_verification_queue`
- Approve/Reject actions only shown for pending verifications

## Loading States

- Centered spinner during data fetch
- Button loading states during actions

## Empty States

- FileText icon with message
- Different messages for pending vs filtered views

## Grid Layout

- 1 column on mobile
- 2 columns on large screens
