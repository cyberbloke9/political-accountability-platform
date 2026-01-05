# useRealtimeLeaderboard Hook

## Overview

The `useRealtimeLeaderboard` hook provides real-time leaderboard functionality for the political accountability platform. It fetches and maintains an up-to-date list of citizen scores from a materialized view (`citizen_scores_mv`) and automatically updates when changes occur in the database. This hook leverages Supabase's real-time subscription capabilities to ensure the leaderboard reflects the latest user rankings without requiring manual refreshes.

## File Location

`C:\Users\Prithvi Putta\Desktop\political-accountability-platform\frontend\src\hooks\useRealtimeLeaderboard.ts`

## Dependencies

- `react` - useEffect and useState hooks
- `../lib/supabase` - Supabase client instance
- `@supabase/supabase-js` - RealtimeChannel type

## Interfaces

### LeaderboardEntry

Represents a single entry in the leaderboard:

```typescript
interface LeaderboardEntry {
  user_id: string                       // Unique identifier for the user
  username: string                      // User's display name
  total_score: number                   // Aggregate score determining rank
  title: string                         // User's title/rank badge
  reputation: number                    // User's reputation points
  total_promises_created: number        // Number of political promises created
  total_verifications_submitted: number // Number of verifications submitted
  total_votes_cast: number              // Number of votes cast on verifications
  member_since: string                  // ISO date string of account creation
}
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | `number` | `100` | Maximum number of leaderboard entries to fetch |

## Return Values

| Property | Type | Description |
|----------|------|-------------|
| `leaderboard` | `LeaderboardEntry[]` | Array of leaderboard entries sorted by score (descending) |
| `loading` | `boolean` | True while initial data is being fetched |
| `error` | `Error \| null` | Error object if fetch/subscription fails, null otherwise |

## State Management

The hook maintains three pieces of state:

```typescript
const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<Error | null>(null)
```

### State Lifecycle

1. **Initial**: `loading: true`, `leaderboard: []`, `error: null`
2. **Data Fetched**: `loading: false`, `leaderboard: [data]`, `error: null`
3. **Error**: `loading: false`, `leaderboard: []`, `error: Error`
4. **Realtime Update**: `leaderboard` is re-fetched and updated

## Data Source

The hook queries the `citizen_scores_mv` materialized view, which aggregates user activity data:

```typescript
const { data, error } = await supabase
  .from('citizen_scores_mv')
  .select('*')
  .order('total_score', { ascending: false })
  .limit(limit)
```

### Query Details

- **Table**: `citizen_scores_mv` (materialized view)
- **Selection**: All columns (`*`)
- **Ordering**: `total_score` descending (highest scores first)
- **Limit**: Configurable (default 100)

## Side Effects

### 1. Initial Data Fetch

On mount and when `limit` changes, the hook fetches the leaderboard data:

```typescript
useEffect(() => {
  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('citizen_scores_mv')
        .select('*')
        .order('total_score', { ascending: false })
        .limit(limit)

      if (error) throw error

      setLeaderboard(data || [])
      setLoading(false)
    } catch (err) {
      setError(err as Error)
      setLoading(false)
    }
  }

  fetchLeaderboard()
  // ...
}, [limit])
```

### 2. Realtime Subscription

The hook establishes a Supabase Realtime channel to listen for database changes:

```typescript
const channel: RealtimeChannel = supabase
  .channel('leaderboard-changes')
  .on(
    'postgres_changes',
    {
      event: '*',          // Listen to all events (INSERT, UPDATE, DELETE)
      schema: 'public',
      table: 'citizen_scores_mv',
    },
    () => {
      fetchLeaderboard()   // Refetch entire leaderboard on any change
    }
  )
  .subscribe()
```

### 3. Cleanup

The subscription is properly cleaned up when the component unmounts:

```typescript
return () => {
  supabase.removeChannel(channel)
}
```

## Realtime Update Strategy

The hook uses a **full refetch strategy** when changes are detected:

- **Pros**:
  - Ensures data consistency
  - Handles complex ranking changes correctly
  - Simple implementation

- **Cons**:
  - More database queries on frequent updates
  - Potential for brief inconsistency during refetch

This approach is appropriate because leaderboard changes can affect the ordering of multiple entries, making incremental updates complex and error-prone.

## Usage Examples

### Basic Leaderboard Display

```tsx
import { useRealtimeLeaderboard } from '@/hooks/useRealtimeLeaderboard'

