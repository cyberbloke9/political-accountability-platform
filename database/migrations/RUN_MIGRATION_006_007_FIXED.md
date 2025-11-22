# Running Migrations 006 & 007: Fraud Detection System (FIXED)

## ⚠️ IMPORTANT: Use the FIXED Version

**Run `006_fraud_detection_fixed.sql` instead of `006_fraud_detection.sql`**

The original version had incorrect column names. The fixed version uses:
- `evidence_text` (not `evidence`)
- `evidence_urls` (array, not `source_url`)

---

## **Migration 006: Fraud Detection System (FIXED)**

### What It Creates:

1. **Tables**:
   - `fraud_flags` - Tracks detected fraud flags with severity and status
   - `user_activity_log` - Logs user activity for pattern analysis

2. **Detection Functions**:
   - `detect_rapid_submissions()` - Detects spam (>5 verifications/hour)
   - `detect_low_quality_verifications()` - Detects poor evidence and AI content
   - `detect_vote_manipulation()` - Detects suspicious voting patterns
   - `detect_duplicate_evidence()` - Detects plagiarism
   - `run_fraud_detection()` - Runs all detection algorithms
   - `review_fraud_flag()` - Admin reviews and confirms/dismisses flags

### Running Migration 006 (FIXED):

1. Go to Supabase: https://supabase.com/dashboard/project/avxuugbgewmiccgteghi
2. SQL Editor → New Query
3. Copy entire contents of **`006_fraud_detection_fixed.sql`** (NOT the original)
4. Click **Run**

### Expected Output:

```
CREATE TABLE
CREATE INDEX (multiple times)
ALTER TABLE
CREATE POLICY (multiple times)
CREATE FUNCTION (multiple times)
COMMENT ON TABLE...
```

Should complete with no errors.

---

## **Migration 007: Add Fraud Permission**

### What It Does:

Adds `manage_fraud` permission to Moderator and SuperAdmin roles.

### Running Migration 007:

1. **In the same SQL Editor**, create a **New Query**
2. Copy entire contents of `007_add_fraud_permission.sql`
3. Click **Run**

### Expected Output:

```
DO
```

Should complete silently (no errors = success).

---

## **Verify Everything Works**

### Check Tables Exist:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('fraud_flags', 'user_activity_log');
```

Should return 2 tables.

### Check Functions Exist:

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%fraud%' OR routine_name LIKE '%detect%'
ORDER BY routine_name;
```

Should return 6 functions.

### Check Permissions:

```sql
SELECT ar.name as role, ap.permission
FROM admin_permissions ap
JOIN admin_roles ar ON ap.role_id = ar.id
WHERE ap.permission = 'manage_fraud'
ORDER BY ar.name;
```

Should return 2 rows (Moderator, SuperAdmin).

---

## **Test Fraud Detection**

### Run Detection Manually (in SQL Editor):

```sql
SELECT run_fraud_detection();
```

**Expected**: Returns `(null)` with NOTICE: "Fraud detection completed at [timestamp]"

### Check for Flags:

```sql
SELECT
  flag_type,
  target_type,
  severity,
  status,
  confidence_score
FROM fraud_flags
ORDER BY created_at DESC
LIMIT 10;
```

This will show any fraud flags that were auto-detected.

---

## **What Was Fixed**

The original migration used incorrect column names:
- ❌ `evidence` → ✅ `evidence_text`
- ❌ `source_url` → ✅ `evidence_urls` (array)

The fixed version correctly references the actual schema from `001_initial_schema.sql`.

---

## **TL;DR**

1. Run `006_fraud_detection_fixed.sql` (NOT the original) ✅
2. Run `007_add_fraud_permission.sql` ✅
3. Verify tables and functions exist ✅
4. Test with `SELECT run_fraud_detection();` ✅
5. Check `/admin/fraud` page in the app ✅
