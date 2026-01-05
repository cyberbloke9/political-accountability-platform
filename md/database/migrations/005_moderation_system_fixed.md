# 005_moderation_system_fixed.sql

## Overview
Implements the moderation infrastructure including audit logging for admin actions and in-app notifications for users. Provides functions for approving/rejecting verifications with full traceability.

## Tables Created

### `admin_actions`
Audit log of all administrative actions for transparency.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| action_type | VARCHAR(50) | Type of action performed |
| target_type | VARCHAR(50) | What was acted upon |
| target_id | UUID | ID of the target |
| admin_id | UUID | FK to users(id) who performed action |
| reason | TEXT | Reason/notes for the action |
| metadata | JSONB | Additional context data |
| created_at | TIMESTAMP | When action occurred |

### `notifications`
In-app notification system for users.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users(id), recipient |
| type | VARCHAR(50) | Notification category |
| title | VARCHAR(200) | Short title |
| message | TEXT | Full message content |
| link | VARCHAR(500) | Optional navigation URL |
| read | BOOLEAN | Has user seen it? |
| created_at | TIMESTAMP | When notification was created |

## Indexes
- `idx_admin_actions_admin_id` - Find actions by admin
- `idx_admin_actions_target` - Find actions by target
- `idx_admin_actions_created_at` - Chronological listing
- `idx_notifications_user_id` - User's notifications
- `idx_notifications_read` - Unread notifications filter
- `idx_notifications_created_at` - Recent notifications

## Row Level Security

| Table | Operation | Policy |
|-------|-----------|--------|
| admin_actions | SELECT | Public (transparency) |
| admin_actions | INSERT | Admins only |
| notifications | SELECT | Own notifications only |
| notifications | INSERT | System (open for triggers) |
| notifications | UPDATE | Own notifications only |

## Functions

### `update_user_reputation(target_user_id, points_change, reason)`
Updates user's citizen score and creates a notification.

**Parameters:**
- `target_user_id` (UUID) - User to update
- `points_change` (INTEGER) - Points to add/subtract
- `reason` (TEXT) - Explanation for the change

**Behavior:**
1. Updates `users.citizen_score` (minimum 0)
2. Creates notification with appropriate title (+/- change)

### `approve_verification(verification_id, admin_user_id, approval_reason)`
Approves a verification with full audit trail.

**Parameters:**
- `verification_id` (UUID) - Verification to approve
- `admin_user_id` (UUID) - Admin performing the action
- `approval_reason` (TEXT) - Optional reason

**Actions:**
1. Sets verification status to 'approved'
2. Awards +10 reputation to submitter
3. Logs action in `admin_actions`
4. Creates notification for submitter with link to promise

### `reject_verification(verification_id, admin_user_id, rejection_reason)`
Rejects a verification with penalty and audit trail.

**Parameters:**
- `verification_id` (UUID) - Verification to reject
- `admin_user_id` (UUID) - Admin performing the action
- `rejection_reason` (TEXT) - Required reason

**Actions:**
1. Sets verification status to 'rejected'
2. Deducts -15 reputation from submitter
3. Logs action in `admin_actions`
4. Creates notification for submitter with reason

## Notification Types

| Type | When Created |
|------|--------------|
| `reputation_change` | User's score changes |
| `verification_approved` | User's verification approved |
| `verification_rejected` | User's verification rejected |

## Usage Examples

```sql
-- Approve a verification
SELECT approve_verification(
  'verification-uuid',
  'admin-user-uuid',
  'Evidence well-documented with reliable sources'
);

-- Reject a verification
SELECT reject_verification(
  'verification-uuid',
  'admin-user-uuid',
  'Evidence does not support the claimed verdict'
);

-- Get unread notifications for current user
SELECT * FROM notifications
WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
AND read = false
ORDER BY created_at DESC;

-- Mark notification as read
UPDATE notifications SET read = true WHERE id = 'notification-uuid';

-- View admin action history
SELECT
  aa.action_type,
  aa.reason,
  u.username as admin_name,
  aa.created_at
FROM admin_actions aa
JOIN users u ON aa.admin_id = u.id
ORDER BY aa.created_at DESC;
```

## Security Features
- All admin actions are publicly viewable (transparency)
- Users can only see/update their own notifications
- Functions use `SECURITY DEFINER` for elevated privileges
- Audit trail cannot be deleted or modified
