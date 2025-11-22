# Running Migrations 006 & 007: Fraud Detection System

## Overview

These migrations add a comprehensive fraud detection system with automated algorithms to detect spam, vote manipulation, low-quality content, and duplicate evidence.

---

## **Migration 006: Fraud Detection System**

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

### Running Migration 006:

1. Go to Supabase: https://supabase.com/dashboard/project/avxuugbgewmiccgteghi
2. SQL Editor → New Query
3. Copy entire contents of `006_fraud_detection.sql`
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

Should return 2 tables: `fraud_flags` and `user_activity_log`.

### Check Functions Exist:

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%fraud%' OR routine_name LIKE '%detect%'
ORDER BY routine_name;
```

Should return 6 functions:
- `detect_duplicate_evidence`
- `detect_low_quality_verifications`
- `detect_rapid_submissions`
- `detect_vote_manipulation`
- `review_fraud_flag`
- `run_fraud_detection`

### Check Permissions:

```sql
SELECT ar.name as role, ap.permission
FROM admin_permissions ap
JOIN admin_roles ar ON ap.role_id = ar.id
WHERE ap.permission = 'manage_fraud'
ORDER BY ar.name;
```

Should return 2 rows:
- Moderator | manage_fraud
- SuperAdmin | manage_fraud

---

## **Test Fraud Detection**

### Run Detection Manually:

```sql
SELECT run_fraud_detection();
```

Should return `(null)` with a NOTICE message.

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

## **Features**

### Automatic Detection:

- **Spam Detection**: Users submitting >5 verifications/hour
  - Medium severity: 6-10 submissions
  - High severity: 11-20 submissions
  - Critical severity: >20 submissions

- **Low Quality**:
  - Evidence <50 characters
  - Missing source URLs
  - AI-generated phrases detected

- **Vote Manipulation**:
  - Vote ratio >95% or <5%
  - Extremely one-sided voting patterns

- **Duplicate Content**:
  - Identical evidence across multiple verifications
  - Plagiarism detection

### Admin Actions:

1. **View Flags**: `/admin/fraud` page shows all flags
2. **Review Flags**: Confirm or dismiss each flag
3. **Automatic Penalties**:
   - Confirmed flags deduct reputation:
     - Critical: -50 points
     - High: -25 points
     - Medium/Low: -10 points

---

## **TL;DR**

1. Run `006_fraud_detection.sql` ✅
2. Run `007_add_fraud_permission.sql` ✅
3. Verify tables and functions exist ✅
4. Test with `SELECT run_fraud_detection();` ✅
5. Check `/admin/fraud` page in the app ✅

---

## **Scheduling (Optional)**

To run fraud detection automatically, you can set up a Supabase Edge Function or cron job to call:

```sql
SELECT run_fraud_detection();
```

Recommended: Every 6 hours or daily.
