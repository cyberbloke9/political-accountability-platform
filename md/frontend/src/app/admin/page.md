# Admin Dashboard Page (admin/page.tsx)

## Overview

**File Path:** `frontend/src/app/admin/page.tsx`
**URL:** `/admin`
**Type:** Client Component (`'use client'`)

## Purpose

The Admin Dashboard provides moderators and administrators with an overview of platform activity, quick access to moderation tools, and real-time statistics on verifications, users, and fraud detection.

## Data Fetching

### Dashboard Stats
Fetches from multiple Supabase tables:
- `verifications` - Pending, approved, rejected counts
- `users` - Total user count
- Fraud detection stats via `getFraudStats()` from `@/lib/fraudDetection`

### Queries
```typescript
// Pending verifications
supabase.from('verifications').select('*', { count: 'exact', head: true }).eq('status', 'pending')

// Approved/Rejected today
supabase.from('verifications')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'approved'/'rejected')
  .gte('updated_at', today.toISOString())
```

## Components Used

### Layout Components
- `AdminGuard` - Wraps page for admin authorization
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Badge` - Role badge
- `Button` - Quick action buttons

### Hooks
- `useAdmin()` - Admin role and permissions

### Icons (Lucide React)
- `Shield` - Admin role/audit
- `FileText` - Verifications
- `Users` - User management
- `TrendingUp` - Actions/Vote patterns
- `CheckCircle` - Approved
- `XCircle` - Rejected
- `Clock` - Pending
- `AlertTriangle` - Fraud detection
- `Award` - Reputation
- `UserX` - Bans

## Stats Interface

```typescript
interface DashboardStats {
  pendingVerifications: number
  flaggedContent: number
  totalUsers: number
  recentActions: number
  approvedToday: number
  rejectedToday: number
  fraudFlags: number
  criticalFlags: number
}
```

## Stat Cards

| Title | Icon | Color | Link |
|-------|------|-------|------|
| Pending Verifications | Clock | yellow | /admin/verifications |
| Fraud Flags | AlertTriangle | red | /admin/fraud |
| Total Users | Users | blue | /admin/users |
| Actions Today | TrendingUp | green | /admin/audit |

## Today's Activity Section

Three activity indicators:
- Approved (green CheckCircle)
- Rejected (red XCircle)
- Pending (yellow Clock)

## Quick Actions

| Title | Description | Icon | Link | Permission |
|-------|-------------|------|------|------------|
| Review Verifications | Approve or reject pending | FileText | /admin/verifications | approve_verification |
| Fraud Detection | Review fraud flags | AlertTriangle | /admin/fraud | manage_fraud |
| Vote Patterns | Detect partisan bias | TrendingUp | /admin/vote-patterns | manage_fraud |
| Reputation Settings | Configure reputation rules | Award | /admin/reputation | manage_admins |
| Auto-Approval | Configure auto-approval | CheckCircle | /admin/auto-approval | manage_admins |
| Ban Management | Manage user bans | UserX | /admin/bans | ban_user |
| Manage Users | View users, assign roles | Users | /admin/users | view_user_details |
| View Audit Log | See all admin actions | Shield | /admin/audit | view_audit_log |

## Permission Checks

Each quick action checks `admin.hasPermission(permission)`:
- Enabled with full styling if user has permission
- Disabled (opacity-50) with "No Permission" button if lacking

## Admin Role Display

Shows role badge with:
- SuperAdmin, Moderator, or Reviewer based on `admin` object
- Comma-separated list of roles

## Authentication Requirements

- **Required:** Yes (Admin role)
- Wrapped in `AdminGuard` component
- Uses `useAdmin()` hook for permission checks

## Loading State

- Stats show "..." while loading
- Each stat card is clickable for navigation

## Navigation Links

All links lead to admin sub-pages based on permissions:
- `/admin/verifications`
- `/admin/fraud`
- `/admin/vote-patterns`
- `/admin/reputation`
- `/admin/auto-approval`
- `/admin/bans`
- `/admin/users`
- `/admin/audit`
