# useAdmin Hook

## Overview

The `useAdmin` hook provides comprehensive administrative role and permission checking functionality for the political accountability platform. It integrates with the authentication system to determine a user's admin status, level, roles, and specific permissions. The hook is reactive to authentication state changes and provides convenient methods for permission verification, making it essential for implementing role-based access control (RBAC) throughout the application.

## File Location

`C:\Users\Prithvi Putta\Desktop\political-accountability-platform\frontend\src\hooks\useAdmin.ts`

## Dependencies

- `react` - useState and useEffect hooks
- `@/lib/adminAuth` - `getAdminStatus` function and `AdminStatus` type
- `./useAuth` - Authentication hook for user state

## Interfaces

### AdminStatus (imported)

Represents the administrative status of a user:

```typescript
interface AdminStatus {
  isAdmin: boolean      // Whether the user has any admin privileges
  level: number         // Numeric admin level (0 = none, 1+ = admin tiers)
  roles: string[]       // Array of role names assigned to the user
  permissions: string[] // Array of specific permissions granted
}
```

## Parameters

This hook takes no parameters.

## Return Values

| Property | Type | Description |
|----------|------|-------------|
| `isAdmin` | `boolean` | Whether the user has any admin privileges |
| `level` | `number` | Numeric admin level |
| `roles` | `string[]` | Array of assigned role names |
| `permissions` | `string[]` | Array of granted permissions |
| `loading` | `boolean` | True while admin status is being determined |
| `hasPermission` | `(permission: string) => boolean` | Check for a specific permission |
| `hasAnyPermission` | `(permissions: string[]) => boolean` | Check for any of the given permissions |
| `hasAllPermissions` | `(permissions: string[]) => boolean` | Check for all given permissions |
| `hasMinimumLevel` | `(minLevel: number) => boolean` | Check if user meets minimum level |
| `hasRole` | `(roleName: string) => boolean` | Check for a specific role |
| `isReviewer` | `boolean` | Convenience flag: level >= 1 |
| `isModerator` | `boolean` | Convenience flag: level >= 2 |
| `isSuperAdmin` | `boolean` | Convenience flag: level >= 3 |

## State Management

The hook maintains two pieces of state:

```typescript
const [adminStatus, setAdminStatus] = useState<AdminStatus>({
  isAdmin: false,
  level: 0,
  roles: [],
  permissions: []
})
const [loading, setLoading] = useState(true)
```

### State Lifecycle

1. **Initial**: `loading: true`, default non-admin status
2. **Auth Loading**: Waits for `useAuth` to complete
3. **No User**: Sets non-admin status, `loading: false`
4. **User Authenticated**: Fetches admin status, updates state, `loading: false`
5. **User Changes**: Re-checks admin status

### Default Non-Admin Status

```typescript
{ isAdmin: false, level: 0, roles: [], permissions: [] }
```

## Admin Level Hierarchy

The platform uses a numeric level system for admin privileges:

| Level | Role | Description |
|-------|------|-------------|
| 0 | Regular User | No admin privileges |
| 1 | Reviewer | Can review content, basic moderation |
| 2 | Moderator | Full moderation capabilities |
| 3+ | Super Admin | Full platform administration |

## Functions

### hasPermission

Checks if the user has a specific permission.

**Parameters:**
- `permission: string` - The permission identifier to check

**Returns:** `boolean`

**Implementation:**
```typescript
const hasPermission = (permission: string): boolean => {
  return adminStatus.permissions.includes(permission)
}
```

### hasAnyPermission

Checks if the user has at least one of the specified permissions.

**Parameters:**
- `permissions: string[]` - Array of permission identifiers

**Returns:** `boolean` - True if user has ANY of the permissions

**Implementation:**
```typescript
const hasAnyPermission = (permissions: string[]): boolean => {
  return permissions.some(p => adminStatus.permissions.includes(p))
}
```

### hasAllPermissions

Checks if the user has all of the specified permissions.

