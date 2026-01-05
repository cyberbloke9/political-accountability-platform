# adminActions.ts

## Overview

The `adminActions.ts` file provides comprehensive admin action logging, querying, and analytics for the political accountability platform. It serves as the audit trail system for all administrative operations, enabling transparency, accountability, and analysis of moderation activities.

This module is essential for monitoring admin behavior, generating moderation reports, and ensuring all administrative actions are properly documented.

## Dependencies

| Module | Purpose |
|--------|---------|
| `./supabase` | Provides the Supabase client instance for database operations |

## Interfaces

### `AdminAction`

Represents a single logged administrative action.

```typescript
interface AdminAction {
  id: string                        // Unique action ID
  action_type: string               // Type of action performed
  target_type: string               // Type of entity affected
  target_id: string                 // ID of the affected entity
  admin_id: string                  // ID of admin who performed action
  reason: string | null             // Optional reason for the action
  metadata: Record<string, any> | null  // Additional action details
  created_at: string                // When the action was performed
  admin?: {                         // Joined admin user data
    username: string
    id: string
  }
}
```

### `AdminActionFilters`

Filter options for querying admin actions.

```typescript
interface AdminActionFilters {
  action_type?: string    // Filter by specific action type
  admin_id?: string       // Filter by specific admin
  target_type?: string    // Filter by target entity type
  search?: string         // Text search in reason/action_type
  start_date?: string     // Start of date range (ISO string)
  end_date?: string       // End of date range (ISO string)
  limit?: number          // Maximum results to return
  offset?: number         // Pagination offset
}
```

### `AdminActionStats`

Aggregated statistics about admin actions.

```typescript
interface AdminActionStats {
  totalActions: number              // All-time action count
  todayActions: number              // Actions performed today
  approvedToday: number             // Verifications approved today
  rejectedToday: number             // Verifications rejected today
  fraudFlagsToday: number           // Fraud flags raised today
  topAdmins: Array<{                // Most active admins
    admin_id: string
    username: string
    action_count: number
  }>
  actionsByType: Record<string, number>  // Counts by action type
}
```

## Exported Functions

### `getAdminActions(filters?: AdminActionFilters): Promise<Result>`

Retrieves admin actions with optional filtering and pagination.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `filters` | `AdminActionFilters` | Optional filter criteria |

#### Return Type

```typescript
Promise<{
  data: AdminAction[] | null
  error: any
  count: number              // Total matching records
}>
```

#### Query Features

- Joins with `users` table to include admin username
- Supports text search across `reason` and `action_type`
- Date range filtering
- Pagination with offset/limit
- Orders by `created_at` descending

---

### `getAdminActionStats(): Promise<AdminActionStats>`

Retrieves comprehensive statistics about admin actions.

#### Parameters

None

#### Return Type

`Promise<AdminActionStats>` - Statistics object with counts and breakdowns.

#### Logic

1. Fetches all actions to count by type
2. Fetches today's actions for daily metrics
3. Counts specific action types for today
4. Calculates top 5 most active admins

---

### `getActionTypeDisplay(actionType: string): string`

Converts internal action type to human-readable display text.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `actionType` | `string` | Internal action type identifier |

#### Return Type

`string` - Human-readable action name.

#### Mappings

| Internal | Display |
|----------|---------|
| `approve_verification` | Approved Verification |
| `reject_verification` | Rejected Verification |
| `flag_fraud` | Flagged Fraud |
| `update_reputation` | Updated Reputation |
| `ban_user` | Banned User |
| `unban_user` | Unbanned User |
| `assign_admin_role` | Assigned Admin Role |
| `remove_admin_role` | Removed Admin Role |
| `auto_approve` | Auto-Approved Verification |

---

### `getTargetTypeDisplay(targetType: string): string`

Converts internal target type to human-readable display text.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `targetType` | `string` | Internal target type identifier |

#### Return Type

`string` - Human-readable target type.

#### Mappings

| Internal | Display |
|----------|---------|
| `verification` | Verification |
| `user` | User |
| `politician` | Politician |
| `admin` | Admin |

---

### `getActionTypeColor(actionType: string): string`

Returns Tailwind CSS classes for styling action types.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `actionType` | `string` | Action type identifier |

#### Return Type

`string` - Tailwind CSS classes for text and background color.

#### Color Mappings

| Action Type | Colors |
|-------------|--------|
| `approve_verification` | Green (text-green-600 bg-green-100) |
| `reject_verification` | Red (text-red-600 bg-red-100) |
| `flag_fraud` | Orange (text-orange-600 bg-orange-100) |
| `update_reputation` | Blue (text-blue-600 bg-blue-100) |
| `ban_user` | Dark Red (text-red-700 bg-red-200) |
| `unban_user` | Dark Green (text-green-700 bg-green-200) |
| `assign_admin_role` | Purple (text-purple-600 bg-purple-100) |
| `remove_admin_role` | Dark Purple (text-purple-700 bg-purple-200) |
| `auto_approve` | Emerald (text-emerald-600 bg-emerald-100) |
| Default | Gray (text-gray-600 bg-gray-100) |

