# useRealtimeVoting Hook

## Overview

The `useRealtimeVoting` hook provides real-time vote counting functionality for verification submissions in the political accountability platform. It tracks approve and reject votes for a specific verification, automatically updating the count when new votes are cast. This enables live feedback on community voting without requiring page refreshes, creating an interactive and responsive voting experience.

## File Location

`C:\Users\Prithvi Putta\Desktop\political-accountability-platform\frontend\src\hooks\useRealtimeVoting.ts`

## Dependencies

- `react` - useEffect and useState hooks
- `../lib/supabase` - Supabase client instance
- `@supabase/supabase-js` - RealtimeChannel type

## Interfaces

### VoteCount

Represents the current vote tally for a verification:

```typescript
interface VoteCount {
  approve: number   // Number of approval votes
  reject: number    // Number of rejection votes
  total: number     // Total votes cast (approve + reject)
}
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `verificationId` | `string` | Yes | The unique identifier of the verification to track votes for |

## Return Values

| Property | Type | Description |
|----------|------|-------------|
| `voteCount` | `VoteCount` | Current vote counts (approve, reject, total) |
| `loading` | `boolean` | True while initial vote data is being fetched |
| `error` | `Error \| null` | Error object if fetch/subscription fails, null otherwise |

## State Management

The hook maintains three pieces of state:

```typescript
const [voteCount, setVoteCount] = useState<VoteCount>({ approve: 0, reject: 0, total: 0 })
const [loading, setLoading] = useState(true)
const [error, setError] = useState<Error | null>(null)
```

### State Lifecycle

1. **Initial**: `loading: true`, `voteCount: { approve: 0, reject: 0, total: 0 }`, `error: null`
2. **Data Fetched**: `loading: false`, `voteCount` updated with counts, `error: null`
3. **Error**: `loading: false`, counts remain at last known values, `error: Error`
4. **Realtime Vote**: `voteCount` incrementally updated based on new vote type

## Data Source

The hook queries the `votes` table to get vote counts:

```typescript
const { data, error } = await supabase
  .from('votes')
  .select('vote_type')
  .eq('verification_id', verificationId)