function Leaderboard() {
  const { leaderboard, loading, error } = useRealtimeLeaderboard()

  if (loading) return <div>Loading leaderboard...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Username</th>
          <th>Score</th>
          <th>Title</th>
        </tr>
      </thead>
      <tbody>
        {leaderboard.map((entry, index) => (
          <tr key={entry.user_id}>
            <td>{index + 1}</td>
            <td>{entry.username}</td>
            <td>{entry.total_score}</td>
            <td>{entry.title}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### Top 10 Leaderboard

```tsx
import { useRealtimeLeaderboard } from '@/hooks/useRealtimeLeaderboard'

function TopContributors() {
  const { leaderboard, loading } = useRealtimeLeaderboard(10)

  if (loading) return <div>Loading...</div>

  return (
    <div className="top-contributors">
      <h2>Top 10 Contributors</h2>
      <ul>
        {leaderboard.map((entry, index) => (
          <li key={entry.user_id}>
            <span className="rank">#{index + 1}</span>
            <span className="username">{entry.username}</span>
            <span className="score">{entry.total_score} pts</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Detailed Stats Display

```tsx
import { useRealtimeLeaderboard } from '@/hooks/useRealtimeLeaderboard'

function DetailedLeaderboard() {
  const { leaderboard, loading, error } = useRealtimeLeaderboard(50)

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error loading leaderboard</div>

  return (
    <div className="leaderboard-grid">
      {leaderboard.map((entry, index) => (
        <div key={entry.user_id} className="leaderboard-card">
          <div className="rank-badge">#{index + 1}</div>
          <h3>{entry.username}</h3>
          <p className="title">{entry.title}</p>
          <div className="stats">
            <div>
              <span>Total Score</span>
              <strong>{entry.total_score}</strong>
            </div>
            <div>
              <span>Reputation</span>
              <strong>{entry.reputation}</strong>
            </div>
            <div>
              <span>Promises Created</span>
              <strong>{entry.total_promises_created}</strong>
            </div>
            <div>
              <span>Verifications</span>
              <strong>{entry.total_verifications_submitted}</strong>
            </div>
            <div>
              <span>Votes Cast</span>
              <strong>{entry.total_votes_cast}</strong>
            </div>
          </div>
          <p className="member-since">
            Member since {new Date(entry.member_since).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  )
}
```

### Leaderboard with User Highlighting

```tsx
import { useRealtimeLeaderboard } from '@/hooks/useRealtimeLeaderboard'
import { useAuth } from '@/hooks/useAuth'

function PersonalizedLeaderboard() {
  const { leaderboard, loading } = useRealtimeLeaderboard(100)
  const { user } = useAuth()

  if (loading) return <div>Loading...</div>

  const userRank = leaderboard.findIndex(entry => entry.user_id === user?.id)

  return (
    <div>
      {userRank >= 0 && (
        <div className="your-rank">
          Your Rank: #{userRank + 1} with {leaderboard[userRank].total_score} points
        </div>
      )}

      <table>
        <tbody>
          {leaderboard.map((entry, index) => (
            <tr
              key={entry.user_id}
              className={entry.user_id === user?.id ? 'highlighted' : ''}
            >
              <td>{index + 1}</td>
              <td>{entry.username}</td>
              <td>{entry.total_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Leaderboard with Auto-Refresh Indicator

```tsx
import { useRealtimeLeaderboard } from '@/hooks/useRealtimeLeaderboard'
import { useState, useEffect } from 'react'

function LiveLeaderboard() {
  const { leaderboard, loading, error } = useRealtimeLeaderboard()
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Update timestamp when leaderboard changes
  useEffect(() => {
    if (!loading) {
      setLastUpdated(new Date())
    }
  }, [leaderboard, loading])

  return (
    <div>
      <div className="live-indicator">
        <span className="pulse-dot" />
        Live - Last updated: {lastUpdated.toLocaleTimeString()}
      </div>

      {loading && <div>Loading...</div>}
      {error && <div>Connection error</div>}

      <ul>
        {leaderboard.map((entry, index) => (
          <li key={entry.user_id}>
            {index + 1}. {entry.username} - {entry.total_score} pts
          </li>
        ))}
      </ul>
    </div>
  )
}
```

## Error Handling

Errors are captured during:

1. **Initial fetch**: Database query errors
2. **Realtime subscription**: Connection errors (handled by Supabase internally)

```typescript
try {
  const { data, error } = await supabase
    .from('citizen_scores_mv')
    .select('*')
    // ...

  if (error) throw error
  // ...
} catch (err) {
  setError(err as Error)
  setLoading(false)
}
```

## Performance Considerations

1. **Materialized View**: Uses `citizen_scores_mv` which is pre-computed for fast queries
2. **Limit Parameter**: Allows fetching only the needed number of entries
3. **Full Refetch on Change**: May cause performance issues with very frequent updates
4. **Channel Cleanup**: Proper cleanup prevents memory leaks

## Notes

- The hook uses the `'use client'` directive for Next.js client-side rendering
- The `limit` parameter is reactive - changing it will trigger a refetch
- The realtime channel name is `'leaderboard-changes'`
- All database events (`INSERT`, `UPDATE`, `DELETE`) trigger a full refetch
- The materialized view must be refreshed server-side for score updates to appear
- Empty data responses are handled gracefully (returns empty array)
- The subscription listens to the `public` schema by default
