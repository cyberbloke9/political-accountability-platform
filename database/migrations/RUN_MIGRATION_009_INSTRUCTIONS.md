# Running Migration 009: Reputation Calculation Engine

## Overview

This migration replaces manual reputation updates with an automated, rule-based system featuring:
- **Automated updates** via database triggers
- **Configurable rules** for different events
- **Complete history tracking** for transparency
- **Reputation decay** for inactive users

---

## **Migration 009: Reputation Calculation Engine**

### What It Creates:

1. **Tables**:
   - `reputation_rules` - Configurable rules for automatic scoring
   - `reputation_history` - Complete audit trail of all reputation changes
   - `user_activity_status` - Tracks user activity for decay calculations

2. **Functions**:
   - `update_reputation_with_history()` - New reputation update with history tracking
   - `trigger_reputation_on_verification_approval()` - Auto-update on approval
   - `trigger_reputation_on_verification_rejection()` - Auto-update on rejection
   - `trigger_reputation_on_verification_submission()` - Auto-update on submission
   - `trigger_reputation_on_vote_received()` - Auto-update on vote received
   - `apply_reputation_decay()` - Apply decay for inactive users

3. **Triggers**:
   - Automatic reputation updates on verifications and votes
   - Automatic activity tracking

4. **Default Rules** (Seeded):
   - Verification submitted: **+1 point**
   - Verification approved: **+10 points**
   - Verification rejected: **-15 points**
   - Helpful vote received: **+1 point**
   - Unhelpful vote received: **-1 point**
   - Fraud confirmed: **-50 points**

### Running Migration 009:

1. Go to Supabase: https://supabase.com/dashboard/project/avxuugbgewmiccgteghi
2. SQL Editor → New Query
3. Copy entire contents of `009_reputation_engine.sql`
4. Click **Run**

### Expected Output:

```
CREATE TABLE (3 times)
CREATE INDEX (multiple times)
ALTER TABLE (3 times)
CREATE POLICY (multiple times)
INSERT INTO reputation_rules (6 rows)
CREATE FUNCTION (6 times)
CREATE TRIGGER (4 times)
COMMENT ON...
```

Should complete with no errors.

---

## **Verify Everything Works**

### Check Tables Exist:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('reputation_rules', 'reputation_history', 'user_activity_status');
```

Should return 3 tables.

### Check Seeded Rules:

```sql
SELECT rule_name, event_type, points_change, enabled
FROM reputation_rules
ORDER BY points_change DESC;
```

Should return 6 rules.

### Check Triggers Exist:

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%reputation%'
ORDER BY trigger_name;
```

Should return 4 triggers:
- `trigger_reputation_verification_approval` on `verifications`
- `trigger_reputation_verification_rejection` on `verifications`
- `trigger_reputation_verification_submission` on `verifications`
- `trigger_reputation_vote_received` on `votes`

---

## **Test Reputation Engine**

### Test Automatic Reputation Update:

1. **Submit a test verification** (via the app or SQL):
```sql
-- This should automatically add +1 point to the submitter
INSERT INTO verifications (promise_id, submitted_by, verdict, evidence_text, status)
VALUES (
  '[PROMISE_ID]',
  '[USER_ID]',
  'fulfilled',
  'Test evidence for reputation engine',
  'pending'
);
```

2. **Check reputation history**:
```sql
SELECT
  u.username,
  rh.points_change,
  rh.reason,
  rh.event_type,
  rh.previous_score,
  rh.new_score
FROM reputation_history rh
JOIN users u ON rh.user_id = u.id
ORDER BY rh.created_at DESC
LIMIT 5;
```

Should show the +1 point for verification_submitted.

### Test Decay Function:

```sql
SELECT apply_reputation_decay();
```

**Expected**: Returns `(null)` with NOTICE: "Reputation decay applied at [timestamp]"

---

## **How It Works**

### Automatic Reputation Updates:

1. **User submits verification** → Trigger fires → +1 point added
2. **Admin approves verification** → Trigger fires → +10 points added
3. **Admin rejects verification** → Trigger fires → -15 points deducted
4. **Someone upvotes verification** → Trigger fires → +1 point to submitter
5. **Someone downvotes verification** → Trigger fires → -1 point to submitter

### Reputation History:

Every single reputation change is logged with:
- Points changed (+/-)
- Reason (human-readable)
- Event type (for analytics)
- Previous and new scores
- Timestamp

### Reputation Decay:

- **Trigger**: Users inactive for 30+ days
- **Decay rate**: -1 point per 30 days of inactivity
- **Max decay per run**: -10 points (prevents huge drops)
- **Example**: User inactive for 90 days → loses 3 points

---

## **Configuration (SuperAdmin Only)**

### View/Edit Rules via Admin Panel:

1. Go to `/admin/reputation` in the app
2. Click "Edit" on any rule
3. Change points, description, or enable/disable
4. Click "Save"

### Or via SQL:

```sql
-- Change points for verification approval
UPDATE reputation_rules
SET points_change = 15
WHERE rule_name = 'verification_approved';

-- Disable a rule
UPDATE reputation_rules
SET enabled = false
WHERE rule_name = 'helpful_vote_received';
```

---

## **Important Notes**

### Backward Compatibility:

The old `update_user_reputation()` function still works but now uses the new system:
```sql
SELECT update_user_reputation(
  '[USER_ID]'::UUID,
  10,
  'Manual admin adjustment'
);
```

This will:
- Update the user's score
- Create a history entry
- Send notification if change >= 5 points

### Scheduling Decay:

**Recommendation**: Run decay daily via a cron job or Supabase Edge Function:
```sql
SELECT apply_reputation_decay();
```

Or manually from `/admin/reputation` page using the "Apply Decay" button.

### Notifications:

Users receive in-app notifications when:
- Reputation changes by ≥5 points (approval, rejection, fraud penalty)
- Smaller changes (+1 votes) don't trigger notifications to avoid spam

---

## **TL;DR**

1. Run `009_reputation_engine.sql` ✅
2. Verify tables, rules, and triggers exist ✅
3. Test by submitting a verification (should auto-add +1 point) ✅
4. Configure rules at `/admin/reputation` if needed ✅
5. Schedule daily decay runs ✅

---

## **Benefits**

✅ **Fully automated** - No manual reputation updates needed
✅ **Transparent** - Complete history of all changes
✅ **Configurable** - Change points without code changes
✅ **Fair decay** - Prevents inactive account exploitation
✅ **Event-driven** - Updates happen instantly on user actions
✅ **Auditable** - Every change tracked with reason and timestamp
