# adminAuth.ts

## Overview

The `adminAuth.ts` file provides comprehensive admin authentication and authorization utilities for the political accountability platform. It implements a role-based access control (RBAC) system with multiple admin levels (Reviewer, Moderator, SuperAdmin) and granular permission checking.

This module is essential for protecting administrative features and ensuring users have appropriate access levels for various actions within the platform.

## Dependencies

| Module | Purpose |
|--------|---------|
| `./supabase` | Provides the Supabase client instance for authentication and database queries |

## Interfaces

### `AdminStatus`

Represents the complete admin status of a user including their level, roles, and permissions.

```typescript
interface AdminStatus {
  isAdmin: boolean      // Whether the user has any admin role
  level: number         // Admin level: 0=none, 1=Reviewer, 2=Moderator, 3=SuperAdmin
  roles: string[]       // Array of role names assigned to the user
  permissions: string[] // Array of specific permission strings
}
```

| Property | Type | Description |
|----------|------|-------------|
| `isAdmin` | `boolean` | `true` if user has at least one active admin role |
| `level` | `number` | Numeric level: 0 (regular user), 1 (Reviewer), 2 (Moderator), 3 (SuperAdmin) |
| `roles` | `string[]` | Names of all roles assigned (e.g., `['Reviewer', 'Moderator']`) |
| `permissions` | `string[]` | All permissions from all assigned roles (deduplicated) |

## Exported Functions

### `getAdminStatus(): Promise<AdminStatus>`

Retrieves the complete admin status for the currently authenticated user.

#### Parameters

None

#### Return Type

`Promise<AdminStatus>` - The user's admin status with all roles and permissions.

#### Logic Flow

1. Gets the current authenticated user via Supabase Auth
2. If no user, returns default non-admin status
3. Queries `user_roles` table joined with `admin_roles` and `admin_permissions`
4. Filters for non-expired roles (`expires_at` is null or in the future)
5. Extracts and deduplicates roles and permissions
6. Returns the maximum level among all assigned roles

#### Error Handling

Returns non-admin status on any error (after logging to console).

---

### `hasPermission(permission: string): Promise<boolean>`

Checks if the current user has a specific permission.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `permission` | `string` | The permission string to check (e.g., `'approve_verification'`) |

#### Return Type

`Promise<boolean>` - `true` if user has the permission, `false` otherwise.

---

### `hasMinimumLevel(minLevel: number): Promise<boolean>`

Checks if the current user meets a minimum admin level requirement.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `minLevel` | `number` | The minimum required level (1-3) |

#### Return Type

`Promise<boolean>` - `true` if user's level >= minLevel, `false` otherwise.

---

### `verifyAdminAccess(requiredPermission?: string, minLevel?: number): Promise<VerifyResult>`

Comprehensive server-side function to verify admin access with optional permission and level requirements.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `requiredPermission` | `string` | No | Specific permission required |
| `minLevel` | `number` | No | Minimum admin level required |

#### Return Type

```typescript
Promise<{
  authorized: boolean    // Whether access is granted
  status: AdminStatus    // Full admin status object
  error?: string        // Error message if not authorized
}>
```

#### Logic Flow

1. Retrieves current admin status
2. Checks if user is an admin at all
3. If `minLevel` provided, verifies user meets the level
4. If `requiredPermission` provided, verifies user has it
5. Returns authorization result with detailed error if failed

---

### `getUserAdminLevel(): Promise<number>`

Gets the current user's admin level using a database function for optimal performance.

#### Parameters

None

#### Return Type

`Promise<number>` - The user's admin level (0-3).

#### Implementation Note

Uses the `user_admin_level` Supabase RPC function which runs in the database for better performance and security.

---

### `checkUserPermission(permission: string): Promise<boolean>`

Checks a specific permission using a database function.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `permission` | `string` | The permission to check |

#### Return Type

`Promise<boolean>` - Whether the user has the permission.

#### Implementation Note

Uses the `user_has_permission` Supabase RPC function for server-side permission validation.

