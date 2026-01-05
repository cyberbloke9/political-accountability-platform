# 011_ban_management_system.sql

## Overview
Implements a comprehensive ban management system with support for temporary and permanent bans, user appeals, and full audit trails. Provides both database-level functions and RLS policies for secure ban operations.

## Tables Created

### `bans`
Main ban records table.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to banned user |
| banned_by | UUID | FK to admin who banned |
| reason | TEXT | Ban reason (required) |
| ban_type | VARCHAR(20) | 'temporary' or 'permanent' |
| banned_at | TIMESTAMP | When ban started |
| expires_at | TIMESTAMP | When ban expires (temp only) |
| is_active | BOOLEAN | Is ban currently active? |
| unbanned_at | TIMESTAMP | When unbanned (if applicable) |
| unbanned_by | UUID | FK to admin who unbanned |
| unban_reason | TEXT | Reason for unbanning |
| metadata | JSONB | Additional context |

**Constraints:**
- `valid_ban_duration`: Permanent bans have no expiry, temporary have future expiry
- `active_ban_check`: Active bans have no unban date, inactive have one

### `ban_appeals`
User appeals against bans.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| ban_id | UUID | FK to bans |
| user_id | UUID | FK to appealing user |
| appeal_reason | TEXT | User's appeal text |
| status | VARCHAR(20) | 'pending', 'approved', 'rejected' |
| reviewed_by | UUID | FK to reviewing admin |
| review_reason | TEXT | Admin's response |
| created_at | TIMESTAMP | When appeal submitted |
| reviewed_at | TIMESTAMP | When reviewed |

**Constraint:** Only one pending appeal allowed per ban

## Functions

### `is_user_banned(check_user_id UUID)`
**Returns:** BOOLEAN

Checks if user has an active, non-expired ban.

```sql
SELECT is_user_banned('user-uuid');
-- Returns TRUE if user is currently banned
```

### `expire_temporary_bans()`
**Returns:** void

Automatically expires temporary bans past their expiry date:
- Sets `is_active = false`
- Sets `unbanned_at = NOW()`
- Sets `unban_reason = 'Ban expired automatically'`

Should be run periodically (e.g., every hour via cron).

### `ban_user(target_user_id, admin_user_id, ban_reason, duration_type, ban_duration_days)`
**Returns:** UUID (new ban ID)

Creates a new ban with full validation.

**Parameters:**
- `target_user_id` (UUID) - User to ban
- `admin_user_id` (UUID) - Admin performing ban
- `ban_reason` (TEXT) - Required reason
- `duration_type` (VARCHAR) - 'temporary' or 'permanent'
- `ban_duration_days` (INTEGER) - Days for temp ban (NULL for permanent)

**Actions:**
1. Validates admin has Level 2+ permission
2. Calculates expiry date for temp bans
3. Deactivates any existing active bans
4. Creates new ban record
5. Logs to `admin_actions`

### `unban_user(target_user_id, admin_user_id, unban_reason_text)`
**Returns:** BOOLEAN

Removes active bans from a user.

**Actions:**
1. Validates admin has Level 2+ permission
2. Sets all active bans to inactive
3. Records unbanner and reason
4. Logs to `admin_actions`

## Row Level Security

### `bans` Table
| Operation | Policy |
|-----------|--------|
| SELECT | Own bans OR any admin (Level 1+) |
| INSERT | Admins Level 2+ only |
| UPDATE | Admins Level 2+ only |

### `ban_appeals` Table
| Operation | Policy |
|-----------|--------|
| SELECT | Own appeals OR any admin |
| INSERT | Own appeals for active bans only |
| UPDATE | Admins Level 2+ only |

## Usage Examples

```sql
-- Check if user is banned
SELECT is_user_banned('user-uuid');

-- Ban a user temporarily (7 days)
SELECT ban_user(
  'target-user-uuid',
  'admin-uuid',
  'Repeated posting of false verifications',
  'temporary',
  7
);

-- Ban a user permanently
SELECT ban_user(
  'target-user-uuid',
  'admin-uuid',
  'Confirmed vote manipulation',
  'permanent',
  NULL
);

-- Unban a user
SELECT unban_user(
  'target-user-uuid',
  'admin-uuid',
  'Appeal approved - first offense'
);

-- View all active bans
SELECT
  b.id,
  u.username as banned_user,
  a.username as banned_by,
  b.ban_type,
  b.reason,
  b.expires_at
FROM bans b
JOIN users u ON b.user_id = u.id
JOIN users a ON b.banned_by = a.id
WHERE b.is_active = true
ORDER BY b.banned_at DESC;

-- View pending appeals
SELECT
  ba.id,
  u.username,
  ba.appeal_reason,
  ba.created_at
FROM ban_appeals ba
JOIN users u ON ba.user_id = u.id
WHERE ba.status = 'pending'
ORDER BY ba.created_at ASC;

-- Approve an appeal
UPDATE ban_appeals
SET
  status = 'approved',
  reviewed_by = 'admin-uuid',
  review_reason = 'First offense, user has acknowledged violation',
  reviewed_at = NOW()
WHERE id = 'appeal-uuid';

-- Then unban the user
SELECT unban_user('user-uuid', 'admin-uuid', 'Appeal approved');

-- Expire temporary bans (run via cron)
SELECT expire_temporary_bans();

-- Get ban history for a user
SELECT
  reason,
  ban_type,
  banned_at,
  expires_at,
  is_active,
  unban_reason
FROM bans
WHERE user_id = 'user-uuid'
ORDER BY banned_at DESC;
```

## Frontend Integration

Check ban status on login/actions:
```typescript
const { data: isBanned } = await supabase
  .rpc('is_user_banned', { check_user_id: userId });

if (isBanned) {
  // Show ban message, disable actions
}
```

## Scheduling
Run `expire_temporary_bans()` periodically:
- Every hour recommended
- Via Supabase Edge Function or external cron

## Audit Trail
All ban/unban actions are logged to `admin_actions` with:
- `action_type`: 'ban_user' or 'unban_user'
- `target_type`: 'user'
- `metadata`: ban_type, duration, expiry, ban_id