## Usage Examples

### Admin Action Log Viewer

```typescript
import {
  getAdminActions,
  getActionTypeDisplay,
  getActionTypeColor
} from '@/lib/adminActions';

async function AdminActionLog() {
  const { data: actions, count } = await getAdminActions({
    limit: 50
  });

  return (
    <div>
      <h2>Admin Action Log ({count} total)</h2>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Admin</th>
            <th>Action</th>
            <th>Target</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {actions?.map(action => (
            <tr key={action.id}>
              <td>{new Date(action.created_at).toLocaleString()}</td>
              <td>{action.admin?.username}</td>
              <td>
                <span className={`px-2 py-1 rounded ${getActionTypeColor(action.action_type)}`}>
                  {getActionTypeDisplay(action.action_type)}
                </span>
              </td>
              <td>{action.target_type}: {action.target_id}</td>
              <td>{action.reason || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Filtered Action Search

```typescript
import { getAdminActions } from '@/lib/adminActions';
import { useState } from 'react';

function AdminActionSearch() {
  const [filters, setFilters] = useState({
    action_type: '',
    admin_id: '',
    search: '',
    start_date: '',
    end_date: ''
  });
  const [actions, setActions] = useState([]);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  async function search() {
    const { data } = await getAdminActions({
      ...filters,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE
    });
    setActions(data || []);
  }

  return (
    <div>
      <div className="filters grid grid-cols-5 gap-4">
        <select
          value={filters.action_type}
          onChange={(e) => setFilters(f => ({ ...f, action_type: e.target.value }))}
        >
          <option value="">All Actions</option>
          <option value="approve_verification">Approvals</option>
          <option value="reject_verification">Rejections</option>
          <option value="ban_user">Bans</option>
          <option value="flag_fraud">Fraud Flags</option>
        </select>

        <input
          type="text"
          placeholder="Search reasons..."
          value={filters.search}
          onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
        />

        <input
          type="date"
          value={filters.start_date}
          onChange={(e) => setFilters(f => ({ ...f, start_date: e.target.value }))}
        />

        <input
          type="date"
          value={filters.end_date}
          onChange={(e) => setFilters(f => ({ ...f, end_date: e.target.value }))}
        />

        <button onClick={search}>Search</button>
      </div>

      {/* Results display */}
    </div>
  );
}
```

### Statistics Dashboard

```typescript
import { getAdminActionStats } from '@/lib/adminActions';

async function AdminStatsDashboard() {
  const stats = await getAdminActionStats();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Actions" value={stats.totalActions} />
        <StatCard title="Today's Actions" value={stats.todayActions} />
        <StatCard title="Approved Today" value={stats.approvedToday} color="green" />
        <StatCard title="Rejected Today" value={stats.rejectedToday} color="red" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3>Top Admins</h3>
          <ol>
            {stats.topAdmins.map(admin => (
              <li key={admin.admin_id}>
                {admin.username}: {admin.action_count} actions
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h3>Actions by Type</h3>
          <ul>
            {Object.entries(stats.actionsByType).map(([type, count]) => (
              <li key={type}>
                {getActionTypeDisplay(type)}: {count}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
```

### Per-Admin Activity Report

```typescript
import { getAdminActions, getAdminActionStats } from '@/lib/adminActions';

async function AdminActivityReport({ adminId }: { adminId: string }) {
  const { data: actions, count } = await getAdminActions({
    admin_id: adminId,
    limit: 100
  });

  // Group actions by type
  const byType = actions?.reduce((acc, action) => {
    acc[action.action_type] = (acc[action.action_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group by date
  const byDate = actions?.reduce((acc, action) => {
    const date = new Date(action.created_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <h2>Admin Activity Report</h2>
      <p>Total Actions: {count}</p>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3>By Action Type</h3>
          <table>
            <tbody>
              {Object.entries(byType || {}).map(([type, count]) => (
                <tr key={type}>
                  <td>{getActionTypeDisplay(type)}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3>By Date</h3>
          <table>
            <tbody>
              {Object.entries(byDate || {}).slice(0, 7).map(([date, count]) => (
                <tr key={date}>
                  <td>{date}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

### Action Badge Component

```typescript
import { getActionTypeDisplay, getActionTypeColor } from '@/lib/adminActions';

function ActionBadge({ actionType }: { actionType: string }) {
  return (
    <span className={`px-2 py-1 rounded text-sm font-medium ${getActionTypeColor(actionType)}`}>
      {getActionTypeDisplay(actionType)}
    </span>
  );
}

// Usage
<ActionBadge actionType="approve_verification" />
// Renders: Green badge with "Approved Verification"
```

## Database Schema Notes

This module expects:

- **`admin_actions`** table with columns: `id`, `action_type`, `target_type`, `target_id`, `admin_id`, `reason`, `metadata`, `created_at`
- **`users`** table with `id` and `username` for admin user join

## File Location

`C:\Users\Prithvi Putta\Desktop\political-accountability-platform\frontend\src\lib\adminActions.ts`
