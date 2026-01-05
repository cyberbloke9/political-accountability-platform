# banManagement.ts

## Overview

The `banManagement.ts` file provides comprehensive user ban management functionality for the political accountability platform. It handles the complete lifecycle of user bans including creating, querying, and lifting bans, as well as managing ban appeals from banned users.

This module is critical for platform moderation, allowing admins to temporarily or permanently restrict users who violate platform policies, while also providing a structured appeals process.

## Dependencies

| Module | Purpose |
|--------|---------|
| `./supabase` | Provides the Supabase client instance for database operations |

## Interfaces

### `Ban`

Represents a user ban record with full details.

```typescript
interface Ban {
  id: string                     // Unique ban ID
  user_id: string                // Banned user's ID
  banned_by: string              // Admin who issued the ban
  reason: string                 // Reason for the ban
  ban_type: 'temporary' | 'permanent'  // Type of ban
  banned_at: string              // When the ban was issued
  expires_at: string | null      // Expiration date (null for permanent)
  is_active: boolean             // Whether ban is currently active
  unbanned_at: string | null     // When user was unbanned (if applicable)
  unbanned_by: string | null     // Admin who lifted the ban
  unban_reason: string | null    // Reason for lifting the ban
  metadata: Record<string, any>  // Additional ban context
  user?: {                       // Joined user data
    id: string
    username: string
    email: string
  }
  banner?: {                     // Admin who banned
    id: string
    username: string
  }
  unbanner?: {                   // Admin who unbanned
    id: string
    username: string
  }
}
```

### `BanAppeal`

Represents a user's appeal against their ban.

```typescript
interface BanAppeal {
  id: string                         // Appeal ID
  ban_id: string                     // Associated ban ID
  user_id: string                    // User who appealed
  appeal_reason: string              // User's appeal message
  status: 'pending' | 'approved' | 'rejected'  // Appeal status
  reviewed_by: string | null         // Admin who reviewed
  review_reason: string | null       // Admin's review notes
  created_at: string                 // When appeal was submitted
  reviewed_at: string | null         // When appeal was reviewed
  user?: {                           // Joined user data
    id: string
    username: string
  }
  reviewer?: {                       // Admin reviewer data
    id: string
    username: string
  }
  ban?: Ban                          // Joined ban data
}
```

### `BanStats`

Aggregated ban statistics for the platform.

```typescript
interface BanStats {
  totalBans: number        // All-time total bans
  activeBans: number       // Currently active bans
  temporaryBans: number    // Temporary ban count
  permanentBans: number    // Permanent ban count
  expiredBans: number      // Expired temporary bans
  pendingAppeals: number   // Appeals awaiting review
  approvedAppeals: number  // Appeals that were granted
  rejectedAppeals: number  // Appeals that were denied
}
```

## Exported Functions

### `isUserBanned(userId: string): Promise<Result>`

Checks if a specific user is currently banned.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `userId` | `string` | User ID to check |

#### Return Type

```typescript
Promise<{
  banned: boolean      // Whether user is currently banned
  ban?: Ban           // Ban details if banned
  error?: string      // Error message if failed
}>
```

#### Logic

1. Calls `is_user_banned` RPC function
2. If banned, fetches full ban details with joins

---

### `getBans(filters?: BanFilters): Promise<Result>`

Retrieves bans with optional filtering.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `filters.is_active` | `boolean` | Filter by active status |
| `filters.ban_type` | `string` | Filter by ban type |
| `filters.user_id` | `string` | Filter by specific user |
| `filters.limit` | `number` | Maximum results (default 100) |

#### Return Type

```typescript
Promise<{
  data: Ban[] | null
  error?: string
  count: number
}>
```

---

### `banUser(params: BanParams): Promise<Result>`

Issues a new ban on a user.

#### Parameters

```typescript
{
  userId: string              // User to ban
  adminId: string             // Admin issuing ban
  reason: string              // Reason for ban
  banType: 'temporary' | 'permanent'  // Type of ban
  durationDays?: number       // Duration for temporary bans
}
```

#### Return Type

```typescript
Promise<{
  success: boolean
  banId?: string     // ID of created ban
  error?: string
}>
```

#### Implementation

Uses the `ban_user` RPC function which handles:
- Creating the ban record
- Logging the admin action
- Sending notification to user
- Updating user status

---

### `unbanUser(params: UnbanParams): Promise<Result>`

Lifts an active ban on a user.

#### Parameters

```typescript
{
  userId: string     // User to unban
  adminId: string    // Admin lifting ban
  reason: string     // Reason for unban
}
```

#### Return Type

```typescript
Promise<{
  success: boolean
  error?: string
}>
```

---

### `getBanStats(): Promise<BanStats>`

Retrieves comprehensive ban statistics.

#### Parameters

None

#### Return Type

`Promise<BanStats>` - Statistics object.

---

### `getBanAppeals(filters?: AppealFilters): Promise<Result>`

