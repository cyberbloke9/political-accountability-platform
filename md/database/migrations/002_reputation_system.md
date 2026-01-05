# 002_reputation_system.sql

## Overview
Implements an automated reputation/citizen score calculation system. This migration creates functions and triggers that automatically update user reputation scores based on their verification activity and community votes.

## Core Functions

### 1. `calculate_user_reputation(user_uuid UUID)`
**Returns:** INTEGER (reputation score)

**Calculation Formula:**
```
reputation = 100 (base)
           + (upvotes × 10)
           - (downvotes × 5)
           + (approved_verifications × 50)
```

**Scoring Breakdown:**
| Action | Points |
|--------|--------|
| Base score | +100 |
| Each upvote received | +10 |
| Each downvote received | -5 |
| Each approved verification | +50 |
| Minimum score | 0 |

**Logic:**
1. Counts total upvotes on all user's verifications
2. Counts total downvotes on all user's verifications
3. Counts number of approved verifications
4. Applies formula with floor of 0

### 2. `update_user_reputation(user_uuid UUID)`
**Returns:** VOID

Simple wrapper that:
1. Calls `calculate_user_reputation()` to get new score
2. Updates `users.citizen_score` column
3. Updates `users.updated_at` timestamp

### 3. `trigger_update_reputation_on_vote()`
**Trigger Function**

Automatically updates verification owner's reputation when votes change:
- Finds the verification associated with the vote
- Gets the `submitted_by` user
- Calls `update_user_reputation()` for that user

### 4. `trigger_update_reputation_on_verification_status()`
**Trigger Function**

Updates reputation when verification status changes:
- Only triggers if status actually changed
- Only triggers if new OR old status was 'approved'
- Calls `update_user_reputation()` for the submitter

### 5. `recalculate_all_reputations()`
**Maintenance Function**

Batch function to recalculate all user scores:
- Loops through all users
- Calls `update_user_reputation()` for each
- Useful for data migrations or corrections

## Triggers

### `votes_reputation_trigger`
- **Table:** votes
- **Events:** INSERT, UPDATE, DELETE
- **Timing:** AFTER
- **Per Row:** Yes

### `verifications_reputation_trigger`
- **Table:** verifications
- **Events:** UPDATE
- **Timing:** AFTER
- **Per Row:** Yes

## Data Flow

```
User submits verification
        ↓
Other users vote on it
        ↓
votes_reputation_trigger fires
        ↓
trigger_update_reputation_on_vote()
        ↓
Gets verification owner
        ↓
update_user_reputation()
        ↓
calculate_user_reputation()
        ↓
UPDATE users SET citizen_score = new_score
```

## Design Rationale

1. **Upvotes worth more than downvotes cost**: Encourages participation (10 vs 5 points)
2. **Approved verifications give major bonus**: 50 points rewards quality, verified content
3. **Base score of 100**: New users start with credibility, not zero
4. **Floor of 0**: Prevents negative scores which could seem punitive
5. **Automatic triggers**: No manual intervention needed

## Usage

```sql
-- Manually recalculate a specific user
SELECT update_user_reputation('user-uuid-here');

-- Recalculate all users (maintenance)
SELECT recalculate_all_reputations();

-- Check a user's calculated score
SELECT calculate_user_reputation('user-uuid-here');
```
