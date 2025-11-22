# Running Migration 010: Auto-Approval System (HARSH Rules)

## Overview

This migration implements an **auto-approval system with HARSH rules** - only top-tier contributors qualify. The system automatically approves high-quality verifications from proven, trusted users.

**DISABLED by default** - SuperAdmins must enable manually.

---

## **Migration 010: Auto-Approval System**

### What It Creates:

1. **Tables**:
   - `auto_approval_rules` - Configuration (single row, HARSH defaults)
   - `auto_approval_log` - Complete audit trail of all decisions

2. **Trigger Function**:
   - `check_auto_approval()` - Runs BEFORE INSERT on verifications
   - Checks ALL criteria instantly
   - Auto-approves if ALL pass, otherwise stays pending

3. **Default Rules** (HARSH - Disabled):
   - **Minimum Citizen Score**: 250 (top-tier only)
   - **Minimum Evidence Length**: 250 characters
   - **Require Source URLs**: YES (mandatory)
   - **Minimum Account Age**: 60 days (2 months)
   - **Minimum Approved Verifications**: 10+ (proven track record)
   - **Maximum Recent Rejections**: 0 (ZERO tolerance)
   - **Fraud Flags**: NONE allowed (instant disqualification)

### Running Migration 010:

1. Go to Supabase: https://supabase.com/dashboard/project/avxuugbgewmiccgteghi
2. SQL Editor → New Query
3. Copy entire contents of `010_auto_approval_system.sql`
4. Click **Run**

### Expected Output:

```
CREATE TABLE (2 times)
CREATE INDEX (4 times)
ALTER TABLE (2 times)
CREATE POLICY (4 times)
INSERT INTO auto_approval_rules (1 row)
CREATE FUNCTION
CREATE TRIGGER
COMMENT ON...
```

Should complete with no errors.

---

## **Verify Everything Works**

### Check Tables Exist:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('auto_approval_rules', 'auto_approval_log');
```

Should return 2 tables.

### Check Default Rules:

```sql
SELECT
  enabled,
  min_citizen_score,
  min_evidence_length,
  min_account_age_days,
  min_approved_verifications,
  max_recent_rejections
FROM auto_approval_rules;
```

Should return:
- enabled: **false** (disabled by default)
- min_citizen_score: **250**
- min_evidence_length: **250**
- min_account_age_days: **60**
- min_approved_verifications: **10**
- max_recent_rejections: **0**

### Check Trigger Exists:

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_check_auto_approval';
```

Should return 1 row: `trigger_check_auto_approval` on `verifications` table.

---

## **Enable Auto-Approval (SuperAdmin Only)**

### Via Admin Panel (Recommended):

1. Go to `/admin/auto-approval` in the app
2. Toggle the **"ENABLED/DISABLED"** switch
3. Review harsh criteria (default: 250 score, 10 approvals, 0 rejections)
4. Click **"Save Changes"**

### Or via SQL:

```sql
UPDATE auto_approval_rules
SET enabled = true;
```

**WARNING**: This takes effect immediately on ALL new submissions!

---

## **How It Works**

### When User Submits Verification:

1. **Trigger fires BEFORE INSERT** (instant check)
2. **System checks ALL criteria**:
   - ✓ Citizen score ≥ 250?
   - ✓ Evidence length ≥ 250 characters?
   - ✓ Has source URLs?
   - ✓ Account ≥ 60 days old?
   - ✓ Has ≥ 10 approved verifications?
   - ✓ Has 0 recent rejections (last 30 days)?
   - ✓ No fraud flags (pending or confirmed)?

3. **If ALL pass**:
   - Status set to `'approved'` immediately
   - Logged to `admin_actions` (audit trail)
   - Logged to `auto_approval_log` (detailed record)
   - Reputation update triggers automatically (+10 points)
   - **User skips manual review queue entirely**

4. **If ANY fail**:
   - Status stays `'pending'`
   - Logged to `auto_approval_log` (reason why failed)
   - Goes to manual admin review queue

