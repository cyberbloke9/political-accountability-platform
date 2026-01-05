# 014_weighted_trust_system.sql

## Overview
Implements a hierarchical trust level system where verifications from more trusted users carry more weight. Reduces the impact of gaming by new/untrusted accounts while rewarding proven contributors.

## Schema Changes

### New Columns on `verifications`
| Column | Type | Range | Description |
|--------|------|-------|-------------|
| trust_level | VARCHAR(20) | admin, trusted_community, community, untrusted | Submitter's trust tier |
| verification_weight | DECIMAL(3,2) | 0.0-5.0 | Weight multiplier for consensus |

## Trust Level Hierarchy

| Level | Weight | Requirements |
|-------|--------|--------------|
| **admin** | 3.0x | Has any admin role |
| **trusted_community** | 2.0x | 500+ score, 10+ approvals, <20% rejection, 30+ days |
| **community** | 1.0x | 100+ score, <50% rejection, 7+ days |
| **untrusted** | 0.5x | New users, high rejection, or low score |
| **self-verification** | 0.1x | User verified their own promise |

## Functions

### `calculate_trust_level(user_id UUID)`
**Returns:** VARCHAR(20) - Trust level

**Algorithm:**
1. Check if user is admin → 'admin'
2. Get approval/rejection counts and rates
3. Get citizen score and account age
4. Apply criteria hierarchy

### `calculate_verification_weight(trust_level, is_self_verification)`
**Returns:** DECIMAL(3,2) - Weight

**Logic:**
```sql
IF is_self_verification = TRUE THEN
  RETURN 0.1;  -- Minimal weight
END IF;

RETURN CASE trust_level
  WHEN 'admin' THEN 3.0
  WHEN 'trusted_community' THEN 2.0
  WHEN 'community' THEN 1.0
  WHEN 'untrusted' THEN 0.5
END;
```

### `assign_verification_trust_level()` (Trigger)
**Fires:** BEFORE INSERT on verifications
**Action:** Calculates and assigns trust_level and verification_weight

### `calculate_citizen_score(user_id UUID)`
Updated to use weighted points:

| Source | Points |
|--------|--------|
| Admin-approved verification | 50 |
| Trusted community approval | 40 |
| Community/untrusted approval | 25 |
| Self-verified (approved) | 5 |
| Helpful vote cast | 10 |
| Promise submitted | 20 |

### `admin_set_user_trust_level(user_id, trust_level, admin_id)`
Allows admins to manually override trust level (e.g., for verified journalists).

## Views

### `verification_trust_stats`
Distribution of verifications across trust levels.

| Column | Description |
|--------|-------------|
| trust_level | The trust tier |
| verification_count | Total verifications |
| approved_count | Approved verifications |
| rejected_count | Rejected verifications |
| pending_count | Pending verifications |
| avg_weight | Average weight |
| unique_submitters | Distinct users |

### `user_trust_progression`
Shows user progression and requirements for next level.

| Column | Description |
|--------|-------------|
| user_id | User ID |
| username | Username |
| citizen_score | Current score |
| current_trust_level | Calculated trust level |
| total_verifications | All submissions |
| approved_verifications | Approved count |
| rejected_verifications | Rejected count |
| rejection_rate_percentage | % rejected |
| account_age_days | Days since registration |
| next_level_requirements | What's needed to advance |

## Backfill
Migration automatically:
1. Calculates trust level for all existing verifications
2. Assigns verification weights
3. Recalculates all citizen scores with new weighted system

## Usage Examples

```sql
-- View trust level distribution
SELECT * FROM verification_trust_stats;

-- See what users need for next level
SELECT
  username,
  current_trust_level,
  citizen_score,
  next_level_requirements
FROM user_trust_progression
WHERE current_trust_level != 'admin';

-- Find users close to trusted_community
SELECT *
FROM user_trust_progression
WHERE current_trust_level = 'community'
AND citizen_score >= 400  -- Close to 500
AND approved_verifications >= 8;  -- Close to 10

-- Admin: Promote verified journalist to trusted
SELECT admin_set_user_trust_level(
  'user-uuid',
  'trusted_community',
  'admin-uuid'
);

-- Get weighted average verdict for a promise
SELECT
  verdict,
  SUM(verification_weight) as total_weight
FROM verifications
WHERE promise_id = 'promise-uuid'
AND status = 'approved'
GROUP BY verdict
ORDER BY total_weight DESC;
```

## Impact on Consensus

When determining promise status, weighted consensus matters:
- 1 admin verification (3.0) = 3 community verifications (1.0 each)
- 1 trusted verification (2.0) = 4 untrusted verifications (0.5 each)
- 1 self-verification (0.1) = almost no impact

## Trust Progression Path
```
untrusted (new user, 0.5x)
    ↓
community (100+ score, 7+ days, 1.0x)
    ↓
trusted_community (500+ score, 10+ approvals, 30+ days, 2.0x)
    ↓
admin (assigned by SuperAdmin, 3.0x)
```

## Design Rationale
1. **Encourages quality** - Better verifications = higher trust = more impact
2. **Discourages gaming** - Low-quality users have minimal influence
3. **Rewards loyalty** - Long-term contributors gain trust
4. **Transparent** - Users can see their level and what's needed