**Parameters:**
- `permissions: string[]` - Array of permission identifiers

**Returns:** `boolean` - True if user has ALL of the permissions

**Implementation:**
```typescript
const hasAllPermissions = (permissions: string[]): boolean => {
  return permissions.every(p => adminStatus.permissions.includes(p))
}
```

### hasMinimumLevel

Checks if the user meets a minimum admin level requirement.

**Parameters:**
- `minLevel: number` - The minimum required level

**Returns:** `boolean`

**Implementation:**
```typescript
const hasMinimumLevel = (minLevel: number): boolean => {
  return adminStatus.level >= minLevel
}
```

### hasRole

Checks if the user has a specific role assigned.

**Parameters:**
- `roleName: string` - The role name to check

**Returns:** `boolean`

**Implementation:**
```typescript
const hasRole = (roleName: string): boolean => {
  return adminStatus.roles.includes(roleName)
}
```

## Side Effects

### Admin Status Check

The hook fetches admin status when the user changes:

```typescript
useEffect(() => {
  async function checkAdmin() {
    if (authLoading) return

    if (!user) {
      setAdminStatus({ isAdmin: false, level: 0, roles: [], permissions: [] })
      setLoading(false)
      return
    }

    const status = await getAdminStatus()
    setAdminStatus(status)
    setLoading(false)
  }

  checkAdmin()
}, [user, authLoading])
```

### Dependencies

- `user` - Re-checks when user changes (login/logout)
- `authLoading` - Waits for auth to complete before checking

## Convenience Flags

The hook provides pre-computed boolean flags for common role checks:

```typescript
isReviewer: adminStatus.level >= 1,
isModerator: adminStatus.level >= 2,
isSuperAdmin: adminStatus.level >= 3
```

## Usage Examples

### Protected Admin Component

```tsx
import { useAdmin } from '@/hooks/useAdmin'

function AdminDashboard() {
  const { isAdmin, loading } = useAdmin()

  if (loading) return <div>Loading...</div>

  if (!isAdmin) {
    return <div>Access denied. Admin privileges required.</div>
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      {/* Admin content */}
    </div>
  )
}
```

### Level-Based Access Control

```tsx
import { useAdmin } from '@/hooks/useAdmin'

function ModerationPanel() {
  const { isModerator, isReviewer, loading } = useAdmin()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {isReviewer && (
        <section>
          <h2>Review Queue</h2>
          {/* Reviewer-level features */}
        </section>
      )}

      {isModerator && (
        <section>
          <h2>Moderation Tools</h2>
          {/* Moderator-level features */}
        </section>
      )}
    </div>
  )
}
```

### Permission-Based UI Rendering

```tsx
import { useAdmin } from '@/hooks/useAdmin'

function ContentActions({ contentId }: { contentId: string }) {
  const { hasPermission, hasAnyPermission } = useAdmin()

  return (
    <div className="actions">
      {hasPermission('content:view') && (
        <button>View Details</button>
      )}

      {hasPermission('content:edit') && (
        <button>Edit</button>
      )}

      {hasPermission('content:delete') && (
        <button className="danger">Delete</button>
      )}

      {hasAnyPermission(['content:approve', 'content:reject']) && (
        <div className="moderation-actions">
          <button>Approve</button>
          <button>Reject</button>
        </div>
      )}
    </div>
  )
}
```

### Role-Based Navigation

```tsx
import { useAdmin } from '@/hooks/useAdmin'
import Link from 'next/link'

function AdminNavigation() {
  const { isAdmin, hasRole, isSuperAdmin, loading } = useAdmin()

  if (loading || !isAdmin) return null

  return (
    <nav className="admin-nav">
      <Link href="/admin">Dashboard</Link>

      {hasRole('content_manager') && (
        <Link href="/admin/content">Content Management</Link>
      )}

      {hasRole('user_manager') && (
        <Link href="/admin/users">User Management</Link>
      )}

      {isSuperAdmin && (
        <>
          <Link href="/admin/settings">System Settings</Link>
          <Link href="/admin/roles">Role Management</Link>
        </>
      )}
    </nav>
  )
}
```