## Admin Levels Reference

| Level | Role Name | Typical Permissions |
|-------|-----------|---------------------|
| 0 | Regular User | No admin permissions |
| 1 | Reviewer | View pending verifications, basic moderation |
| 2 | Moderator | Approve/reject verifications, manage content |
| 3 | SuperAdmin | Full access, user management, system configuration |

## Usage Examples

### Basic Admin Check

```typescript
import { getAdminStatus } from '@/lib/adminAuth';

async function checkAccess() {
  const status = await getAdminStatus();

  if (status.isAdmin) {
    console.log(`Admin Level: ${status.level}`);
    console.log(`Roles: ${status.roles.join(', ')}`);
    console.log(`Permissions: ${status.permissions.join(', ')}`);
  } else {
    console.log('Not an admin');
  }
}
```

### Permission-Based UI Rendering

```typescript
import { hasPermission } from '@/lib/adminAuth';

async function AdminPanel() {
  const canApprove = await hasPermission('approve_verification');
  const canBan = await hasPermission('ban_user');

  return (
    <div>
      {canApprove && <ApproveVerificationButton />}
      {canBan && <BanUserButton />}
    </div>
  );
}
```

### Level-Based Access Control

```typescript
import { hasMinimumLevel } from '@/lib/adminAuth';

async function SuperAdminSettings() {
  const isSuperAdmin = await hasMinimumLevel(3);

  if (!isSuperAdmin) {
    return <div>Access Denied: SuperAdmin required</div>;
  }

  return <SuperAdminPanel />;
}
```

### Server Action Protection

```typescript
'use server';

import { verifyAdminAccess } from '@/lib/adminAuth';

export async function approveVerification(verificationId: string) {
  const { authorized, error } = await verifyAdminAccess(
    'approve_verification',  // Required permission
    2                        // Minimum level: Moderator
  );

  if (!authorized) {
    throw new Error(error || 'Not authorized');
  }

  // Proceed with approval logic...
}
```

### API Route Protection

```typescript
import { verifyAdminAccess } from '@/lib/adminAuth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { authorized, status, error } = await verifyAdminAccess('manage_users');

  if (!authorized) {
    return NextResponse.json(
      { error: error || 'Unauthorized' },
      { status: 403 }
    );
  }

  // Log admin action
  console.log(`Admin ${status.roles.join('/')} performing action`);

  // Process request...
}
```

### Conditional Feature Display

```typescript
import { getAdminStatus } from '@/lib/adminAuth';

async function NavigationMenu() {
  const adminStatus = await getAdminStatus();

  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/promises">Promises</Link>

      {adminStatus.level >= 1 && (
        <Link href="/admin/queue">Verification Queue</Link>
      )}

      {adminStatus.level >= 2 && (
        <Link href="/admin/moderation">Moderation</Link>
      )}

      {adminStatus.level >= 3 && (
        <Link href="/admin/settings">System Settings</Link>
      )}
    </nav>
  );
}
```

### Performance-Optimized Permission Check

```typescript
import { checkUserPermission } from '@/lib/adminAuth';

// This uses a database function for better performance
async function canUserPerformAction(action: string) {
  const permissionMap: Record<string, string> = {
    'approve': 'approve_verification',
    'reject': 'reject_verification',
    'ban': 'ban_user',
    'unban': 'unban_user'
  };

  const permission = permissionMap[action];
  if (!permission) return false;

  return await checkUserPermission(permission);
}
```

## Database Schema Notes

This module expects the following database structure:

- **`users`** table with `id` and `auth_id` columns
- **`user_roles`** junction table with `user_id`, `role_id`, `expires_at`
- **`admin_roles`** table with `id`, `name`, `level`
- **`admin_permissions`** table with `role_id`, `permission`
- **RPC functions**: `user_admin_level(user_auth_id)`, `user_has_permission(user_auth_id, required_permission)`

## File Location

`C:\Users\Prithvi Putta\Desktop\political-accountability-platform\frontend\src\lib\adminAuth.ts`
