# 010_auto_approval_system.sql

## Overview
Implements a **HARSH** auto-approval system for verifications from highly trusted users. Disabled by default and requires SuperAdmin activation. Only the most trusted contributors with perfect track records can bypass manual review.

## Key Philosophy
This system is intentionally strict ("harsh") to maintain platform integrity. Auto-approval is a privilege reserved for proven, top-tier contributors.

## Tables Created

### `auto_approval_rules`
Single-row configuration table for approval criteria.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | UUID | - | Primary key |
| enabled | BOOLEAN | **false** | Global kill switch |
| min_citizen_score | INTEGER | **250** | Minimum reputation |
| min_evidence_length | INTEGER | **250** | Minimum characters |
| require_source_url | BOOLEAN | **true** | Must have sources |
| min_account_age_days | INTEGER | **60** | Account must be 2+ months old |
| min_approved_verifications | INTEGER | **10** | Need 10+ prior approvals |
| max_recent_rejections | INTEGER | **0** | Zero rejections allowed |
| rejection_lookback_days | INTEGER | **30** | Check last 30 days |
| description | TEXT | - | Rule description |
| updated_at | TIMESTAMP | - | Last modified |

### `auto_approval_log`
Audit trail of all auto-approval decisions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| verification_id | UUID | FK to verifications |
| user_id | UUID | FK to users |
| auto_approved | BOOLEAN | Was it approved? |
| reason | TEXT | Decision explanation |
| criteria_met | JSONB | Detailed pass/fail breakdown |
| rules_snapshot | JSONB | Rules at decision time |
| created_at | TIMESTAMP | When checked |

## Default (HARSH) Criteria

| Criterion | Requirement | Rationale |
|-----------|-------------|-----------|
| Citizen Score | >= 250 | Top ~5% of users |
| Evidence Length | >= 250 chars | Substantial evidence |
| Source URLs | Required | Verifiable claims |
| Account Age | >= 60 days | Proven commitment |
| Prior Approvals | >= 10 | Track record |
| Recent Rejections | = 0 | Perfect quality |
| Fraud Flags | None | Clean record |

## Trigger Function: `check_auto_approval()`

**Fires:** BEFORE INSERT on verifications
**Timing:** Checks eligibility before verification is created

### Criteria Checked

1. **System Enabled**: Is auto-approval active?
2. **Citizen Score**: User's reputation >= threshold
3. **Evidence Length**: Text length >= minimum
4. **Source URLs**: Has at least one URL (if required)
5. **Account Age**: Days since registration >= minimum
6. **Approved Count**: Number of prior approved verifications
7. **Recent Rejections**: Rejections in lookback period
8. **Fraud Flags**: No pending or confirmed fraud flags

### Decision Logic

```
IF all criteria met:
  - Set verification status = 'approved'
  - Log to admin_actions
  - Return modified NEW record
ELSE:
  - Keep status = 'pending'
  - Log detailed failure reasons
```

### Criteria Response Format

```json
{
  "citizen_score": {
    "required": 250,
    "actual": 287,
    "passed": true
  },
  "evidence_length": {
    "required": 250,
    "actual": 423,
    "passed": true
  },
  ...
}
```

## Row Level Security

| Table | Operation | Policy |
|-------|-----------|--------|
| auto_approval_rules | SELECT | Public |
| auto_approval_rules | ALL | SuperAdmins only |
| auto_approval_log | SELECT | Admins only |
| auto_approval_log | INSERT | System |

## Usage Examples

```sql
-- Check current rules
SELECT * FROM auto_approval_rules;

-- Enable auto-approval (SuperAdmin only)
UPDATE auto_approval_rules
SET enabled = true
WHERE id = (SELECT id FROM auto_approval_rules LIMIT 1);

-- Adjust thresholds
UPDATE auto_approval_rules
SET
  min_citizen_score = 200,
  min_approved_verifications = 5
WHERE id = (SELECT id FROM auto_approval_rules LIMIT 1);

-- View auto-approval decisions
SELECT
  v.id,
  u.username,
  aal.auto_approved,
  aal.reason
FROM auto_approval_log aal
JOIN verifications v ON aal.verification_id = v.id
JOIN users u ON aal.user_id = u.id
ORDER BY aal.created_at DESC;

-- See why a verification wasn't auto-approved
SELECT
  criteria_met->'citizen_score' as score_check,
  criteria_met->'evidence_length' as length_check,
  criteria_met->'approved_verifications' as approval_check,
  criteria_met->'recent_rejections' as rejection_check
FROM auto_approval_log
WHERE verification_id = 'verification-uuid';

-- Get auto-approval success rate
SELECT
  auto_approved,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM auto_approval_log
GROUP BY auto_approved;
```

## Security Features

1. **Disabled by Default**: Must be explicitly enabled by SuperAdmin
2. **Zero Tolerance**: Any rejection or fraud flag disqualifies
3. **Rules Snapshot**: Each decision records the rules at that time
4. **Audit Trail**: Every decision is logged with full detail
5. **No Manual Override**: Users can't request auto-approval
6. **Fraud Check**: Active fraud flags prevent auto-approval

## Why "HARSH"?

- **250 reputation** requires significant positive contribution
- **10 prior approvals** means proven track record
- **Zero rejections** ensures consistent quality
- **60 day account** prevents gaming by new accounts
- **Must have sources** maintains evidential standards

This protects platform integrity while rewarding top contributors with streamlined submission.
