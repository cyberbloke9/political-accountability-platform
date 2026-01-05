# 004_admin_system.sql

## Overview
Implements a comprehensive Role-Based Access Control (RBAC) system for platform administration. Defines three admin levels with granular permissions.

## Tables Created

### `admin_roles`
Defines available administrative roles.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(50) | Role name (unique) |
| description | TEXT | What this role can do |
| level | INTEGER | Hierarchy: 1=Reviewer, 2=Moderator, 3=SuperAdmin |
| created_at | TIMESTAMP | Creation time |

### `admin_permissions`
Granular permissions assigned to each role.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| role_id | UUID | FK to admin_roles(id), CASCADE delete |
| permission | VARCHAR(100) | Permission identifier |
| created_at | TIMESTAMP | Creation time |

**Constraint:** UNIQUE(role_id, permission)

### `user_roles`
Junction table assigning roles to users.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users(id), CASCADE delete |
| role_id | UUID | FK to admin_roles(id), CASCADE delete |
| assigned_by | UUID | FK to users(id), who assigned |
| assigned_at | TIMESTAMP | When assigned |
| expires_at | TIMESTAMP | Optional expiration |

**Constraint:** UNIQUE(user_id, role_id)

## Admin Hierarchy

### Level 1: Reviewer
Entry-level moderation role.

**Permissions:**
- `view_admin_dashboard`
- `view_verification_queue`
- `flag_content`
- `view_reports`

### Level 2: Moderator
Active moderation with approval powers.

**Permissions (includes Reviewer +):**
- `approve_verification`
- `reject_verification`
- `issue_temp_ban`
- `view_user_details`
- `view_audit_log`

### Level 3: SuperAdmin
Full platform control.

**Permissions (includes Moderator +):**
- `issue_permanent_ban`
- `assign_roles`
- `revoke_roles`
- `edit_user_reputation`
- `configure_auto_approval`
- `override_auto_approval`
- `manage_admins`

## Helper Functions

### `user_has_permission(user_auth_id UUID, required_permission VARCHAR)`
**Returns:** BOOLEAN

Checks if a user has a specific permission:
```sql
SELECT user_has_permission(auth.uid(), 'approve_verification');
-- Returns TRUE or FALSE
```

### `user_is_admin(user_auth_id UUID)`
**Returns:** BOOLEAN

Checks if user has any admin role (not expired):
```sql
SELECT user_is_admin(auth.uid());
-- Returns TRUE if user has any role
```

### `user_admin_level(user_auth_id UUID)`
**Returns:** INTEGER

Gets user's highest admin level:
```sql
SELECT user_admin_level(auth.uid());
-- Returns: 0 (none), 1 (Reviewer), 2 (Moderator), 3 (SuperAdmin)
```

## Row Level Security

| Table | Operation | Policy |
|-------|-----------|--------|
| admin_roles | SELECT | Public (transparency) |
| admin_permissions | SELECT | Public (transparency) |
| user_roles | SELECT | Public (transparency) |
| user_roles | INSERT | SuperAdmins only |
| user_roles | DELETE | SuperAdmins only |

## Usage Examples

```sql
-- Check if user can approve verifications
SELECT user_has_permission(auth.uid(), 'approve_verification');

-- Get user's admin level
SELECT user_admin_level(auth.uid());

-- Assign moderator role to a user (must be SuperAdmin)
INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT
  'target-user-uuid',
  ar.id,
  'your-user-uuid'
FROM admin_roles ar WHERE ar.name = 'Moderator';

-- Assign temporary role (expires in 30 days)
INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at)
SELECT
  'target-user-uuid',
  ar.id,
  'your-user-uuid',
  NOW() + INTERVAL '30 days'
FROM admin_roles ar WHERE ar.name = 'Reviewer';

-- Get all users with a specific role
SELECT u.username, u.email, ur.assigned_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN admin_roles ar ON ur.role_id = ar.id
WHERE ar.name = 'Moderator';

-- List all permissions for current user
SELECT ap.permission
FROM user_roles ur
JOIN admin_permissions ap ON ur.role_id = ap.role_id
JOIN users u ON ur.user_id = u.id
WHERE u.auth_id = auth.uid()
AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
```

## Security Features

1. **Expiration Support**: Roles can have optional expiration dates
2. **Audit Trail**: `assigned_by` tracks who granted the role
3. **Hierarchical Levels**: Higher levels include lower level permissions
4. **Function Security**: All helper functions use `SECURITY DEFINER`
5. **Transparent**: All role assignments are publicly viewable
