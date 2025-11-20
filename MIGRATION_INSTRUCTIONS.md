# Complete Migration Instructions

## Overview

This guide shows you how to set up the Political Accountability Platform database in Supabase.

## Step-by-Step Instructions

### 1️⃣ Create Base Schema (Run FIRST!)

**File**: `database/schema.sql`

This creates all the base tables (users, promises, verifications, votes, evidence_files, activity_logs).

**How to Run:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy ALL contents of `database/schema.sql`
6. Paste and click **Run**

**Verification:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```
You should see: activity_logs, evidence_files, promises, users, verifications, votes

---

### 2️⃣ Apply Main Migration (Run SECOND!)

**File**: `supabase_migration_final.sql`

This migration:
- Adds Supabase Auth integration (`auth_id` column)
- Transforms tables to match the app
- Adds columns: `upvotes`, `downvotes`, `verdict`, `evidence_text`, `politician_name`, `promise_text`, etc.
- Enables Row Level Security (RLS)
- Creates all security policies
- Sets up storage buckets
- Creates user auto-creation trigger

**How to Run:**
1. In SQL Editor, click **New Query**
2. Copy ALL contents of `supabase_migration_final.sql`
3. Paste and click **Run**
4. Wait for "Main migration completed successfully!" message

**Verification:**
```sql
-- Check auth_id column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'auth_id';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public';
```
All tables should show `rowsecurity = true`

---

### 3️⃣ Apply Reputation System (Run THIRD!)

**File**: `supabase_reputation_system.sql`

This migration:
- Creates reputation calculation functions
- Sets up automatic triggers for vote updates
- Initializes citizen scores

**How to Run:**
1. In SQL Editor, click **New Query**
2. Copy ALL contents of `supabase_reputation_system.sql`
3. Paste and click **Run**
4. Wait for completion

**Verification:**
```sql
-- Check functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
AND routine_name LIKE '%reputation%'
ORDER BY routine_name;
```
You should see:
- calculate_user_reputation
- recalculate_all_reputations
- trigger_update_reputation_on_verification_status
- trigger_update_reputation_on_vote
- update_user_reputation

```sql
-- Check triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%reputation%';
```
You should see:
- verifications_reputation_trigger on verifications
- votes_reputation_trigger on votes

---

## Troubleshooting

### Error: "relation already exists"
This means you're running a migration twice or out of order.

**Solution:**
- If starting fresh: Delete all tables and start from Step 1
- If continuing: Skip to the next migration file

### Error: "operator does not exist: text = uuid"
This means you ran the old migration file.

**Solution:**
- Use `supabase_migration_final.sql` instead of `supabase_complete_migration_fixed.sql`
- This file has proper UUID comparisons

### Error: "column does not exist"
You skipped a migration or ran them out of order.

**Solution:**
- Check which columns exist:
  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'promises';
  ```
- If missing base columns (id, created_at, etc): Run `database/schema.sql` first
- If missing new columns (politician_name, promise_text, etc): Run `supabase_migration_final.sql`

### Storage bucket errors
Storage bucket policies might fail if using the Supabase free tier.

**Solution:**
- Check if buckets were created:
  ```sql
  SELECT id, name FROM storage.buckets;
  ```
- If missing, manually create them in Supabase Dashboard → Storage

---

## Testing Your Setup

### Test 1: Create a Test User

Go to Supabase Dashboard → Authentication → Users → Add User

Create a user with:
- Email: test@example.com
- Password: TestPassword123!

Then verify the trigger created a users table record:
```sql
SELECT id, auth_id, email, username, citizen_score
FROM users
WHERE email = 'test@example.com';
```

Should show:
- `auth_id` = their Supabase auth UUID
- `citizen_score` = 100
- `username` = "test"

### Test 2: Check RLS is Working

Try to query as anonymous user (should fail if RLS is working):
```sql
-- This should return results (public read access)
SELECT * FROM promises LIMIT 1;

-- This should fail (no insert without auth)
INSERT INTO promises (politician_name, promise_text, promise_date, created_by)
VALUES ('Test', 'Test promise', CURRENT_DATE, 'some-uuid');
```

### Test 3: Run the Full App

1. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open http://localhost:3000

3. Sign up with a new account

4. Create a promise

5. Submit a verification

6. Vote on the verification

7. Check citizen score updates:
   ```sql
   SELECT username, citizen_score FROM users
   ORDER BY citizen_score DESC;
   ```

---

## Quick Reference

| File | Purpose | Run Order |
|------|---------|-----------|
| `database/schema.sql` | Creates base tables | 1st |
| `supabase_migration_final.sql` | Auth + Schema transformation + RLS | 2nd |
| `supabase_reputation_system.sql` | Reputation calculation | 3rd |

---

## Need Help?

If you get stuck:

1. Check Supabase Dashboard → Logs for error details
2. Verify your `.env.local` has correct credentials
3. Make sure you ran migrations in order
4. Try the troubleshooting steps above

## Success Checklist

After all migrations:

- ✅ 6 tables exist (users, promises, verifications, votes, evidence_files, activity_logs)
- ✅ All tables have RLS enabled
- ✅ `auth_id` column exists in users table
- ✅ Storage buckets created (promise-images, evidence-images, etc)
- ✅ Reputation functions exist (5 functions)
- ✅ Triggers exist (on_auth_user_created, votes_reputation_trigger, verifications_reputation_trigger)
- ✅ Test user auto-created when signing up
- ✅ App runs without database errors

🎉 **You're done! Your database is ready to use.**
