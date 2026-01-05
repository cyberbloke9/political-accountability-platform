# Frontend Architecture Documentation

Last Updated: January 5, 2026

## Overview

The Political Accountability Platform frontend is built with Next.js 14 (App Router), React 18, TypeScript, and Tailwind CSS. This document details the architecture of the `src/lib` directory which contains core business logic, API integrations, and utility functions.

## Directory Structure

```
frontend/src/
├── app/                    # Next.js App Router pages
├── components/             # React components
├── hooks/                  # Custom React hooks (documented below)
│   ├── useAuth.ts          # Authentication state management
│   ├── useAdmin.ts         # Admin role/permission checking
│   ├── useSupabaseStorage.ts # File upload/download
│   ├── useRealtimeLeaderboard.ts # Real-time leaderboard
│   ├── useRealtimeVoting.ts # Real-time vote counts
│   └── use-toast.ts        # Toast notifications
└── lib/                    # Core business logic (documented below)
    ├── utils.ts            # Utility functions
    ├── supabase.ts         # Client-side Supabase client
    ├── supabase-server.ts  # Server-side Supabase client
    ├── searchPromises.ts   # Promise search functionality
    ├── adminAuth.ts        # Admin authentication/authorization
    ├── moderationActions.ts # Verification moderation
    ├── votePatterns.ts     # Vote pattern analysis
    ├── reputationEngine.ts # Reputation system
    ├── autoApproval.ts     # Auto-approval system
    ├── adminActions.ts     # Admin action logging
    ├── banManagement.ts    # User ban system
    ├── fraudDetection.ts   # Fraud detection
    └── politicians.ts      # Politician data management
```

---

## Lib Files Documentation

### 1. utils.ts

**Purpose**: Tailwind CSS class merging utility

**Exports**:
- `cn(...inputs: ClassValue[]): string` - Merges Tailwind classes using clsx and tailwind-merge

**Usage**:
```typescript
import { cn } from '@/lib/utils'
cn('px-4 py-2', isActive && 'bg-blue-500', className)
```

---

### 2. supabase.ts

**Purpose**: Client-side Supabase client initialization

**Exports**:
- `supabase` - Configured Supabase client instance
- `isSupabaseConfigured()` - Checks if Supabase is properly configured

**Features**:
- Auto-refresh tokens
- Persistent sessions
- Session detection in URL
- Environment variable sanitization (removes whitespace/newlines)

**Configuration**:
```typescript
// Uses environment variables:
// NEXT_PUBLIC_SUPABASE_URL
// NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

### 3. supabase-server.ts

**Purpose**: Server-side Supabase client for Next.js Server Components

**Exports**:
- `createClient()` - Creates server-side Supabase client with cookie handling

**Features**:
- Cookie-based session management
- Compatible with Next.js middleware
- Handles Server Component restrictions gracefully

**Usage** (in Server Components):
```typescript
import { createClient } from '@/lib/supabase-server'
const supabase = createClient()
const { data } = await supabase.from('promises').select()
```

---

### 4. searchPromises.ts

**Purpose**: Advanced promise search and filtering

**Interfaces**:
```typescript
interface SearchFilters {
  query?: string          // Text search (politician, promise, party)
  status?: string[]       // Promise status filter
  party?: string[]        // Political party filter
  tags?: string[]         // Tag slug filter
  dateFrom?: string       // Date range start
  dateTo?: string         // Date range end
  sortBy?: 'newest' | 'oldest' | 'most_verified' | 'trending'
  page?: number
  pageSize?: number
}

