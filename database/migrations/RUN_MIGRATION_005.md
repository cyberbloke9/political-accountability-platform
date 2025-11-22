# Running Migration 005: Moderation System

## Quick Setup (Supabase Dashboard)

1. Go to your Supabase project: https://supabase.com/dashboard/project/avxuugbgewmiccgteghi
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `005_moderation_system.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl+Enter)

## What This Migration Does

✅ Creates `admin_actions` table:
  - Audit log of all admin actions (approve, reject, ban, etc.)
  - Stores action type, target, admin, reason, metadata
  - Publicly viewable (transparency)

✅ Creates `notifications` table:
  - In-app notifications for users
  - Types: verification_approved, verification_rejected, reputation_change
  - Read/unread status
  - Optional links to relevant pages

✅ Creates reputation update function:
  - `update_user_reputation(user_id, points, reason)`
  - Updates citizen_score
  - Creates notification automatically

✅ Creates approval function:
  - `approve_verification(verification_id, admin_id, reason)`
  - Updates status to 'approved'
  - Adds +10 reputation points
  - Logs admin action
  - Sends in-app notification

✅ Creates rejection function:
  - `reject_verification(verification_id, admin_id, reason)`
  - Updates status to 'rejected'
  - Deducts -15 reputation points
  - Logs admin action
  - Sends in-app notification with reason

## Verify Migration Success

Check tables were created:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('admin_actions', 'notifications');
```

Check functions exist:

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('approve_verification', 'reject_verification', 'update_user_reputation');
```

## Next Steps

After running this migration, the approval/rejection buttons in the admin panel will be functional.
