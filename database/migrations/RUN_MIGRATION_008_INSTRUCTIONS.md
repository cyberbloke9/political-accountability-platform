##Running Migration 008: Vote Pattern Analysis (Multi-Party System)

## Overview

This migration adds vote pattern analysis for India's multi-party democracy, detecting:
- **Partisan bias** toward ANY party (BJP, Congress, AAP, TMC, etc.)
- **Coordinated voting** (vote brigading)
- **Vote wars** (rapid voting battles)

---

## **Migration 008: Vote Pattern Analysis**

### What It Creates:

1. **Schema Changes**:
   - Adds `politician_party` column to `promises` table

2. **Tables**:
   - `vote_history` - Detailed record of all votes with party info
   - `user_party_bias` - Tracks voting patterns per party per user
   - `coordinated_voting_groups` - Suspected vote brigading groups

3. **Functions**:
   - `record_vote_in_history()` - Trigger that logs every vote
   - `calculate_user_party_bias()` - Calculates bias scores per party
   - `detect_extreme_partisan_bias()` - Flags users with >0.8 or <-0.8 bias
   - `detect_coordinated_voting()` - Detects groups voting together quickly
   - `run_vote_pattern_analysis()` - Runs all algorithms

### Running Migration 008:

1. Go to Supabase: https://supabase.com/dashboard/project/avxuugbgewmiccgteghi
2. SQL Editor → New Query
3. Copy entire contents of **`008_vote_pattern_analysis_fixed.sql`**
4. Click **Run**

### Expected Output:

```
ALTER TABLE
CREATE TABLE (3 times)
CREATE INDEX (multiple times)
ALTER TABLE (3 times)
CREATE POLICY (multiple times)
CREATE FUNCTION (5 times)
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
AND table_name IN ('vote_history', 'user_party_bias', 'coordinated_voting_groups');
```

Should return 3 tables.

### Check Functions Exist:

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
  routine_name LIKE '%vote%'
  OR routine_name LIKE '%bias%'
  OR routine_name LIKE '%coordinated%'
)
ORDER BY routine_name;
```

Should return 5 functions.

### Check Trigger Exists:

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_record_vote_history';
```

Should return 1 row: `trigger_record_vote_history` on `votes` table.

---

## **Test Vote Pattern Analysis**

### Run Analysis Manually (in SQL Editor):

```sql
SELECT run_vote_pattern_analysis();
```

**Expected**: Returns `(null)` with NOTICE: "Vote pattern analysis completed at [timestamp]"

### Check for Bias Records:

```sql
SELECT
  u.username,
  upb.party_name,
  upb.bias_score,
  upb.total_votes
FROM user_party_bias upb
JOIN users u ON upb.user_id = u.id
ORDER BY ABS(upb.bias_score) DESC
LIMIT 10;
```

This shows top 10 users with strongest bias (positive or negative).

### Check for Coordinated Groups:

```sql
SELECT
  array_length(group_members, 1) as member_count,
  coordination_score,
  time_window_minutes,
  vote_type
FROM coordinated_voting_groups
ORDER BY detected_at DESC
LIMIT 10;
```

Shows recent coordinated voting groups.

---

## **How It Works**

### Partisan Bias Detection:

1. **Bias Score Calculation**: -1 to +1
   - **+1**: User always upvotes verifications for this party
   - **-1**: User always downvotes verifications for this party
   - **0**: Neutral (equal upvotes/downvotes)

2. **Example**:
   - User votes on 20 BJP verifications: 18 upvotes, 2 downvotes
   - Bias score: (18 - 2) / 20 = **+0.80** (strong pro-BJP bias)

3. **Flagging Threshold**:
   - **Medium**: bias > 0.90 OR < -0.90
   - **High**: bias > 0.95 OR < -0.95 (with >50 votes)

### Coordinated Voting Detection:

1. **Looks for**: 5+ users voting the same way on same verification
2. **Time window matters**:
   - <5 minutes: 0.95 coordination score (very suspicious)
   - <30 minutes: 0.80 score
   - <1 hour: 0.65 score
3. **Creates fraud flag** if score ≥ 0.65

---

## **Important Notes**

### You Need to Add Party Data:

The migration adds `politician_party` column to `promises`, but it's initially NULL. You should:

1. **Update existing promises** with party information:
```sql
UPDATE promises
SET politician_party = 'BJP'
WHERE politician_name LIKE '%Modi%' OR politician_name LIKE '%Shah%';

UPDATE promises
SET politician_party = 'Congress'
WHERE politician_name LIKE '%Gandhi%';

UPDATE promises
SET politician_party = 'AAP'
WHERE politician_name LIKE '%Kejriwal%';

-- Add more as needed
```

2. **Or add party field** to the promise creation form in the frontend

### Vote History Trigger:

The trigger `record_vote_in_history()` runs automatically whenever:
- A user votes on a verification (INSERT into votes table)
- A user changes their vote (UPDATE on votes table)

This means vote_history will populate automatically going forward, but won't backfill old votes.

---

## **TL;DR**

1. Run `008_vote_pattern_analysis_fixed.sql` ✅
2. Verify tables, functions, and trigger exist ✅
3. Update promises with party data ✅
4. Test with `SELECT run_vote_pattern_analysis();` ✅
5. Check `/admin/vote-patterns` page in the app ✅

---

## **Multi-Party System Benefits**

Unlike US-style two-party systems, this handles:
- ✅ Unlimited parties (BJP, Congress, AAP, TMC, YSRCP, etc.)
- ✅ Regional parties (state-specific)
- ✅ Coalition dynamics
- ✅ Independent candidates
- ✅ Party-agnostic detection (works for ANY party)
