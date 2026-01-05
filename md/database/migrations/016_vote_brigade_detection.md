# 016_vote_brigade_detection.sql

## Overview
Detects coordinated voting groups (vote brigades) where multiple accounts vote identically on the same verifications within suspicious time windows. Part of the anti-gaming infrastructure.

## Tables Created

### `vote_brigade_patterns`
Stores detected brigade patterns for admin review.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_ids | UUID[] | Array of users in the brigade |
| verification_ids | UUID[] | Verifications targeted |
| detection_timestamp | TIMESTAMPTZ | When detected |
| confidence_score | DECIMAL(3,2) | 0.0-1.0 pattern strength |
| pattern_type | TEXT | Type of brigade detected |
| pattern_details | JSONB | Detailed analysis data |
| flagged | BOOLEAN | Is it flagged for review? |
| reviewed | BOOLEAN | Has admin reviewed? |
| reviewed_by | UUID | Admin who reviewed |
| reviewed_at | TIMESTAMPTZ | Review timestamp |
| resolution | TEXT | confirmed, false_positive, pending |
| admin_notes | TEXT | Admin comments |

### `vote_correlations`
Tracks voting correlation between user pairs.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id_1, user_id_2 | UUID | User pair (user_id_1 < user_id_2) |
| total_same_votes | INTEGER | Votes where both voted same |
| total_compared_votes | INTEGER | Total votes compared |
| correlation_percentage | DECIMAL(5,2) | % match rate |
| avg_vote_time_diff_seconds | INTEGER | Avg time between votes |
| votes_within_1min | INTEGER | Near-simultaneous votes |
| votes_within_5min | INTEGER | Close votes |
| last_calculated_at | TIMESTAMPTZ | Last analysis time |

## Pattern Types

| Type | Description |
|------|-------------|
| `identical_voting` | Same users voting same way |
| `time_correlation` | Votes within 1 minute |
| `coordinated_activity` | Combined patterns |
| `suspicious_velocity` | Unusually fast voting |

## Detection Criteria

For brigades to be flagged:
- **Identical voting**: Same users vote identically on 5+ verifications
- **Time correlation**: Votes within 1 minute window
- **High correlation**: >80% vote match between users
- **Time proximity**: >5 votes within 1 minute of each other

## Functions

### `get_brigade_involved_users(user_id UUID)`
Find all brigade patterns involving a specific user.

**Returns:**
- brigade_id
- user_ids (all involved)
- verification_ids (targeted)
- confidence_score
- pattern_type
- detection_timestamp

### `get_suspicious_correlations(min_percentage DECIMAL)`
Find user pairs with high voting correlation.

**Default threshold:** 80%

**Returns:**
- user_id_1, user_id_2
- username_1, username_2
- correlation_percentage
- total_same_votes
- votes_within_1min

## Indexes

### vote_brigade_patterns
- `idx_brigade_patterns_flagged` - Flagged patterns by date
- `idx_brigade_patterns_confidence` - By confidence score
- `idx_brigade_patterns_reviewed` - Review status
- `idx_brigade_patterns_pattern_type` - By pattern type
- `idx_brigade_patterns_user_ids` - GIN index for array search
- `idx_brigade_patterns_verification_ids` - GIN index for array search

### vote_correlations
- `idx_vote_correlations_user1/user2` - By user
- `idx_vote_correlations_percentage` - High correlation (>70%)
- `idx_vote_correlations_time_proximity` - Many rapid votes (>5)

## Usage Examples

```sql
-- Find brigades involving a specific user
SELECT * FROM get_brigade_involved_users('user-uuid');

-- Find suspicious correlations (>80% match)
SELECT * FROM get_suspicious_correlations(80.0);

-- View unreviewed brigade patterns
SELECT *
FROM vote_brigade_patterns
WHERE flagged = TRUE
AND reviewed = FALSE
ORDER BY confidence_score DESC;

-- Check correlation between two users
SELECT *
FROM vote_correlations
WHERE (user_id_1 = 'user-1' AND user_id_2 = 'user-2')
   OR (user_id_1 = 'user-2' AND user_id_2 = 'user-1');

-- Admin review a pattern
UPDATE vote_brigade_patterns
SET
  reviewed = TRUE,
  reviewed_by = 'admin-uuid',
  reviewed_at = NOW(),
  resolution = 'confirmed',
  admin_notes = 'Clear coordinated voting pattern'
WHERE id = 'pattern-uuid';

-- Find users with highest correlation
SELECT
  username_1,
  username_2,
  correlation_percentage,
  votes_within_1min
FROM get_suspicious_correlations(70.0)
ORDER BY correlation_percentage DESC
LIMIT 20;
```

## Related Migrations
- **016_part2**: Brigade detection functions
- **016_part3**: Brigade RLS policies
- **016_part4**: Bug fixes
- **016_part5**: Admin check fix

## Note
This migration creates the schema only. The actual detection algorithms are implemented in migration 016 parts 2-5.
