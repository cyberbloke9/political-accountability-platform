# 013_self_verification_prevention.sql

## Overview
Implements detection and prevention of self-verification gaming - where users verify their own promises to inflate their reputation. Self-verifications are flagged, require manual admin approval, and contribute minimal points.

## Schema Changes

### New Columns on `verifications`
| Column | Type | Description |
|--------|------|-------------|
| is_self_verification | BOOLEAN | TRUE if user verified their own promise |
| is_status_update | BOOLEAN | TRUE if this is a status update, not initial |

## Tables Created

### `verification_relationships`
Tracks relationship between promise creator and verification submitter.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| verification_id | UUID | FK to verifications (unique) |
| promise_id | UUID | FK to promises |
| promise_submitter_id | UUID | Who created the promise |
| verification_submitter_id | UUID | Who submitted the verification |
| is_self_verification | BOOLEAN | Are they the same person? |
| flagged_at | TIMESTAMP | When flagged (if self-verify) |
| created_at | TIMESTAMP | Record creation time |

## Detection Logic

### Trigger: `check_self_verification()`
**Fires:** BEFORE INSERT on verifications

**Detection:**
1. Gets promise creator from `promises.created_by`
2. Compares to verification submitter
3. If same person → flags as self-verification

**Actions for Self-Verifications:**
- Sets `is_self_verification = TRUE`
- **Forces manual approval** (overrides auto-approval)
- Creates `verification_relationships` record with `flagged_at`

## Views

### `user_self_verification_stats`
Statistics on self-verification behavior per user.

| Column | Description |
|--------|-------------|
| user_id | User ID |
| email | User email |
| username | User username |
| total_verifications | All verifications |
| self_verifications | Self-verifications count |
| community_verifications | Third-party verifications |
| self_verification_percentage | % self-verified |
| last_self_verification_at | Most recent self-verify |

## Functions

### `get_pending_self_verifications()`
Returns all pending self-verifications for admin review queue.

**Returns:**
- verification_id
- promise_title
- promise_submitter (username)
- verification_submitter (username)
- verdict, evidence_text
- submitted_at
- helpful_votes, not_helpful_votes

### `auto_approve_verification()` (Updated)
Modified to **NEVER** auto-approve self-verifications:
```sql
IF NEW.is_self_verification = TRUE THEN
  RETURN NEW;  -- Keep as pending, skip auto-approval
END IF;
```

## Row Level Security
| Table | Operation | Policy |
|-------|-----------|--------|
| verification_relationships | SELECT | Authenticated users (transparency) |

## Backfill Behavior
The migration automatically:
1. Populates `verification_relationships` for all existing verifications
2. Updates `is_self_verification` flag on existing verifications
3. Runs analysis queries to show current self-verification rates

## Impact on Reputation (from Migration 014)
Self-verifications receive only **5 points** vs 25-50 for legitimate verifications.

## Usage Examples

```sql
-- Check self-verification stats for all users
SELECT * FROM user_self_verification_stats
WHERE total_verifications >= 3
ORDER BY self_verification_percentage DESC;

-- Get pending self-verifications for review
SELECT * FROM get_pending_self_verifications();

-- Find potential gamers (high self-verify rate)
SELECT username, self_verification_percentage
FROM user_self_verification_stats
WHERE self_verification_percentage > 50
AND total_verifications >= 5;

-- Check if specific verification is self-verify
SELECT vr.is_self_verification
FROM verification_relationships vr
WHERE vr.verification_id = 'verification-uuid';
```

## Admin Workflow
1. View `/admin/verifications` queue
2. Self-verifications are highlighted
3. Manual review required - check evidence quality
4. Approve only if evidence is genuinely legitimate
5. Consider reputation penalty for serial self-verifiers

## Why This Matters
Without this protection, users could:
- Submit a promise
- Immediately verify it themselves
- Gain reputation from self-approval
- Game the leaderboard

This migration closes that loophole.
