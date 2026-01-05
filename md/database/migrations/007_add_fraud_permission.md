# 007_add_fraud_permission.sql

## Overview
Simple migration that adds the `manage_fraud` permission to Moderator and SuperAdmin roles, enabling them to access fraud detection features.

## Changes Made

Adds `manage_fraud` permission to:
1. **Moderator** role
2. **SuperAdmin** role

## Permission Details

| Permission | Description |
|------------|-------------|
| `manage_fraud` | View fraud flags, review and resolve flags, access fraud dashboard |

## SQL Logic

```sql
DO $$
DECLARE
  moderator_id UUID;
  superadmin_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO moderator_id FROM admin_roles WHERE name = 'Moderator';
  SELECT id INTO superadmin_id FROM admin_roles WHERE name = 'SuperAdmin';

  -- Add manage_fraud permission to Moderator
  INSERT INTO admin_permissions (role_id, permission) VALUES
    (moderator_id, 'manage_fraud')
  ON CONFLICT (role_id, permission) DO NOTHING;

  -- Add manage_fraud permission to SuperAdmin
  INSERT INTO admin_permissions (role_id, permission) VALUES
    (superadmin_id, 'manage_fraud')
  ON CONFLICT (role_id, permission) DO NOTHING;
END $$;
```

## Usage

After running this migration, check permission with:

```sql
SELECT user_has_permission(auth.uid(), 'manage_fraud');
```

## Frontend Integration

The fraud dashboard (`/admin/fraud`) should check for this permission:

```typescript
const canManageFraud = await supabase.rpc('user_has_permission', {
  user_auth_id: user.id,
  required_permission: 'manage_fraud'
});
```

## Notes
- Uses `ON CONFLICT DO NOTHING` for idempotency
- Safe to run multiple times
- Reviewers do NOT get this permission (only Level 2+ admins)
