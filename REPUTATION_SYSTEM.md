# Reputation System Implementation

This document explains how the citizen reputation system works and how to set it up.

## Overview

The reputation system automatically calculates and updates user scores based on:
- **Upvotes** on their verifications (+10 points each)
- **Downvotes** on their verifications (-5 points each)
- **Approved verifications** (+50 points each)
- **Base score**: Every user starts at 100 points

## How It Works

### Automatic Updates
The system uses PostgreSQL triggers to automatically update reputation scores when:
1. A vote is cast (insert/update/delete)
2. A verification status changes to/from 'approved'

### Score Formula
```
Reputation Score = 100 + (upvotes × 10) - (downvotes × 5) + (approved_verifications × 50)
```

Minimum score is 0 (scores cannot go negative).

## Installation

### Step 1: Apply the SQL Migration

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to: **SQL Editor** (in the left sidebar)
3. Click "**New Query**"
4. Copy the entire contents of `supabase_reputation_system.sql`
5. Paste into the SQL editor
6. Click "**Run**" (or press Ctrl/Cmd + Enter)

### Step 2: Verify Installation

Run this query to verify the functions were created:
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name LIKE '%reputation%';
```

You should see:
- `calculate_user_reputation`
- `update_user_reputation`
- `trigger_update_reputation_on_vote`
- `trigger_update_reputation_on_verification_status`
- `recalculate_all_reputations`

### Step 3: Initialize Existing Users

The migration automatically runs `recalculate_all_reputations()` to initialize scores for existing users. If you need to run it again:

```sql
SELECT recalculate_all_reputations();
```

## Testing

### Test the Reputation Calculation

1. **Create a test verification** through the UI
2. **Cast some votes** (upvotes/downvotes) on the verification
3. **Check the submitter's score**:
   ```sql
   SELECT username, citizen_score
   FROM users
   WHERE username = 'your_test_user';
   ```

### Manual Reputation Recalculation

To manually recalculate a specific user's score:
```sql
SELECT update_user_reputation('user-uuid-here');
```

To recalculate all users:
```sql
SELECT recalculate_all_reputations();
```

## Integration with the App

The reputation system is fully integrated with the frontend:

### VerificationCard Component
- Located at: `frontend/src/components/verifications/VerificationCard.tsx`
- Displays upvote/downvote buttons
- Shows submitter's current citizen score
- Automatically triggers reputation update when votes are cast

### Promise Detail Page
- Located at: `frontend/src/app/promises/[id]/page.tsx`
- Fetches and displays verifications with submitter info
- Shows citizen scores next to usernames
- Refreshes data after voting

## Database Schema

### Users Table
- `citizen_score` (INTEGER): User's reputation score

### Votes Table
- `verification_id` (UUID): Reference to verification
- `user_id` (UUID): User who cast the vote
- `vote_type` (TEXT): 'upvote' or 'downvote'

### Verifications Table
- `submitted_by` (UUID): User who submitted the verification
- `status` (TEXT): 'pending', 'approved', or 'rejected'

## Maintenance

### Monitoring Reputation Scores

View top contributors:
```sql
SELECT username, citizen_score, created_at
FROM users
ORDER BY citizen_score DESC
LIMIT 10;
```

View users with low scores:
```sql
SELECT username, citizen_score, created_at
FROM users
WHERE citizen_score < 50
ORDER BY citizen_score ASC;
```

### Debugging

If scores seem incorrect, recalculate all:
```sql
SELECT recalculate_all_reputations();
```

Check trigger status:
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%reputation%';
```

## Future Enhancements

Potential improvements to the reputation system:
- Time-based decay (older votes count less)
- Weighted voting (higher-reputation users' votes count more)
- Badge/level system based on reputation thresholds
- Reputation requirements for certain actions
- Penalty for rejected verifications