```

### Initial Count Calculation

Votes are aggregated using a reducer:

```typescript
const counts = data.reduce(
  (acc, vote) => {
    if (vote.vote_type === 'approve') acc.approve++
    if (vote.vote_type === 'reject') acc.reject++
    acc.total++
    return acc
  },
  { approve: 0, reject: 0, total: 0 }
)
```

## Side Effects

### 1. Initial Vote Fetch

On mount and when `verificationId` changes, the hook fetches current vote counts:

```typescript
useEffect(() => {
  if (!verificationId) return

  const fetchVotes = async () => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('verification_id', verificationId)

      if (error) throw error

      const counts = data.reduce(/* ... */)
      setVoteCount(counts)
      setLoading(false)
    } catch (err) {
      setError(err as Error)
      setLoading(false)
    }
  }

  fetchVotes()
  // ...
}, [verificationId])
```

### 2. Realtime Subscription

The hook subscribes to INSERT events on the votes table for the specific verification:

```typescript
const channel: RealtimeChannel = supabase
  .channel(`votes-${verificationId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'votes',
      filter: `verification_id=eq.${verificationId}`,
    },
    (payload) => {
      const newVote = payload.new as { vote_type: string }

      setVoteCount((prev) => ({
        approve: prev.approve + (newVote.vote_type === 'approve' ? 1 : 0),
        reject: prev.reject + (newVote.vote_type === 'reject' ? 1 : 0),
        total: prev.total + 1,
      }))
    }
  )
  .subscribe()
```

### 3. Cleanup

The subscription is cleaned up when the component unmounts or `verificationId` changes:

```typescript
return () => {
  supabase.removeChannel(channel)
}
```

## Realtime Update Strategy

The hook uses an **incremental update strategy** for real-time changes:

- **Only INSERT events** are monitored (new votes)
- **No UPDATE or DELETE handling** - assumes votes are immutable once cast
- **Filter by verification_id** ensures only relevant votes trigger updates

### Incremental Update Logic

```typescript
setVoteCount((prev) => ({
  approve: prev.approve + (newVote.vote_type === 'approve' ? 1 : 0),
  reject: prev.reject + (newVote.vote_type === 'reject' ? 1 : 0),
  total: prev.total + 1,
}))
```

This approach is efficient because:
- It avoids full refetches on each vote
- It updates state based on the previous state (functional update)
- It only adds the new vote to existing counts

## Usage Examples

### Basic Vote Display

```tsx
import { useRealtimeVoting } from '@/hooks/useRealtimeVoting'

function VoteCounter({ verificationId }: { verificationId: string }) {
  const { voteCount, loading, error } = useRealtimeVoting(verificationId)

  if (loading) return <div>Loading votes...</div>
  if (error) return <div>Error loading votes</div>

  return (
    <div className="vote-counter">
      <span>Approve: {voteCount.approve}</span>
      <span>Reject: {voteCount.reject}</span>
      <span>Total: {voteCount.total}</span>
    </div>
  )
}
```

### Vote Progress Bar

```tsx
import { useRealtimeVoting } from '@/hooks/useRealtimeVoting'

function VoteProgressBar({ verificationId }: { verificationId: string }) {
  const { voteCount, loading } = useRealtimeVoting(verificationId)

  if (loading) return <div className="progress-skeleton" />

  const approvalPercentage = voteCount.total > 0
    ? (voteCount.approve / voteCount.total) * 100
    : 50

  return (
    <div className="vote-progress">
      <div className="progress-bar">
        <div
          className="approve-bar"
          style={{ width: `${approvalPercentage}%` }}
        />
        <div
          className="reject-bar"
          style={{ width: `${100 - approvalPercentage}%` }}
        />
      </div>
      <div className="labels">
        <span>{voteCount.approve} Approve</span>
        <span>{voteCount.reject} Reject</span>
      </div>
    </div>
  )
}
```

### Verification Card with Voting

```tsx
import { useRealtimeVoting } from '@/hooks/useRealtimeVoting'
import { useState } from 'react'

interface VerificationCardProps {
  verificationId: string
  title: string
  description: string
  onVote: (type: 'approve' | 'reject') => Promise<void>
}

function VerificationCard({
  verificationId,
  title,
  description,
  onVote
}: VerificationCardProps) {
  const { voteCount, loading } = useRealtimeVoting(verificationId)
  const [voting, setVoting] = useState(false)

  const handleVote = async (type: 'approve' | 'reject') => {
    setVoting(true)
    try {
      await onVote(type)
      // Vote count will update automatically via realtime subscription
    } finally {
      setVoting(false)
    }
  }

  return (
    <div className="verification-card">
      <h3>{title}</h3>
      <p>{description}</p>

      <div className="vote-section">
        {loading ? (
          <div>Loading votes...</div>
        ) : (
          <>
            <div className="vote-stats">
              <span className="approve">{voteCount.approve} Approvals</span>
              <span className="reject">{voteCount.reject} Rejections</span>
            </div>

            <div className="vote-buttons">
              <button
                onClick={() => handleVote('approve')}
                disabled={voting}
                className="approve-btn"
              >
                Approve
              </button>
              <button
                onClick={() => handleVote('reject')}
                disabled={voting}
                className="reject-btn"
              >
                Reject
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

### Vote Status with Threshold Check

```tsx
import { useRealtimeVoting } from '@/hooks/useRealtimeVoting'

const APPROVAL_THRESHOLD = 0.66  // 66% required for approval
const MINIMUM_VOTES = 10

function VoteStatus({ verificationId }: { verificationId: string }) {
  const { voteCount, loading } = useRealtimeVoting(verificationId)

  if (loading) return <span>Checking status...</span>

  const hasEnoughVotes = voteCount.total >= MINIMUM_VOTES
  const approvalRate = voteCount.total > 0
    ? voteCount.approve / voteCount.total
    : 0

  const status = !hasEnoughVotes
    ? 'pending'
    : approvalRate >= APPROVAL_THRESHOLD
    ? 'approved'
    : 'rejected'

  return (
    <div className={`vote-status ${status}`}>
      <span className="status-badge">{status.toUpperCase()}</span>
      <span className="approval-rate">
        {(approvalRate * 100).toFixed(1)}% approval ({voteCount.total} votes)
      </span>
      {!hasEnoughVotes && (
        <span className="minimum-notice">
          {MINIMUM_VOTES - voteCount.total} more votes needed
        </span>
      )}
    </div>
  )
}
```

### Real-time Vote Animation

```tsx
import { useRealtimeVoting } from '@/hooks/useRealtimeVoting'
import { useEffect, useState } from 'react'

function AnimatedVoteCounter({ verificationId }: { verificationId: string }) {
  const { voteCount, loading } = useRealtimeVoting(verificationId)
  const [prevCount, setPrevCount] = useState(voteCount.total)
  const [flash, setFlash] = useState<'approve' | 'reject' | null>(null)

  useEffect(() => {
    if (voteCount.total > prevCount) {
      // Determine which type of vote was added
      const prevApprove = prevCount - (voteCount.reject - (voteCount.approve > 0 ? 0 : 0))
      if (voteCount.approve > prevApprove) {
        setFlash('approve')
      } else {
        setFlash('reject')
      }

      setTimeout(() => setFlash(null), 500)
      setPrevCount(voteCount.total)
    }
  }, [voteCount.total, prevCount])

  if (loading) return <div>Loading...</div>

  return (
    <div className="animated-counter">
      <div className={`count approve ${flash === 'approve' ? 'flash' : ''}`}>
        {voteCount.approve}
      </div>
      <div className={`count reject ${flash === 'reject' ? 'flash' : ''}`}>
        {voteCount.reject}
      </div>
    </div>
  )
}
```

### Multiple Verifications List

```tsx
import { useRealtimeVoting } from '@/hooks/useRealtimeVoting'

function VerificationVoteDisplay({ id }: { id: string }) {
  const { voteCount, loading } = useRealtimeVoting(id)

  if (loading) return <span>...</span>

  return (
    <span>
      {voteCount.approve}/{voteCount.reject}
    </span>
  )
}

function VerificationsList({ verifications }: { verifications: { id: string; title: string }[] }) {
  return (
    <ul>
      {verifications.map(v => (
        <li key={v.id}>
          <span>{v.title}</span>
          <VerificationVoteDisplay id={v.id} />
        </li>
      ))}
    </ul>
  )
}
```

## Error Handling

Errors are captured during the initial fetch:

```typescript
try {
  const { data, error } = await supabase
    .from('votes')
    .select('vote_type')
    .eq('verification_id', verificationId)

  if (error) throw error
  // ...
} catch (err) {
  setError(err as Error)
  setLoading(false)
}
```

Realtime subscription errors are handled internally by Supabase.

## Edge Cases

### Empty verificationId

The hook short-circuits if no `verificationId` is provided:

```typescript
if (!verificationId) return
```

This prevents unnecessary API calls and subscriptions.

### No Votes Yet

The initial state handles the case where no votes exist:
- Returns `{ approve: 0, reject: 0, total: 0 }`
- The reducer handles empty arrays gracefully

## Performance Considerations

1. **Unique Channel Names**: Uses `votes-${verificationId}` for unique channel isolation
2. **Incremental Updates**: Only adds new votes instead of refetching all data
3. **Filtered Subscription**: Only receives events for the specific verification
4. **Single Query**: Initial fetch only selects `vote_type` column
5. **Cleanup**: Properly removes channel on unmount

## Notes

- The hook uses the `'use client'` directive for Next.js client-side rendering
- Only INSERT events are tracked - vote modifications are not supported
- The `verificationId` is reactive - changing it resets state and creates new subscription
- Vote types are expected to be either 'approve' or 'reject'
- The hook assumes votes are immutable once created
- Each verification should have its own instance of this hook
- The subscription filter uses Supabase's row-level filtering for efficiency
