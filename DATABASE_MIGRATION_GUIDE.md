# Database Migration Guide

This guide provides step-by-step instructions for applying all database migrations to your Supabase project.

## Prerequisites

- Supabase account and project created
- Access to your Supabase SQL Editor
- Your database URL configured in `frontend/.env.local`

## Migration Order

Apply these migrations in the following order:

### 1. Complete Migration (Core Setup)
**File**: `supabase_complete_migration_fixed.sql`

This migration sets up:
- Auth integration with `auth_id` field
- Row Level Security (RLS) on all tables
- RLS policies for all tables
- Storage buckets for images
- Storage policies
- Materialized view for citizen scores
- Triggers for auto-creating user records

**Steps:**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `supabase_complete_migration_fixed.sql`
6. Paste into the editor
7. Click **Run** (or Ctrl/Cmd + Enter)
8. Verify success message appears

### 2. Reputation System Migration
**File**: `supabase_reputation_system.sql`

This migration adds:
- Reputation calculation functions
- Automatic triggers for vote updates
- Triggers for verification status changes
- Maintenance functions

**Steps:**
1. In the same SQL Editor
2. Click **New Query** again
3. Copy the entire contents of `supabase_reputation_system.sql`
4. Paste into the editor
5. Click **Run**
6. Verify the functions were created successfully

## Verification

After applying all migrations, verify everything is working:

### Check Tables
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- users
- promises
- verifications
- votes
- evidence_files
- activity_logs

### Check RLS is Enabled
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`

### Check Functions
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

You should see:
- `calculate_user_reputation`
- `handle_new_user`
- `recalculate_all_reputations`
- `refresh_citizen_scores`
- `trigger_update_reputation_on_verification_status`
- `trigger_update_reputation_on_vote`
- `update_user_reputation`

### Check Triggers
```sql
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
```

You should see:
- `on_auth_user_created` on `auth.users`
- `verifications_reputation_trigger` on `verifications`
- `votes_reputation_trigger` on `votes`

### Check Storage Buckets
```sql
SELECT id, name, public
FROM storage.buckets;
```

You should see:
- `promise-images`
- `evidence-images`
- `evidence-videos`
- `profile-avatars`

## Testing the Setup

### 1. Test User Creation
Create a new user through the app's signup flow. Then verify:

```sql
SELECT id, auth_id, email, username, citizen_score
FROM users
WHERE email = 'your-test-email@example.com';
```

The user should have:
- An `auth_id` matching their Supabase auth ID
- A default `citizen_score` of 100

### 2. Test Promise Creation
Create a promise through the app. Then verify:

```sql
SELECT id, politician_name, created_by, status
FROM promises
ORDER BY created_at DESC
LIMIT 1;
```

### 3. Test Verification Submission
Submit a verification for a promise. Then verify:

```sql
SELECT id, promise_id, submitted_by, verdict, status, upvotes, downvotes
FROM verifications
ORDER BY created_at DESC
LIMIT 1;
```

Should show:
- `upvotes = 0`
- `downvotes = 0`
- `status = 'pending'`

### 4. Test Voting and Reputation
Cast a vote on a verification through the app. Then check:

```sql
-- Check vote was recorded
SELECT * FROM votes ORDER BY created_at DESC LIMIT 1;

-- Check verification vote count updated
SELECT upvotes, downvotes FROM verifications WHERE id = 'verification-id-here';

-- Check submitter's reputation updated
SELECT username, citizen_score
FROM users
WHERE id = (
  SELECT submitted_by FROM verifications WHERE id = 'verification-id-here'
);
```

The submitter's `citizen_score` should have automatically increased!

## Troubleshooting

### Error: "relation already exists"
This means the table/function/trigger already exists. Either:
- Drop it first: `DROP TABLE/FUNCTION/TRIGGER IF EXISTS name;`
- Or modify the migration to use `CREATE OR REPLACE` or `IF NOT EXISTS`

### Error: "permission denied"
You may need to grant permissions. Run as superuser or use service role key.

### Error: "column does not exist"
Check that the previous migrations were applied successfully. The order matters!

### RLS Blocking Operations
If you're testing and RLS is blocking you:
```sql
-- Temporarily disable RLS (TESTING ONLY - don't use in production)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

To re-enable:
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

## Rollback (If Needed)

If something goes wrong and you need to start over:

### Drop All Triggers
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS votes_reputation_trigger ON votes;
DROP TRIGGER IF EXISTS verifications_reputation_trigger ON verifications;
```

### Drop All Functions
```sql
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS calculate_user_reputation(UUID);
DROP FUNCTION IF EXISTS update_user_reputation(UUID);
DROP FUNCTION IF EXISTS trigger_update_reputation_on_vote();
DROP FUNCTION IF EXISTS trigger_update_reputation_on_verification_status();
DROP FUNCTION IF EXISTS recalculate_all_reputations();
DROP FUNCTION IF EXISTS refresh_citizen_scores();
```

### Drop Materialized View
```sql
DROP MATERIALIZED VIEW IF EXISTS citizen_scores_mv;
```

Then re-apply the migrations from scratch.

## Support

If you encounter issues:
1. Check the Supabase logs in the Dashboard → Logs
2. Verify your environment variables in `frontend/.env.local`
3. Ensure you're using the correct database URL
4. Check that you have the necessary permissions in Supabase

## Next Steps

After successfully applying all migrations:
1. Start the frontend: `npm run dev` in the `frontend` directory
2. Test the complete user flow:
   - Sign up / Sign in
   - Create a promise
   - Submit a verification
   - Vote on verifications
   - Check your citizen score updates!
