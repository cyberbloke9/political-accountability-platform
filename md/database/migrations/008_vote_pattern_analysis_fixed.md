# 008_vote_pattern_analysis_fixed.sql

## Overview
Implements comprehensive vote pattern analysis for detecting partisan bias and coordinated voting (vote brigading) in India's multi-party democracy context. Tracks voting history by political party to identify suspicious patterns.

## Schema Changes

### New Column on `promises`
```sql
ALTER TABLE promises ADD COLUMN IF NOT EXISTS politician_party VARCHAR(200);
```
Stores the political party of the promise maker (BJP, Congress, AAP, etc.)

## Tables Created

### `vote_history`
Detailed record of all votes with denormalized party info for fast analysis.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| verification_id | UUID | FK to verifications |
| vote_type | VARCHAR(20) | 'upvote' or 'downvote' |
| promise_id | UUID | Denormalized for queries |
| politician_name | VARCHAR(200) | Denormalized |
| politician_party | VARCHAR(200) | Denormalized |
| created_at | TIMESTAMP | When vote was cast |

**Constraint:** UNIQUE(user_id, verification_id)

### `user_party_bias`
Aggregated voting patterns per user per party.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| party_name | VARCHAR(200) | Political party |
| upvotes_count | INTEGER | Upvotes for this party |
| downvotes_count | INTEGER | Downvotes for this party |
| total_votes | INTEGER | Total votes |
| bias_score | DECIMAL(3,2) | -1.00 to +1.00 |
| last_updated | TIMESTAMP | Last calculation |

**Bias Score Scale:**
- `-1.00` = Always downvotes this party
- `0.00` = Neutral (equal up/down)
- `+1.00` = Always upvotes this party

### `coordinated_voting_groups`
Suspected vote brigading groups.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| group_members | UUID[] | Array of user IDs |
| verification_ids | UUID[] | Verifications voted on |
| vote_type | VARCHAR(20) | Direction of coordinated votes |
| coordination_score | DECIMAL(3,2) | 0.00 to 1.00 |
| time_window_minutes | INTEGER | How fast they voted |
| detected_at | TIMESTAMP | When detected |

## Triggers

### `trigger_record_vote_history`
**On:** `votes` table
**Events:** INSERT, UPDATE
**Function:** `record_vote_in_history()`

Automatically records every vote with denormalized politician/party info:
1. Looks up the verification's promise
2. Gets politician_name and politician_party
3. Inserts/updates vote_history record

## Analysis Functions

### `calculate_user_party_bias(target_user_id UUID)`
Calculates a user's voting bias for each party they've voted on.

**Algorithm:**
```
bias_score = (upvotes - downvotes) / total_votes
```

**Example:**
- User voted 8 upvotes, 2 downvotes on BJP promises
- Bias = (8-2)/10 = 0.60 (moderately pro-BJP)

### `detect_extreme_partisan_bias()`
Flags users with extremely one-sided voting patterns.

**Detection Criteria:**
- Minimum 10 votes on a party
- Bias score > 0.80 OR < -0.80

**Severity Scale:**
| Condition | Severity |
|-----------|----------|
| |bias| > 0.95 AND votes > 50 | high |
| |bias| > 0.90 | medium |
| |bias| > 0.80 | low |

### `detect_coordinated_voting()`
Identifies groups voting together suspiciously quickly.

**Detection Criteria:**
- 5+ votes on same verification in 24 hours
- All same vote type (all upvotes or all downvotes)

**Coordination Score by Time:**
| Time Spread | Score |
|-------------|-------|
| < 5 minutes | 0.95 |
| < 30 minutes | 0.80 |
| < 1 hour | 0.65 |
| > 1 hour | 0.50 (not flagged) |

Only flags if score >= 0.65

### `run_vote_pattern_analysis()`
Master function that runs all analysis:
1. Calculates party bias for all users active in last 30 days
2. Runs `detect_extreme_partisan_bias()`
3. Runs `detect_coordinated_voting()`

## Row Level Security

| Table | Operation | Policy |
|-------|-----------|--------|
| vote_history | SELECT | Public (transparency) |
| vote_history | INSERT | System |
| user_party_bias | SELECT | Public (transparency) |
| user_party_bias | ALL | System |
| coordinated_voting_groups | SELECT | Admins only |
| coordinated_voting_groups | INSERT | System |

## Usage Examples

```sql
-- Get a user's party bias breakdown
SELECT party_name, bias_score, total_votes
FROM user_party_bias
WHERE user_id = 'user-uuid'
ORDER BY total_votes DESC;

-- Find most biased users for BJP
SELECT u.username, upb.bias_score, upb.total_votes
FROM user_party_bias upb
JOIN users u ON upb.user_id = u.id
WHERE upb.party_name = 'BJP'
AND ABS(upb.bias_score) > 0.7
ORDER BY ABS(upb.bias_score) DESC;

-- View suspected brigading groups
SELECT * FROM coordinated_voting_groups
WHERE coordination_score > 0.80
ORDER BY detected_at DESC;

-- Run analysis manually
SELECT run_vote_pattern_analysis();

-- See voting history for a verification
SELECT
  vh.vote_type,
  u.username,
  vh.created_at
FROM vote_history vh
JOIN users u ON vh.user_id = u.id
WHERE vh.verification_id = 'verification-uuid'
ORDER BY vh.created_at;
```

## Indian Multi-Party Context
Designed to detect bias across all major parties:
- BJP (Bharatiya Janata Party)
- INC (Indian National Congress)
- AAP (Aam Aadmi Party)
- TMC (Trinamool Congress)
- DMK (Dravida Munnetra Kazhagam)
- And any other party stored in `politician_party`

## Scheduling
Run `run_vote_pattern_analysis()` periodically:
- Every 6 hours for active fraud detection
- Daily for comprehensive bias analysis