### Conditional API Calls

```tsx
import { useAdmin } from '@/hooks/useAdmin'
import { useState } from 'react'

function UserManagement() {
  const { hasAllPermissions, loading } = useAdmin()
  const [users, setUsers] = useState([])

  const canManageUsers = hasAllPermissions(['users:list', 'users:edit'])

  const handleBanUser = async (userId: string) => {
    if (!hasAllPermissions(['users:edit', 'users:ban'])) {
      alert('Insufficient permissions')
      return
    }

    await banUser(userId)
    // Refresh list
  }

  if (loading) return <div>Loading...</div>

  if (!canManageUsers) {
    return <div>You do not have permission to manage users.</div>
  }

  return (
    <div>
      <h1>User Management</h1>
      {/* User list with ban functionality */}
    </div>
  )
}
```

### Minimum Level Guard

```tsx
import { useAdmin } from '@/hooks/useAdmin'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

function SuperAdminPage({ children }: { children: React.ReactNode }) {
  const { hasMinimumLevel, loading } = useAdmin()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !hasMinimumLevel(3)) {
      router.push('/unauthorized')
    }
  }, [loading, hasMinimumLevel, router])

  if (loading) return <div>Checking permissions...</div>

  if (!hasMinimumLevel(3)) {
    return null // Will redirect
  }

  return <>{children}</>
}
```

### Admin Badge Display

```tsx
import { useAdmin } from '@/hooks/useAdmin'

function UserBadge() {
  const { isAdmin, level, isSuperAdmin, isModerator, isReviewer, roles } = useAdmin()

  if (!isAdmin) return null

  const badgeClass = isSuperAdmin
    ? 'badge-super-admin'
    : isModerator
    ? 'badge-moderator'
    : 'badge-reviewer'

  const badgeText = isSuperAdmin
    ? 'Super Admin'
    : isModerator
    ? 'Moderator'
    : 'Reviewer'

  return (
    <div className={`admin-badge ${badgeClass}`}>
      <span>{badgeText}</span>
      <span className="level">Level {level}</span>
      {roles.length > 0 && (
        <span className="roles">{roles.join(', ')}</span>
      )}
    </div>
  )
}
```

### Combined Auth and Admin Check

```tsx
import { useAdmin } from '@/hooks/useAdmin'
import { useAuth } from '@/hooks/useAuth'

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()

  const loading = authLoading || adminLoading

  if (loading) {
    return <div>Verifying access...</div>
  }

  if (!isAuthenticated) {
    return <div>Please log in to continue.</div>
  }

  if (!isAdmin) {
    return <div>Admin access required.</div>
  }

  return <>{children}</>
}
```

## Error Handling

The hook relies on `getAdminStatus()` for error handling. If the function fails:
- The hook maintains the default non-admin state
- The loading state completes normally
- No error is exposed to the consumer

For robust error handling, consider wrapping with try-catch:

```tsx
const { isAdmin } = useAdmin()

// Safe to use - defaults to false if check fails
if (isAdmin) {
  // Show admin content
}
```

## Performance Considerations

1. **Dependency on useAuth**: Avoids redundant checks by waiting for auth
2. **Single Check per User**: Only re-checks when user changes
3. **Memoized Functions**: Helper functions are stable references
4. **No Subscriptions**: Unlike real-time hooks, this makes a single check

## Notes

- The hook uses the `'use client'` directive for Next.js client-side rendering
- Admin status is checked asynchronously via `getAdminStatus()`
- The hook depends on `useAuth` for user state
- Role and permission strings should be consistent with backend definitions
- Loading state reflects both auth and admin status loading
- The hook is designed to fail safely - defaults to non-admin if checks fail
- Multiple components can use this hook without redundant API calls (Supabase handles caching)
- The convenience flags (`isReviewer`, `isModerator`, `isSuperAdmin`) provide quick tier checks