Retrieves ban appeals with optional filtering.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `filters.status` | `string` | Filter by appeal status |
| `filters.user_id` | `string` | Filter by user |
| `filters.limit` | `number` | Maximum results (default 50) |

#### Return Type

```typescript
Promise<{
  data: BanAppeal[] | null
  error?: string
  count: number
}>
```

---

### `createBanAppeal(params: AppealParams): Promise<Result>`

Creates a new ban appeal for a banned user.

#### Parameters

```typescript
{
  banId: string         // Ban being appealed
  userId: string        // User creating appeal
  appealReason: string  // Appeal message
}
```

#### Return Type

```typescript
Promise<{
  success: boolean
  appealId?: string   // ID of created appeal
  error?: string
}>
```

---

### `reviewBanAppeal(params: ReviewParams): Promise<Result>`

Reviews and decides on a ban appeal.

#### Parameters

```typescript
{
  appealId: string                    // Appeal to review
  adminId: string                     // Admin reviewing
  status: 'approved' | 'rejected'     // Decision
  reviewReason: string                // Admin's notes
}
```

#### Return Type

```typescript
Promise<{
  success: boolean
  error?: string
}>
```

---

### `expireTemporaryBans(): Promise<Result>`

Automatically expires temporary bans that have passed their end date.

#### Parameters

None

#### Return Type

```typescript
Promise<{
  success: boolean
  error?: string
}>
```

#### Note

This should be run periodically (e.g., via cron job).

---

### `getBanDurationDisplay(ban: Ban): string`

Formats ban duration for display.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `ban` | `Ban` | Ban object to format |

#### Return Type

`string` - Human-readable duration string.

#### Examples

| Ban State | Output |
|-----------|--------|
| Permanent | "Permanent" |
| No expiry date | "Unknown" |
| Expired | "Expired" |
| 1 day remaining | "1 day remaining" |
| N days remaining | "N days remaining" |

---

### `getBanTypeColor(banType: string): string`

Returns Tailwind CSS classes for ban type styling.

#### Mappings

| Type | Colors |
|------|--------|
| `permanent` | text-red-700 bg-red-200 |
| `temporary` | text-orange-600 bg-orange-100 |

---

### `getBanStatusColor(isActive: boolean): string`

Returns Tailwind CSS classes for ban status styling.

#### Mappings

| Status | Colors |
|--------|--------|
| Active | text-red-600 bg-red-100 |
| Inactive | text-gray-600 bg-gray-100 |

---

### `getAppealStatusColor(status: string): string`

Returns Tailwind CSS classes for appeal status styling.

#### Mappings

| Status | Colors |
|--------|--------|
| `pending` | text-yellow-600 bg-yellow-100 |
| `approved` | text-green-600 bg-green-100 |
| `rejected` | text-red-600 bg-red-100 |

## Usage Examples

### Ban User Dialog

```typescript
import { banUser } from '@/lib/banManagement';
import { useState } from 'react';

function BanUserDialog({ userId, adminId, onComplete }: Props) {
  const [reason, setReason] = useState('');
  const [banType, setBanType] = useState<'temporary' | 'permanent'>('temporary');
  const [duration, setDuration] = useState(7);
  const [loading, setLoading] = useState(false);

  async function handleBan() {
    setLoading(true);
    try {
      const result = await banUser({
        userId,
        adminId,
        reason,
        banType,
        durationDays: banType === 'temporary' ? duration : undefined
      });

      if (result.success) {
        onComplete(result.banId);
      } else {
        alert(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h2>Ban User</h2>

      <div className="space-y-4">
        <div>
          <label>Ban Type</label>
          <select value={banType} onChange={(e) => setBanType(e.target.value as any)}>
            <option value="temporary">Temporary</option>
            <option value="permanent">Permanent</option>
          </select>
        </div>

        {banType === 'temporary' && (
          <div>
            <label>Duration (days)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              min={1}
              max={365}
            />
          </div>
        )}

        <div>
          <label>Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this user is being banned..."
            required
          />
        </div>

        <button onClick={handleBan} disabled={loading || !reason}>
          {loading ? 'Processing...' : 'Issue Ban'}
        </button>
      </div>
    </div>
  );
}
```

### Ban List Management

