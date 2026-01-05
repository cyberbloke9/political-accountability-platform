# 015_sybil_attack_detection.sql

## Overview
Implements comprehensive Sybil attack detection - identifying coordinated fake accounts, suspicious voting patterns, rapid submissions, and other gaming behaviors. Flags suspicious accounts for admin review and applies reputation penalties.

## Tables Created

### `user_activity_flags`
Tracks flagged suspicious behavior.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to flagged user |
| flag_type | VARCHAR(50) | Type of suspicious behavior |
| flag_reason | TEXT | Detailed explanation |
| severity | VARCHAR(20) | low, medium, high, critical |
| auto_detected | BOOLEAN | Was it automated? |
| flagged_by | UUID | Admin who flagged (if manual) |
| status | VARCHAR(20) | active, resolved, dismissed, banned |
| resolved_at | TIMESTAMP | When resolved |
| resolved_by | UUID | Admin who resolved |
| admin_notes | TEXT | Admin comments |
| created_at | TIMESTAMP | When flagged |

### `voting_relationships`
Tracks who votes on whose verifications.

| Column | Type | Description |
|--------|------|-------------|
| voter_id | UUID | User casting votes |
| verification_submitter_id | UUID | User receiving votes |
| vote_count | INT | Total votes cast |
| last_vote_at | TIMESTAMP | Most recent vote |

**Primary Key:** (voter_id, verification_submitter_id)

## Detection Functions

### 1. `detect_rapid_submissions()`
Finds users submitting verifications too quickly.

**Criteria:** >10 verifications in 1 hour
**Severity:** High

### 2. `detect_high_self_verification_rate()`
Finds users who primarily verify their own promises.

**Criteria:**
- At least 3 verifications
- >50% are self-verifications

**Severity:** Critical

### 3. `detect_coordinated_voting()`
Finds users who only vote on one person's verifications.

**Criteria:**
- At least 5 votes on one person
- >70% of all votes go to that person

**Severity:** High

### 4. `detect_high_rejection_rate()`
Finds users with poor quality submissions.

**Criteria:**
- At least 5 reviewed verifications
- >70% rejection rate

**Severity:** Medium

### 5. `detect_suspicious_new_accounts()`
Finds new accounts with unusual activity levels.

**Criteria:**
- Account less than 7 days old
- 5+ verifications OR 5+ promises

**Severity:** High

## Master Detection Function

### `run_sybil_detection()`
Runs all 5 detection algorithms and auto-flags suspicious accounts.

**Returns:** Number of flags created

**Should run:** Periodically (recommended: every 6 hours)

## Penalty System

### `calculate_flag_penalty(user_id UUID)`
Calculates reputation penalty based on active flags.

| Severity | Penalty per Flag |
|----------|-----------------|
| critical | -100 |
| high | -50 |
| medium | -25 |
| low | -10 |

### `calculate_citizen_score_with_penalties(user_id UUID)`
Returns citizen score minus flag penalties.

## Views

### `flagged_accounts_summary`
Dashboard view of all flagged accounts.

| Column | Description |
|--------|-------------|
| user_id, username, email | User info |
| citizen_score | Base score |
| score_penalty | Total penalty |
| adjusted_score | Score after penalties |
| total_flags | All flags |
| active_flags | Currently active |
| critical_flags | Critical severity |
| high_flags | High severity |
| last_flagged_at | Most recent flag |
| flag_types | Comma-separated types |

### `recent_suspicious_activity`
Recent flags from last 7 days.

| Column | Description |
|--------|-------------|
| flag_id | Flag ID |
| user_id, username | User info |
| flag_type, flag_reason | What was detected |
| severity, status | Current state |
| created_at | When flagged |

## Admin Functions

### `admin_resolve_flag(flag_id, new_status, admin_notes, admin_id)`
Resolves or dismisses a flag.

**Statuses:** resolved, dismissed, banned
**Side Effects:** Recalculates user's citizen score

## Row Level Security

| Table | Operation | Policy |
|-------|-----------|--------|
| user_activity_flags | SELECT | Admins only |
| user_activity_flags | ALL | Admins only |
| voting_relationships | SELECT | Admins only |

## Usage Examples

```sql
-- Run detection (schedule this!)
SELECT * FROM run_sybil_detection();

-- View flagged accounts
SELECT * FROM flagged_accounts_summary
ORDER BY active_flags DESC;

-- View recent activity
SELECT * FROM recent_suspicious_activity;

-- Resolve a flag
SELECT admin_resolve_flag(
  'flag-uuid',
  'resolved',
  'Legitimate behavior - new user just very active',
  'admin-uuid'
);

-- Dismiss false positive
SELECT admin_resolve_flag(
  'flag-uuid',
  'dismissed',
  'False positive - verified journalist',
  'admin-uuid'
);

-- Check specific user's penalty
SELECT
  username,
  citizen_score as base_score,
  calculate_flag_penalty(id) as penalty,
  calculate_citizen_score_with_penalties(id) as final_score
FROM users
WHERE username = 'suspicious_user';

-- Find coordinated voting rings
SELECT * FROM detect_coordinated_voting();

-- See voting relationships
SELECT
  u1.username as voter,
  u2.username as target,
  vr.vote_count
FROM voting_relationships vr
JOIN users u1 ON vr.voter_id = u1.id
JOIN users u2 ON vr.verification_submitter_id = u2.id
ORDER BY vr.vote_count DESC;
```

## Flag Types

| Type | Description |
|------|-------------|
| `rapid_submissions` | Too many verifications in short time |
| `high_self_verification_rate` | >50% self-verifications |
| `coordinated_voting` | Votes concentrated on one person |
| `high_rejection_rate` | >70% verifications rejected |
| `suspicious_new_account` | New account with unusual activity |

## Scheduling
```bash
# Recommended: Run every 6 hours
# In Supabase Edge Function or external cron:
SELECT * FROM run_sybil_detection();
```

## Design Rationale

1. **Multi-factor detection** - Combines multiple signals for accuracy
2. **Transparent penalties** - Users see adjusted scores
3. **Admin discretion** - Flags require human review before action
4. **Voting network analysis** - Detects collusion rings
5. **New account monitoring** - Catches quick gaming attempts