interface SearchResult {
  promises: any[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
```

**Exports**:
- `searchPromises(filters)` - Search promises with filters and pagination
- `getAllParties()` - Get unique political parties for filter dropdown
- `getAllTags()` - Get all promise tags

**Database Queries**:
- Uses `promises` table with `promise_tag_mappings` join
- Supports text search with `ilike` operator
- Pagination with `range()` method

---

### 5. adminAuth.ts

**Purpose**: Admin authentication and authorization system

**Interfaces**:
```typescript
interface AdminStatus {
  isAdmin: boolean
  level: number      // 0=none, 1=Reviewer, 2=Moderator, 3=SuperAdmin
  roles: string[]
  permissions: string[]
}
```

**Exports**:
- `getAdminStatus()` - Get current user's admin status and permissions
- `hasPermission(permission)` - Check if user has specific permission
- `hasMinimumLevel(minLevel)` - Check if user meets minimum admin level
- `verifyAdminAccess(permission?, minLevel?)` - Server-side admin verification
- `getUserAdminLevel()` - Get admin level via database function
- `checkUserPermission(permission)` - Check permission via database function

**Admin Levels**:
| Level | Role | Description |
|-------|------|-------------|
| 0 | None | Regular user |
| 1 | Reviewer | Can review verifications |
| 2 | Moderator | Can moderate + manage users |
| 3 | SuperAdmin | Full platform access |

**Database Functions Used**:
- `user_admin_level(user_auth_id)`
- `user_has_permission(user_auth_id, required_permission)`

---

### 6. moderationActions.ts

**Purpose**: Verification approval/rejection actions

**Exports**:
- `approveVerification(verificationId, adminReason?)` - Approve a verification
- `rejectVerification(verificationId, reason)` - Reject a verification with required reason

**Database Functions Called**:
- `approve_verification(verification_id, admin_user_id, approval_reason)`
  - Updates verification status to 'approved'
  - Awards +10 reputation points to submitter
  - Logs admin action
  - Creates notification for user

- `reject_verification(verification_id, admin_user_id, rejection_reason)`
  - Updates verification status to 'rejected'
  - Deducts -15 reputation points from submitter
  - Logs admin action with reason
  - Creates notification with reason

---

### 7. votePatterns.ts

**Purpose**: Vote pattern analysis and manipulation detection

**Interfaces**:
```typescript
interface UserPartyBias {
  id: string
  user_id: string
  party_name: string
  upvotes_count: number
  downvotes_count: number
  total_votes: number
  bias_score: number        // -1.0 to 1.0
  last_updated: string
}

interface CoordinatedVotingGroup {
  id: string
  group_members: string[]
  verification_ids: string[]
  vote_type: string
  coordination_score: number
  time_window_minutes: number
  detected_at: string
}
```

**Exports**:
- `getExtremeBiasUsers(minBiasScore)` - Get users with extreme partisan bias (>0.8)
- `getCoordinatedVotingGroups()` - Get detected vote brigades
- `getPartyVotingStats()` - Get party-wise voting statistics
- `runVotePatternAnalysis()` - Manually trigger pattern analysis
- `getUserPartyBias(userId)` - Get specific user's bias data

**Detection Criteria**:
- Extreme bias: |bias_score| > 0.8 with >= 10 votes
- Coordinated voting: Multiple users voting same way in short time window

---

### 8. reputationEngine.ts

**Purpose**: Citizen reputation point system management

**Interfaces**:
```typescript
interface ReputationRule {
  id: string
  rule_name: string
  event_type: string
  points_change: number
  description: string
  enabled: boolean
}

interface ReputationHistory {
  id: string
  user_id: string
  points_change: number
  reason: string
  event_type: string | null
  previous_score: number
  new_score: number
  created_at: string
}

interface UserActivityStatus {
  user_id: string
  last_verification_at: string | null
  last_vote_at: string | null
  last_active_at: string
  total_verifications: number
  total_votes: number
  inactive_days: number
}
```

**Exports**:
- `getReputationRules()` - Get all reputation rules
- `updateReputationRule(ruleId, updates)` - Update rule (SuperAdmin only)
- `getUserReputationHistory(userId, limit)` - Get user's reputation changes
- `getReputationBreakdown(userId)` - Get reputation by event type
- `getUserActivityStatus(userId)` - Get user's activity metrics
- `applyReputationDecay()` - Apply decay to inactive users
- `getReputationStats()` - Get platform-wide reputation statistics

**Default Point Values**:
| Event | Points |
|-------|--------|
| Verification approved | +10 |
| Verification rejected | -15 |
| Upvote received | +1 |
| Account registration | +10 |

---

### 9. autoApproval.ts

**Purpose**: Automatic verification approval for trusted users

**Interfaces**:
```typescript
interface AutoApprovalRules {
  id: string
  enabled: boolean
  min_citizen_score: number
  min_evidence_length: number
  require_source_url: boolean
  min_account_age_days: number
  min_approved_verifications: number
  max_recent_rejections: number
  rejection_lookback_days: number
}

interface AutoApprovalLog {
  id: string
  verification_id: string
  user_id: string
  auto_approved: boolean
  reason: string
  criteria_met: Record<string, any>
  rules_snapshot: Record<string, any>
  created_at: string
}
```

**Exports**:
- `getAutoApprovalRules()` - Get current rules
- `updateAutoApprovalRules(updates)` - Update rules (SuperAdmin only)
- `getAutoApprovalLogs(filters?)` - Get approval logs
- `getAutoApprovalStats()` - Get approval statistics
- `estimateQualificationRate(rules)` - Estimate how many users would qualify

**Qualification Criteria (Default)**:
- Minimum citizen score
- Minimum evidence text length
- Optional: require source URL
- Minimum account age
- Minimum approved verifications
- Maximum recent rejections

---

### 10. adminActions.ts

**Purpose**: Admin action logging and audit trail

**Interfaces**:
```typescript
interface AdminAction {
  id: string
  action_type: string
  target_type: string
  target_id: string
  admin_id: string
  reason: string | null
  metadata: Record<string, any> | null
  created_at: string
}

interface AdminActionStats {
  totalActions: number
  todayActions: number
  approvedToday: number
  rejectedToday: number
  fraudFlagsToday: number
  topAdmins: Array<{admin_id, username, action_count}>
  actionsByType: Record<string, number>
}
```

**Exports**:
- `getAdminActions(filters?)` - Get filtered admin actions
- `getAdminActionStats()` - Get action statistics
- `getActionTypeDisplay(actionType)` - Human-readable action type
- `getTargetTypeDisplay(targetType)` - Human-readable target type
- `getActionTypeColor(actionType)` - CSS classes for action type badges

**Action Types**:
- `approve_verification` - Verification approved
- `reject_verification` - Verification rejected
- `flag_fraud` - Fraud flagged
- `ban_user` / `unban_user` - User ban management
- `assign_admin_role` / `remove_admin_role` - Admin role management
- `auto_approve` - Automatic approval

---

### 11. banManagement.ts

**Purpose**: User ban system with appeals

**Interfaces**:
```typescript
interface Ban {
  id: string
  user_id: string
  banned_by: string
  reason: string
  ban_type: 'temporary' | 'permanent'
  banned_at: string
  expires_at: string | null
  is_active: boolean
  unbanned_at: string | null
  unban_reason: string | null
}

interface BanAppeal {
  id: string
  ban_id: string
  user_id: string
  appeal_reason: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  review_reason: string | null
}

interface BanStats {
  totalBans: number
  activeBans: number
  temporaryBans: number
  permanentBans: number
  expiredBans: number
  pendingAppeals: number
  approvedAppeals: number
  rejectedAppeals: number
}
```

**Exports**:
- `isUserBanned(userId)` - Check if user is currently banned
- `getBans(filters?)` - Get bans with filtering
- `banUser(params)` - Ban a user (temporary or permanent)
- `unbanUser(params)` - Unban a user
- `getBanStats()` - Get ban statistics
- `getBanAppeals(filters?)` - Get ban appeals
- `createBanAppeal(params)` - Submit appeal
- `reviewBanAppeal(params)` - Approve/reject appeal
- `expireTemporaryBans()` - Expire temporary bans (cron job)
- `getBanDurationDisplay(ban)` - Human-readable duration
- `getBanTypeColor(banType)` - CSS classes for ban type
- `getBanStatusColor(isActive)` - CSS classes for ban status
- `getAppealStatusColor(status)` - CSS classes for appeal status

**Database Functions Used**:
- `is_user_banned(check_user_id)`
- `ban_user(target_user_id, admin_user_id, ban_reason, duration_type, ban_duration_days)`
- `unban_user(target_user_id, admin_user_id, unban_reason_text)`
- `expire_temporary_bans()`

---

### 12. fraudDetection.ts

**Purpose**: Fraud detection and flag management

**Interfaces**:
```typescript
interface FraudFlag {
  id: string
  flag_type: 'spam' | 'vote_manipulation' | 'low_quality' | 'duplicate' | 'coordinated_voting'
  target_type: 'verification' | 'user' | 'vote'
  target_id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'reviewed' | 'confirmed' | 'dismissed'
  confidence_score: number
  details: Record<string, any>
  auto_detected: boolean
}
```

**Exports**:
- `getFraudFlags(filters?)` - Get fraud flags with enriched target data
- `runFraudDetection()` - Manually trigger fraud detection
- `reviewFraudFlag(flagId, newStatus, adminNotes?)` - Review a flag
- `getFraudStats()` - Get fraud statistics by severity and type

**Flag Types**:
| Type | Description |
|------|-------------|
| spam | Spam content detection |
| vote_manipulation | Vote gaming attempts |
| low_quality | Poor quality submissions |
| duplicate | Duplicate content |
| coordinated_voting | Vote brigade detection |

**Severity Levels**: low, medium, high, critical

---

### 13. politicians.ts

**Purpose**: Politician data management and statistics

**Interfaces**:
```typescript
interface Politician {
  id: string
  name: string
  slug: string
  party: string | null
  position: string | null
  state: string | null
  constituency: string | null
  bio: string | null
  image_url: string | null
  twitter_handle: string | null
  wikipedia_url: string | null
  official_website: string | null
  date_of_birth: string | null
  is_active: boolean
}

interface PoliticianStats {
  politician_name: string
  total_promises: number
  fulfilled_count: number
  broken_count: number
  in_progress_count: number
  pending_count: number
  stalled_count: number
  fulfillment_rate: number | null
  latest_promise_date: string
}
```

**Exports**:
- `getPoliticians(options?)` - Get politicians with filtering
- `getPoliticianBySlug(slug)` - Get single politician by slug
- `getPoliticianById(id)` - Get single politician by ID
- `getPoliticianStats(politicianName)` - Get promise statistics
- `getAllPoliticianStats(options?)` - Get all politicians with stats
- `getPoliticianPromises(politicianName, options?)` - Get promises for politician
- `updatePolitician(id, updates)` - Update politician (admin only)
- `getUniqueParties()` - Get list of unique parties
- `getUniqueStates()` - Get list of unique states
- `getPartyColor(party)` - Get party-specific CSS classes
- `formatPosition(position)` - Format position abbreviations

**Party Colors**:
| Party | Color Scheme |
|-------|-------------|
| BJP | Orange |
| Congress/INC | Blue |
| AAP | Cyan |
| TMC | Green |
| DMK | Red |
| JDU | Yellow |
| Shiv Sena | Amber |
| Communist/CPM/LDF | Red |
| Others | Purple |

---

## Hooks Documentation

Custom React hooks that encapsulate business logic and provide reactive state management.

### 1. useAuth.ts

**Purpose**: Authentication state management and auth operations

**Interface**:
```typescript
interface UseAuthReturn {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  signUp: (email, password, username) => Promise<{ error: AuthError | null }>
  signIn: (email, password) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email) => Promise<{ error: AuthError | null }>
}
```

**Features**:
- Automatic session restoration on mount
- Real-time auth state subscription
- Redirect callback handling for email verification
- Password reset flow with redirect

**Usage**:
```typescript
const { user, isAuthenticated, signIn, signOut, loading } = useAuth()
```

---

### 2. useAdmin.ts

**Purpose**: Admin role and permission checking in components

**Returns**:
```typescript
{
  isAdmin: boolean
  level: number              // 0-3
  roles: string[]
  permissions: string[]
  loading: boolean

  // Methods
  hasPermission(permission: string): boolean
  hasAnyPermission(permissions: string[]): boolean
  hasAllPermissions(permissions: string[]): boolean
  hasMinimumLevel(minLevel: number): boolean
  hasRole(roleName: string): boolean

  // Convenience flags
  isReviewer: boolean       // level >= 1
  isModerator: boolean      // level >= 2
  isSuperAdmin: boolean     // level >= 3
}
```

**Usage**:
```typescript
const { isAdmin, isSuperAdmin, hasPermission, loading } = useAdmin()

if (loading) return <Spinner />
if (!isAdmin) return <AccessDenied />
if (hasPermission('ban_users')) {
  // Show ban button
}
```

---

### 3. useSupabaseStorage.ts

**Purpose**: File upload/download with Supabase Storage

**Storage Buckets**:
```typescript
const STORAGE_BUCKETS = {
  EVIDENCE_IMAGES: 'evidence-images',
  EVIDENCE_VIDEOS: 'evidence-videos',
  PROFILE_AVATARS: 'profile-avatars',
}
```

**Returns**:
```typescript
{
  uploadFile(file, bucket, path): Promise<UploadResult | null>
  deleteFile(bucket, path): Promise<{ success: boolean; error?: Error }>
  getPublicUrl(bucket, path): string
  getOptimizedImageUrl(publicUrl, options): string
  uploadProgress: { uploading: boolean; progress: number; error: Error | null }
  STORAGE_BUCKETS: typeof STORAGE_BUCKETS
}
```

**Image Optimization Options**:
```typescript
getOptimizedImageUrl(url, {
  width: 400,
  height: 400,
  resize: 'cover' | 'contain' | 'fill',
  format: 'webp' | 'jpeg' | 'png',
  quality: 80
})
```

**Usage**:
```typescript
const { uploadFile, uploadProgress, STORAGE_BUCKETS } = useSupabaseStorage()

const result = await uploadFile(file, 'EVIDENCE_IMAGES', `verifications/${verificationId}`)
if (result) {
  console.log('URL:', result.publicUrl)
  console.log('Thumbnail:', result.thumbnailUrl) // Auto-generated for images
}
```

---

### 4. useRealtimeLeaderboard.ts

**Purpose**: Real-time citizen score leaderboard with Supabase subscriptions

**Interface**:
```typescript
interface LeaderboardEntry {
  user_id: string
  username: string
  total_score: number
  title: string
  reputation: number
  total_promises_created: number
  total_verifications_submitted: number
  total_votes_cast: number
  member_since: string
}
```

**Returns**:
```typescript
{
  leaderboard: LeaderboardEntry[]
  loading: boolean
  error: Error | null
}
```

**Features**:
- Initial fetch from `citizen_scores_mv` view
- Real-time subscription to leaderboard changes
- Auto-refetch on any change
- Cleanup on unmount

**Usage**:
```typescript
const { leaderboard, loading, error } = useRealtimeLeaderboard(100)

// Renders automatically update when scores change
```

---

### 5. useRealtimeVoting.ts

**Purpose**: Real-time vote counts for a specific verification

**Interface**:
```typescript
interface VoteCount {
  approve: number   // Upvotes
  reject: number    // Downvotes
  total: number
}
```

**Returns**:
```typescript
{
  voteCount: VoteCount
  loading: boolean
  error: Error | null
}
```

**Features**:
- Initial vote count fetch
- Real-time subscription filtered to specific verification
- Optimistic updates on new votes (no refetch needed)
- Channel cleanup on unmount

**Usage**:
```typescript
const { voteCount, loading } = useRealtimeVoting(verificationId)

// Display: {voteCount.approve} upvotes, {voteCount.reject} downvotes
// Updates in real-time as users vote
```

---

### 6. use-toast.ts

**Purpose**: Toast notification system (shadcn/ui pattern)

**Returns**:
```typescript
{
  toasts: ToasterToast[]
  toast(props: Toast): { id: string; dismiss(): void; update(props): void }
  dismiss(toastId?: string): void
}
```

**Toast Properties**:
```typescript
interface Toast {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: 'default' | 'destructive'
  duration?: number
}
```

**Features**:
- Global state management (works across components)
- Auto-dismiss with configurable delay
- Limit of 1 toast at a time (configurable via `TOAST_LIMIT`)
- Update/dismiss individual toasts

**Usage**:
```typescript
const { toast } = useToast()

// Success toast
toast({
  title: 'Success!',
  description: 'Your verification was submitted.',
})

// Error toast
toast({
  title: 'Error',
  description: 'Something went wrong.',
  variant: 'destructive',
})

// With action
toast({
  title: 'Undo?',
  description: 'Your post was deleted.',
  action: <ToastAction onClick={undo}>Undo</ToastAction>,
})
```

---

## Components Documentation

The components are organized by feature domain, following a modular architecture.

### Component Structure

```
frontend/src/components/
├── ui/                    # shadcn/ui primitives (17 files)
├── admin/                 # Admin panel components
├── auth/                  # Authentication forms
├── layout/                # Header, Footer, navigation
├── promises/              # Promise-related components
├── verifications/         # Verification-related components
├── citizen/               # User profile components
└── evidence/              # Evidence submission components
```

### UI Components (shadcn/ui)

Base UI primitives built on Radix UI, fully customizable via Tailwind CSS:

| Component | Purpose |
|-----------|---------|
| `button.tsx` | Buttons with variants (default, destructive, outline, ghost) |
| `input.tsx` | Text input fields |
| `label.tsx` | Form labels |
| `card.tsx` | Card container (Card, CardHeader, CardContent, CardFooter) |
| `badge.tsx` | Status badges with color variants |
| `avatar.tsx` | User avatars with fallback |
| `tabs.tsx` | Tab navigation |
| `alert.tsx` | Alert messages |
| `dialog.tsx` | Modal dialogs |
| `sheet.tsx` | Slide-out panels (mobile menu) |
| `select.tsx` | Dropdown select |
| `checkbox.tsx` | Checkbox inputs |
| `switch.tsx` | Toggle switches |
| `textarea.tsx` | Multi-line text input |
| `table.tsx` | Data tables |
| `toast.tsx` / `toaster.tsx` | Toast notifications |
| `popover.tsx` | Popover tooltips |
| `calendar.tsx` | Date picker calendar |
| `progress.tsx` | Progress bars |
| `separator.tsx` | Visual separators |

### Admin Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `AdminGuard.tsx` | Route protection for admin pages | `requiredPermission`, `minLevel`, `requireAll` |
| `AdminLayout.tsx` | Admin page layout with breadcrumbs | `title`, `breadcrumbs` |
| `VerificationReviewCard.tsx` | Verification review with approve/reject | `verification`, `onApprove`, `onReject` |
| `RejectDialog.tsx` | Rejection reason modal | `isOpen`, `onClose`, `onConfirm` |
| `FraudFlagCard.tsx` | Fraud flag display with actions | `flag`, `onReview` |
| `FlaggedAccountCard.tsx` | Flagged user account card | `account`, `onResolve` |

**AdminGuard Usage**:
```typescript
<AdminGuard minLevel={2} requiredPermission="manage_users">
  <ModeratorOnlyContent />
</AdminGuard>

<AdminGuard requiredPermissions={['ban_users', 'flag_fraud']} requireAll>
  <SpecialAdminContent />
</AdminGuard>
```

### Layout Components

| Component | Purpose |
|-----------|---------|
| `Header.tsx` | Main navigation header with auth state, admin badges, mobile menu |
| `Footer.tsx` | Site footer with links |

**Header Features**:
- Responsive design (desktop nav + mobile sheet)
- Auth state awareness (login/signup vs user menu)
- Admin badge display (Reviewer/Moderator/SuperAdmin)
- Active route highlighting

### Promise Components

| Component | Purpose |
|-----------|---------|
| `PromiseCard.tsx` | Promise display card with tags, status |
| `FilterPanel.tsx` | Search filters (status, party, tags, dates) |

### Verification Components

| Component | Purpose |
|-----------|---------|
| `VerificationCard.tsx` | Verification display with voting UI |

### Component Patterns

**1. Client Components**:
All interactive components use `'use client'` directive:
```typescript
'use client'
import { useState } from 'react'
```

**2. Composition Pattern**:
Components are composed using shadcn/ui primitives:
```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

**3. Conditional Rendering**:
```typescript
{admin.isAdmin && (
  <Link href="/admin">
    <Button variant="outline">Admin Panel</Button>
  </Link>
)}
```

**4. Loading States**:
```typescript
if (loading) {
  return <Loader2 className="h-8 w-8 animate-spin" />
}
```

**5. Responsive Design**:
Using Tailwind responsive prefixes:
```typescript
<span className="hidden lg:inline">Full Text</span>
<span className="lg:hidden">Short</span>
```

---

## App Pages Documentation

Next.js 14 App Router pages organized by feature.

### Route Map

```
frontend/src/app/
├── page.tsx                    # Home page (/)
├── layout.tsx                  # Root layout with Header/Footer
├── error.tsx                   # Global error boundary
├── not-found.tsx               # 404 page
│
├── about/page.tsx              # About page
├── contact/page.tsx            # Contact + Feedback form
├── guidelines/page.tsx         # Community guidelines
├── how-it-works/page.tsx       # Platform explanation
├── privacy/page.tsx            # Privacy policy
├── terms/page.tsx              # Terms of service
├── transparency/page.tsx       # Public transparency log
│
├── auth/                       # Authentication routes
│   ├── login/page.tsx          # Login form
│   ├── signup/page.tsx         # Registration form
│   ├── forgot-password/page.tsx # Password reset request
│   ├── reset-password/page.tsx  # Password reset form
│   ├── verify-email/page.tsx    # Email verification
│   └── callback/route.ts        # OAuth callback handler
│
├── dashboard/page.tsx          # User dashboard (auth required)
├── leaderboard/page.tsx        # Citizen score leaderboard
│
├── profile/
│   ├── page.tsx                # Current user profile redirect
│   └── [username]/page.tsx     # Public user profile
│
├── politicians/
│   ├── page.tsx                # Politicians listing
│   └── [slug]/page.tsx         # Individual politician page
│
├── promises/
│   ├── page.tsx                # Promises listing with filters
│   ├── new/page.tsx            # Create new promise (auth)
│   └── [id]/page.tsx           # Promise detail page
│
├── verifications/
│   ├── new/page.tsx            # Submit verification (auth)
│   └── [id]/page.tsx           # Verification detail with hash
│
├── admin/                      # Admin panel (AdminGuard protected)
│   ├── page.tsx                # Admin dashboard
│   ├── verifications/page.tsx  # Review pending verifications
│   ├── users/page.tsx          # User management
│   ├── bans/page.tsx           # Ban management & appeals
│   ├── fraud/page.tsx          # Fraud detection dashboard
│   ├── flags/page.tsx          # Flagged accounts review
│   ├── vote-patterns/page.tsx  # Vote pattern analysis
│   ├── reputation/page.tsx     # Reputation rules config
│   ├── auto-approval/page.tsx  # Auto-approval settings
│   ├── audit/page.tsx          # Admin action audit log
│   └── reports/page.tsx        # Platform reports
│
└── api/                        # API routes
    └── feedback/route.ts       # Feedback submission API
```

### Page Categories

#### Public Pages (No Auth Required)
| Route | Description |
|-------|-------------|
| `/` | Landing page with platform overview |
| `/about` | About the platform and mission |
| `/contact` | Contact form with feedback submission |
| `/guidelines` | Community guidelines and rules |
| `/how-it-works` | Step-by-step platform guide |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/transparency` | Public admin action log |
| `/leaderboard` | Top citizens by score |
| `/politicians` | All politicians with stats |
| `/politicians/[slug]` | Individual politician profile |
| `/promises` | Browse all promises |
| `/promises/[id]` | Promise detail with verifications |
| `/verifications/[id]` | Verification detail with hash integrity |
| `/profile/[username]` | Public user profile |

#### Auth Required Pages
| Route | Description |
|-------|-------------|
| `/dashboard` | User's personal dashboard |
| `/profile` | Redirects to user's own profile |
| `/promises/new` | Create a new promise |
| `/verifications/new` | Submit a verification |

#### Admin Pages (AdminGuard Protected)
| Route | Min Level | Description |
|-------|-----------|-------------|
| `/admin` | 1 (Reviewer) | Admin dashboard overview |
| `/admin/verifications` | 1 | Review pending verifications |
| `/admin/users` | 2 (Moderator) | User management |
| `/admin/bans` | 2 | Ban management and appeals |
| `/admin/flags` | 2 | Review flagged accounts |
| `/admin/fraud` | 2 | Fraud detection dashboard |
| `/admin/vote-patterns` | 2 | Vote pattern analysis |
| `/admin/reputation` | 3 (SuperAdmin) | Configure reputation rules |
| `/admin/auto-approval` | 3 | Auto-approval settings |
| `/admin/audit` | 2 | Admin action audit log |
| `/admin/reports` | 2 | Platform analytics |

### Special Pages

#### error.tsx (Global Error Boundary)
Catches unhandled errors in the app:
- Shows friendly error message
- Provides "Try Again" button (calls `reset()`)
- Shows error details in development mode
- Links back to home page

#### not-found.tsx (404 Page)
Custom 404 page:
- Search functionality to find content
- Quick links to popular pages
- Helpful suggestions

#### layout.tsx (Root Layout)
Wraps all pages with:
- `<Header />` component
- `<Footer />` component
- Toast provider (`<Toaster />`)
- Global styles and fonts

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/feedback` | POST | Submit user feedback |
| `/auth/callback` | GET | Supabase auth callback handler |

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Frontend Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  Pages/App  │  │ Components  │  │   Hooks     │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         │                │                │                         │
│         └────────────────┼────────────────┘                         │
│                          ▼                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      Lib Layer                               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │   │
│  │  │adminAuth.ts │  │fraudDetect  │  │reputation   │         │   │
│  │  │moderActions │  │votePatterns │  │banManage    │         │   │
│  │  │autoApproval │  │politicians  │  │searchProm   │         │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │   │
│  │         │                │                │                 │   │
│  │         └────────────────┼────────────────┘                 │   │
│  │                          ▼                                  │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │  supabase.ts (client) / supabase-server.ts (server) │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Supabase Backend                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  PostgreSQL │  │    Auth     │  │   Storage   │                 │
│  │  + RLS      │  │   (JWT)     │  │  (Files)    │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │            Database Functions (RPC)                          │   │
│  │  approve_verification, reject_verification, ban_user,        │   │
│  │  run_fraud_detection, apply_reputation_decay, etc.           │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

### Authentication Flow
1. User logs in via Supabase Auth
2. JWT token stored in cookies
3. Server components use `supabase-server.ts` for authenticated requests
4. Client components use `supabase.ts` with auto-refresh

### Authorization Layers
1. **Database RLS**: Row-Level Security policies enforce data access
2. **Admin Functions**: `adminAuth.ts` verifies admin level/permissions
3. **Database Functions**: RPC functions verify caller permissions

### Anti-Gaming Protection
- Self-verification prevention (database trigger)
- Self-voting prevention (database trigger)
- Vote brigade detection (`votePatterns.ts`)
- Fraud flag auto-detection (`fraudDetection.ts`)
- Trust level weighting (database calculation)

---

## Error Handling Patterns

All lib functions follow consistent error handling:

```typescript
// Success/Error return pattern
async function someAction(): Promise<{ success: boolean; error?: string }> {
  try {
    // ... operation
    return { success: true }
  } catch (error) {
    console.error('Error in someAction:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Data/Error return pattern
async function getData(): Promise<{ data: T[] | null; error: any }> {
  try {
    const { data, error } = await supabase.from('table').select()
    if (error) return { data: null, error }
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
```

---

## Testing

To test lib functions:

```typescript
// Example test for searchPromises
import { searchPromises } from '@/lib/searchPromises'

describe('searchPromises', () => {
  it('should filter by status', async () => {
    const result = await searchPromises({ status: ['fulfilled'] })
    expect(result.promises).toBeDefined()
    result.promises.forEach(p => expect(p.status).toBe('fulfilled'))
  })
})
```

---

## Contributing

When adding new lib files:

1. Create TypeScript interfaces for all data structures
2. Export clear, single-purpose functions
3. Use consistent error handling patterns
4. Document database functions/tables used
5. Add JSDoc comments for complex functions
6. Update this documentation

---

## Related Documentation

- [TECH_STACK.md](../TECH_STACK.md) - Technology stack overview
- [NEXT_PHASES.md](../NEXT_PHASES.md) - Development roadmap
- [database/README.md](../database/README.md) - Database migrations