```typescript
import {
  getBans,
  unbanUser,
  getBanDurationDisplay,
  getBanTypeColor,
  getBanStatusColor
} from '@/lib/banManagement';

async function BanManagementPanel({ adminId }: { adminId: string }) {
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('active');

  const { data: bans } = await getBans({
    is_active: filter === 'active' ? true : filter === 'expired' ? false : undefined,
    limit: 50
  });

  async function handleUnban(userId: string) {
    const reason = prompt('Enter reason for unbanning:');
    if (!reason) return;

    const result = await unbanUser({
      userId,
      adminId,
      reason
    });

    if (result.success) {
      // Refresh list
    }
  }

  return (
    <div>
      <div className="tabs">
        <button onClick={() => setFilter('active')}>Active Bans</button>
        <button onClick={() => setFilter('expired')}>Expired</button>
        <button onClick={() => setFilter('all')}>All</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Type</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Banned By</th>
            <th>Reason</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bans?.map(ban => (
            <tr key={ban.id}>
              <td>{ban.user?.username}</td>
              <td>
                <span className={`px-2 py-1 rounded ${getBanTypeColor(ban.ban_type)}`}>
                  {ban.ban_type}
                </span>
              </td>
              <td>
                <span className={`px-2 py-1 rounded ${getBanStatusColor(ban.is_active)}`}>
                  {ban.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>{getBanDurationDisplay(ban)}</td>
              <td>{ban.banner?.username}</td>
              <td>{ban.reason}</td>
              <td>
                {ban.is_active && (
                  <button onClick={() => handleUnban(ban.user_id)}>
                    Unban
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Ban Appeals Queue

```typescript
import {
  getBanAppeals,
  reviewBanAppeal,
  getAppealStatusColor
} from '@/lib/banManagement';

async function AppealsQueue({ adminId }: { adminId: string }) {
  const { data: appeals } = await getBanAppeals({
    status: 'pending'
  });

  async function handleReview(appealId: string, decision: 'approved' | 'rejected') {
    const reviewReason = prompt(
      decision === 'approved'
        ? 'Why is this appeal being granted?'
        : 'Why is this appeal being denied?'
    );
    if (!reviewReason) return;

    const result = await reviewBanAppeal({
      appealId,
      adminId,
      status: decision,
      reviewReason
    });

    if (result.success) {
      // If approved, the user should be automatically unbanned
      // Refresh the list
    }
  }

  return (
    <div>
      <h2>Pending Ban Appeals ({appeals?.length})</h2>

      {appeals?.map(appeal => (
        <div key={appeal.id} className="border p-4 rounded mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h3>{appeal.user?.username}</h3>
              <p className="text-gray-600">
                Banned for: {appeal.ban?.reason}
              </p>
            </div>
            <span className={`px-2 py-1 rounded ${getAppealStatusColor(appeal.status)}`}>
              {appeal.status}
            </span>
          </div>

          <div className="mt-4">
            <h4>Appeal Message:</h4>
            <p className="bg-gray-50 p-2 rounded">{appeal.appeal_reason}</p>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleReview(appeal.id, 'approved')}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Approve Appeal
            </button>
            <button
              onClick={() => handleReview(appeal.id, 'rejected')}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Deny Appeal
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Ban Statistics Dashboard

```typescript
import { getBanStats } from '@/lib/banManagement';

async function BanStatsDashboard() {
  const stats = await getBanStats();

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard title="Total Bans" value={stats.totalBans} />
      <StatCard title="Active Bans" value={stats.activeBans} color="red" />
      <StatCard title="Temporary" value={stats.temporaryBans} color="orange" />
      <StatCard title="Permanent" value={stats.permanentBans} color="red" />
      <StatCard title="Expired" value={stats.expiredBans} color="gray" />
      <StatCard title="Pending Appeals" value={stats.pendingAppeals} color="yellow" />
      <StatCard title="Approved Appeals" value={stats.approvedAppeals} color="green" />
      <StatCard title="Rejected Appeals" value={stats.rejectedAppeals} color="red" />
    </div>
  );
}
```

### User Ban Check (For Blocking Access)

```typescript
import { isUserBanned } from '@/lib/banManagement';
import { redirect } from 'next/navigation';

async function ProtectedPage({ userId }: { userId: string }) {
  const { banned, ban } = await isUserBanned(userId);

  if (banned) {
    // Show ban notice
    return (
      <div className="text-center p-8">
        <h1>Account Suspended</h1>
        <p>Your account has been {ban?.ban_type === 'permanent' ? 'permanently' : 'temporarily'} suspended.</p>
        <p><strong>Reason:</strong> {ban?.reason}</p>
        {ban?.expires_at && (
          <p>Ban expires: {new Date(ban.expires_at).toLocaleDateString()}</p>
        )}
        <Link href="/appeal">Submit Appeal</Link>
      </div>
    );
  }

  return <ActualPageContent />;
}
```

## Database Schema Notes

This module expects:

- **`bans`** table with ban records
- **`ban_appeals`** table for appeals
- **`users`** table for user joins
- **RPC functions**:
  - `is_user_banned(check_user_id)` - Checks active ban status
  - `ban_user(target_user_id, admin_user_id, ban_reason, duration_type, ban_duration_days)` - Creates ban
  - `unban_user(target_user_id, admin_user_id, unban_reason_text)` - Lifts ban
  - `expire_temporary_bans()` - Auto-expires old temporary bans

## File Location

`C:\Users\Prithvi Putta\Desktop\political-accountability-platform\frontend\src\lib\banManagement.ts`