---

## **Example Scenarios**

### **Alice (250 score, 12 approvals, 90 days old, 0 rejections)**:

✅ Score 250 ≥ 250
✅ Evidence 280 chars ≥ 250
✅ Has 3 source URLs
✅ Account 90 days ≥ 60
✅ Has 12 approved ≥ 10
✅ 0 rejections ≤ 0
✅ No fraud flags

**→ AUTO-APPROVED ✅**

---

### **Bob (180 score, 8 approvals, 45 days old)**:

❌ Score 180 < 250
✅ Evidence 300 chars ≥ 250
✅ Has source URLs
❌ Account 45 days < 60
❌ Has 8 approved < 10

**→ MANUAL REVIEW (multiple failures)**

---

### **Carol (280 score, 15 approvals, 1 rejection last week)**:

✅ Score 280 ≥ 250
✅ Evidence 400 chars ≥ 250
✅ Has source URLs
✅ Account 120 days ≥ 60
✅ Has 15 approved ≥ 10
❌ 1 rejection > 0 (ZERO tolerance!)

**→ MANUAL REVIEW (failed rejection check)**

---

## **Why These HARSH Rules?**

### **Citizen Score 250 = ~23-25 Approved Verifications**

Math:
- Submit 25 verifications: +25 points (25 × 1)
- Get 23 approved: +230 points (23 × 10)
- **Total: 255 points** ✅

This takes:
- Minimum 60+ days (account age requirement)
- Consistent quality work
- ZERO rejections (perfect record)

**Very hard to achieve** - exactly what we want!

---

## **Admin Tools**

### View Auto-Approval Stats:

```sql
SELECT
  COUNT(*) as total_decisions,
  COUNT(*) FILTER (WHERE auto_approved = true) as auto_approved,
  COUNT(*) FILTER (WHERE auto_approved = false) as manual_review,
  ROUND(
    COUNT(*) FILTER (WHERE auto_approved = true)::DECIMAL / COUNT(*) * 100,
    1
  ) as approval_rate_percent
FROM auto_approval_log;
```

### View Recent Auto-Approvals:

```sql
SELECT
  aal.created_at,
  u.username,
  u.citizen_score,
  aal.reason
FROM auto_approval_log aal
JOIN users u ON aal.user_id = u.id
WHERE aal.auto_approved = true
ORDER BY aal.created_at DESC
LIMIT 10;
```

### View Failures (Why Not Auto-Approved):

```sql
SELECT
  aal.created_at,
  u.username,
  u.citizen_score,
  aal.reason
FROM auto_approval_log aal
JOIN users u ON aal.user_id = u.id
WHERE aal.auto_approved = false
ORDER BY aal.created_at DESC
LIMIT 10;
```

---

## **Safety Measures**

✅ **Disabled by default** - SuperAdmin must enable
✅ **Complete audit trail** - Every decision logged
✅ **HARSH criteria** - Only proven users qualify
✅ **Zero tolerance** - ANY rejection = disqualified
✅ **Fraud protection** - ANY fraud flag = disqualified
✅ **Transparent** - All logs visible to admins
✅ **Reversible** - Can disable instantly

---

## **TL;DR**

1. Run `010_auto_approval_system.sql` ✅
2. Verify tables, rules, and trigger exist ✅
3. System is **DISABLED** by default (safe) ✅
4. Enable at `/admin/auto-approval` when ready ✅
5. Only top-tier users (250+ score, 10+ approvals, 0 rejections) qualify ✅
6. Review auto-approval log regularly ✅

---

## **Key Benefits**

✅ **Reduces admin workload** - Top users skip queue
✅ **Rewards quality** - Fast approval for proven contributors
✅ **Prevents gaming** - HARSH criteria (250 score, 0 rejections)
✅ **Fully configurable** - Adjust thresholds at `/admin/auto-approval`
✅ **Transparent** - Complete audit trail
✅ **Safe** - Disabled by default, easy to disable

**Only the best of the best get auto-approved!** 🏆
