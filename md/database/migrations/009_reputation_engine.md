# 009_reputation_engine.sql

## Overview
Implements a comprehensive, rule-based reputation engine with full history tracking, configurable scoring rules, and automatic reputation decay for inactive users.

## Tables Created

### `reputation_rules`
Configurable rules defining point values for different events.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| rule_name | VARCHAR(100) | Unique rule identifier |
| event_type | VARCHAR(50) | Event that triggers this rule |
| points_change | INTEGER | Points to add/subtract |
| description | TEXT | Human-readable description |
| enabled | BOOLEAN | Is rule active? |
| created_at | TIMESTAMP | When created |
| updated_at | TIMESTAMP | Last modified |

### `reputation_history`
Complete audit trail of all reputation changes.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| points_change | INTEGER | Points added/subtracted |
| reason | VARCHAR(200) | Human-readable reason |
| event_type | VARCHAR(50) | Links to rule |
| related_id | UUID | Related entity (verification, vote) |
| previous_score | INTEGER | Score before change |
| new_score | INTEGER | Score after change |
| created_at | TIMESTAMP | When change occurred |

### `user_activity_status`
Tracks user activity for decay calculations.

| Column | Type | Description |
|--------|------|-------------|
| user_id | UUID | Primary key, FK to users |
| last_verification_at | TIMESTAMP | Last verification submitted |
| last_vote_at | TIMESTAMP | Last vote cast |
| last_active_at | TIMESTAMP | Last activity of any kind |
| total_verifications | INTEGER | Lifetime verification count |
| total_votes | INTEGER | Lifetime vote count |
| inactive_days | INTEGER | Days since last activity |
| updated_at | TIMESTAMP | Last update |

## Default Reputation Rules

| Rule Name | Event Type | Points | Description |
|-----------|------------|--------|-------------|
| verification_submitted | verification_submitted | +1 | Submit a verification |
| verification_approved | verification_approved | +10 | Verification approved |
| verification_rejected | verification_rejected | -15 | Verification rejected |
| helpful_vote_received | helpful_vote_received | +1 | Receive an upvote |
| unhelpful_vote_received | unhelpful_vote_received | -1 | Receive a downvote |
| fraud_confirmed | fraud_confirmed | -50 | Confirmed fraud |

## Core Functions

### `update_reputation_with_history(target_user_id, points_change, reason, event_type, related_id)`
Updates reputation with full audit trail.

**Actions:**
1. Gets current score
2. Calculates new score (minimum 0)
3. Updates `users.citizen_score`
4. Inserts record into `reputation_history`
5. Creates notification if |points| >= 5

### `update_user_reputation(target_user_id, points_change, reason)`
Wrapper function that redirects to `update_reputation_with_history`.

### `apply_reputation_decay()`
Reduces reputation for inactive users.

**Criteria:**
- 30+ days since last activity
- Current score > 0

**Decay Rate:**
- -1 point per 30 days of inactivity
- Maximum -10 points per run (prevents huge drops)

## Triggers

### `trigger_reputation_verification_approval`
**On:** verifications UPDATE
**Fires when:** status changes to 'approved'
**Action:** Awards points from `verification_approved` rule

### `trigger_reputation_verification_rejection`
**On:** verifications UPDATE
**Fires when:** status changes to 'rejected'
**Action:** Deducts points from `verification_rejected` rule

### `trigger_reputation_verification_submission`
**On:** verifications INSERT
**Action:**
1. Awards points from `verification_submitted` rule
2. Updates `user_activity_status`

### `trigger_reputation_vote_received`
**On:** votes INSERT
**Action:**
1. Awards/deducts points to verification owner
2. Updates voter's `user_activity_status`

## Data Flow

```
User submits verification
        ↓
trigger_reputation_verification_submission
        ↓
Looks up 'verification_submitted' rule (+1)
        ↓
update_reputation_with_history()
        ↓
Updates users.citizen_score
        ↓
Inserts reputation_history record
        ↓
Updates user_activity_status
```

## Row Level Security

| Table | Operation | Policy |
|-------|-----------|--------|
| reputation_rules | SELECT | Public |
| reputation_rules | ALL | SuperAdmins only |
| reputation_history | SELECT | Public |
| reputation_history | INSERT | System |
| user_activity_status | SELECT | Public |
| user_activity_status | ALL | System |

## Usage Examples

```sql
-- View user's reputation history
SELECT * FROM reputation_history
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;

-- View current reputation rules
SELECT rule_name, points_change, enabled
FROM reputation_rules
ORDER BY points_change DESC;

-- Modify a rule (SuperAdmin only)
UPDATE reputation_rules
SET points_change = 15
WHERE rule_name = 'verification_approved';

-- Disable a rule
UPDATE reputation_rules
SET enabled = false
WHERE rule_name = 'unhelpful_vote_received';

-- Run reputation decay (schedule daily)
SELECT apply_reputation_decay();

-- Manual reputation adjustment
SELECT update_reputation_with_history(
  'user-uuid',
  25,
  'Community recognition bonus',
  'manual_adjustment',
  NULL
);

-- Get user activity status
SELECT * FROM user_activity_status
WHERE user_id = 'user-uuid';
```

## Scheduling
- `apply_reputation_decay()` should run daily via cron or Supabase Edge Function

## Design Rationale
1. **Configurable Rules**: Admins can tune point values without code changes
2. **Full History**: Every change is auditable
3. **Activity Tracking**: Enables gamification and decay
4. **Notification Threshold**: Only notifies for significant changes (>=5 points)
5. **Decay Prevention**: Caps decay at -10/run to avoid shocking users
