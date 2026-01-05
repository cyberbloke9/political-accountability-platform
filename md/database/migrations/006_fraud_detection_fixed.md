# 006_fraud_detection_fixed.sql

## Overview
Implements an automated fraud detection system to identify suspicious activity, vote manipulation, low-quality content, and spam. Uses heuristic algorithms to flag potential issues for admin review.

## Tables Created

### `fraud_flags`
Tracks detected suspicious activity.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| flag_type | VARCHAR(50) | Type of fraud detected |
| target_type | VARCHAR(50) | 'verification', 'user', 'vote' |
| target_id | UUID | ID of flagged item |
| severity | VARCHAR(20) | 'low', 'medium', 'high', 'critical' |
| status | VARCHAR(20) | 'pending', 'reviewed', 'confirmed', 'dismissed' |
| confidence_score | DECIMAL(3,2) | 0.00 to 1.00 confidence level |
| details | JSONB | Specific detection details |
| auto_detected | BOOLEAN | Was it automated? |
| reviewed_by | UUID | FK to users, admin who reviewed |
| reviewed_at | TIMESTAMP | When reviewed |
| created_at | TIMESTAMP | When flagged |

### `user_activity_log`
Records user activity for pattern analysis.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| activity_type | VARCHAR(50) | 'verification_submit', 'vote', 'comment' |
| target_type | VARCHAR(50) | What was acted on |
| target_id | UUID | ID of target |
| ip_address | VARCHAR(45) | IPv4 or IPv6 |
| user_agent | TEXT | Browser/client info |
| metadata | JSONB | Additional context |
| created_at | TIMESTAMP | When activity occurred |

## Flag Types

| Flag Type | Description | Detection Trigger |
|-----------|-------------|-------------------|
| `spam` | Rapid content submission | >5 verifications in 1 hour |
| `vote_manipulation` | Suspicious voting patterns | >95% or <5% vote ratio |
| `low_quality` | Poor evidence quality | Short text, no sources, AI phrases |
| `duplicate` | Plagiarized content | Exact match with other verifications |
| `coordinated_voting` | Vote brigading | Fast group voting patterns |

## Detection Functions

### `detect_rapid_submissions()`
Finds users submitting verifications too quickly (spam behavior).

**Criteria:**
- More than 5 verifications in last hour
- Severity scales: 5-10 = medium, 10-20 = high, 20+ = critical
- Confidence: 0.50 + (count / 40), max 0.95
- Won't re-flag if pending flag exists within 24 hours

### `detect_low_quality_verifications()`
Identifies verifications with quality issues.

**Quality Score Factors:**
| Issue | Score Addition |
|-------|----------------|
| Evidence < 50 characters | +0.20 |
| No source URLs | +0.15 |
| AI-generated phrases detected | +0.20 |

**Flagged if:** Quality score >= 0.70

**AI Phrase Detection:**
- "as an ai"
- "i cannot"
- "i apologize"
- "furthermore"
- "moreover"
- "in conclusion"

### `detect_vote_manipulation()`
Finds verifications with suspiciously extreme vote ratios.

**Criteria:**
- At least 10 total votes
- Vote ratio > 95% upvotes OR < 5% upvotes
- Higher confidence for >98% or <2%

### `detect_duplicate_evidence()`
Finds verifications with identical evidence text (plagiarism).

**Severity Scale:**
| Duplicate Count | Severity |
|-----------------|----------|
| 1 | low |
| 2-3 | medium |
| 4+ | high |

### `run_fraud_detection()`
Master function that runs all detection algorithms:
1. `detect_rapid_submissions()`
2. `detect_low_quality_verifications()`
3. `detect_vote_manipulation()`
4. `detect_duplicate_evidence()`

### `review_fraud_flag(flag_id, admin_user_id, new_status, admin_notes)`
Admin reviews and resolves a fraud flag.

**Actions:**
1. Updates flag status to 'confirmed' or 'dismissed'
2. Records reviewer and timestamp
3. Adds admin notes to metadata
4. Logs in `admin_actions`
5. If confirmed + high/critical severity + user target → deduct reputation

**Reputation Penalties:**
| Severity | Points |
|----------|--------|
| Critical | -50 |
| High | -25 |
| Other | -10 |

## Row Level Security

| Table | Operation | Policy |
|-------|-----------|--------|
| fraud_flags | SELECT | Admins only |
| fraud_flags | UPDATE | Admins only |
| fraud_flags | INSERT | System (open) |
| user_activity_log | ALL | System only (no public access) |

## Usage Examples

```sql
-- Run fraud detection manually
SELECT run_fraud_detection();

-- View pending fraud flags
SELECT * FROM fraud_flags
WHERE status = 'pending'
ORDER BY severity DESC, created_at DESC;

-- Review a flag
SELECT review_fraud_flag(
  'flag-uuid',
  'admin-uuid',
  'confirmed',
  'Verified spam behavior, user warned'
);

-- Get high-severity flags
SELECT ff.*, u.username
FROM fraud_flags ff
LEFT JOIN users u ON ff.target_id = u.id
WHERE ff.severity IN ('high', 'critical')
AND ff.status = 'pending';
```

## Scheduling Recommendations
Run `run_fraud_detection()` periodically:
- Every 15 minutes for spam detection
- Every hour for quality/duplicate checks
- Daily for vote manipulation analysis

Can be scheduled via Supabase Edge Functions or external cron.
