# Fix: Migration 005 - Two Step Process

## The Problem

You have existing functions with conflicting names. We need to drop ALL versions first, then create new ones.

---

## **STEP 1: Drop All Existing Functions**

1. Go to Supabase: https://supabase.com/dashboard/project/avxuugbgewmiccgteghi
2. SQL Editor → New Query
3. Copy/paste entire contents of **`DROP_ALL_MODERATION_FUNCTIONS.sql`**
4. Click **Run**

### Expected Output:
```
NOTICE: Dropped: update_user_reputation(uuid, integer, text)
NOTICE: Dropped: approve_verification(uuid, uuid, text)
NOTICE: Dropped: reject_verification(uuid, uuid, text)
```

If you see "NOTICE: Dropped..." messages, it worked! ✅

### Verify They're Gone:
The last query in the script will show you what's left. You should see **0 rows returned** (empty result).

---

## **STEP 2: Create Fresh Functions**

1. **In the same SQL Editor**, create a **New Query** (don't reuse the old one)
2. Copy/paste entire contents of **`005_moderation_system_clean.sql`**
3. Click **Run**

### Expected Output:
```
CREATE TABLE (or "relation already exists" - that's OK)
CREATE INDEX
CREATE POLICY
CREATE FUNCTION
...
```

Should complete with no errors.

---

## **Verify Everything Works**

Run this query:

```sql
-- Check functions exist with correct signatures
SELECT
  routine_name,
  routine_type,
  pg_get_function_arguments(p.oid) as arguments
FROM information_schema.routines r
JOIN pg_proc p ON p.proname = r.routine_name
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND routine_name IN ('update_user_reputation', 'approve_verification', 'reject_verification')
ORDER BY routine_name;
```

You should see **exactly 3 functions**:
- `approve_verification` with arguments: `verification_id uuid, admin_user_id uuid, approval_reason text DEFAULT NULL`
- `reject_verification` with arguments: `verification_id uuid, admin_user_id uuid, rejection_reason text`
- `update_user_reputation` with arguments: `target_user_id uuid, points_change integer, reason text`

---

## **Test It Works**

Check tables exist:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('admin_actions', 'notifications');
```

Should return 2 tables: `admin_actions` and `notifications`.

---

## **Why This Happens**

When you run `CREATE OR REPLACE FUNCTION`, PostgreSQL needs the EXACT signature match. If there's ANY difference (different parameter types, different parameter names, etc.), it creates a NEW function instead of replacing the old one. Then you have multiple functions with the same name but different signatures.

The DROP script finds ALL versions and removes them, giving us a clean slate.

---

## **TL;DR**

1. Run `DROP_ALL_MODERATION_FUNCTIONS.sql` ✅
2. Run `005_moderation_system_clean.sql` ✅
3. Verify 3 functions exist ✅
4. Done! ✅
