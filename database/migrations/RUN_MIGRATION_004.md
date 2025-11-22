# Running Migration 004: Admin System

## Quick Setup (Supabase Dashboard)

1. Go to your Supabase project: https://supabase.com/dashboard/project/avxuugbgewmiccgteghi
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `004_admin_system.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl+Enter)

## What This Migration Does

✅ Creates `admin_roles` table with 3 levels:
  - **Reviewer** (Level 1): View-only, can flag content
  - **Moderator** (Level 2): Can approve/reject, issue temp bans
  - **SuperAdmin** (Level 3): Full platform control

✅ Creates `admin_permissions` table with granular permissions
✅ Creates `user_roles` junction table for role assignments
✅ Sets up RLS policies (only SuperAdmins can assign roles)
✅ Creates helper functions:
  - `user_has_permission(auth_id, permission)` - Check specific permission
  - `user_is_admin(auth_id)` - Check if user is any type of admin
  - `user_admin_level(auth_id)` - Get user's highest level (0-3)

## Verify Migration Success

Run this query to check roles were created:

```sql
SELECT name, description, level FROM admin_roles ORDER BY level;
```

You should see 3 roles: Reviewer (1), Moderator (2), SuperAdmin (3).

## Assign First SuperAdmin

**IMPORTANT:** Replace `YOUR_USER_ID_HERE` with your actual user ID from the `users` table.

```sql
-- First, get your user ID
SELECT id, username, email FROM users WHERE email = 'your-email@example.com';

-- Then assign SuperAdmin role (replace the UUID below)
INSERT INTO user_roles (user_id, role_id)
SELECT
  'YOUR_USER_ID_HERE'::UUID,
  id
FROM admin_roles
WHERE name = 'SuperAdmin';
```

## Verify You're a SuperAdmin

```sql
-- Check your admin level (should return 3)
SELECT user_admin_level('YOUR_AUTH_ID_HERE'::UUID);

-- Check your permissions
SELECT ap.permission
FROM user_roles ur
JOIN admin_permissions ap ON ur.role_id = ap.role_id
WHERE ur.user_id = 'YOUR_USER_ID_HERE'::UUID
ORDER BY ap.permission;
```

You should see 16 permissions for SuperAdmin.

## Next Steps

After running this migration successfully, we'll proceed to Task 2: Building the admin authentication middleware.
