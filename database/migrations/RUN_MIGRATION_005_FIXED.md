# Running Migration 005: Moderation System (FIXED)

## Issue

The original migration had a function naming conflict. This fixed version drops existing functions first.

## Quick Setup (Supabase Dashboard)

1. Go to your Supabase project: https://supabase.com/dashboard/project/avxuugbgewmiccgteghi
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `005_moderation_system_fixed.sql` (NOT the original)
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl+Enter)

## What This Does Differently

✅ Drops existing functions before creating new ones:
  - DROP FUNCTION IF EXISTS update_user_reputation
  - DROP FUNCTION IF EXISTS approve_verification
  - DROP FUNCTION IF EXISTS reject_verification

✅ Drops existing policies before creating new ones:
  - Avoids "already exists" errors

✅ Then creates everything fresh:
  - admin_actions table
  - notifications table
  - All indexes
  - All RLS policies
  - All functions

## Verify Success

Run this to check functions were created:

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('approve_verification', 'reject_verification', 'update_user_reputation');
```

Should return 3 functions.

Check tables:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('admin_actions', 'notifications');
```

Should return 2 tables.

## Test It Works

Try approving a test verification (replace UUIDs with real ones):

```sql
SELECT approve_verification(
  'VERIFICATION_ID'::UUID,
  'YOUR_USER_ID'::UUID,
  'Test approval'
);
```

Check the notification was created:

```sql
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;
```

## Next Steps

Once this migration succeeds, the approve/reject buttons in the admin panel will work!
