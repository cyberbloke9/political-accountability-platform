# votePatterns.ts

## Overview

The `votePatterns.ts` file provides functionality for analyzing and detecting voting patterns in the political accountability platform. It focuses on identifying potential voting manipulation, partisan bias, and coordinated voting behavior among users.

This module is essential for maintaining platform integrity by detecting and surfacing suspicious voting patterns that may indicate abuse, astroturfing, or coordinated manipulation campaigns.

## Dependencies

| Module | Purpose |
|--------|---------|
| `./supabase` | Provides the Supabase client instance for database queries |

## Interfaces

### `UserPartyBias`

Represents voting bias statistics for a specific user and party combination.

```typescript
interface UserPartyBias {
  id: string                  // Unique record ID
  user_id: string             // User's ID
  party_name: string          // Political party name
  upvotes_count: number       // Number of upvotes for this party's promises
  downvotes_count: number     // Number of downvotes for this party's promises
  total_votes: number         // Total votes cast
  bias_score: number          // Calculated bias score (-1 to +1)
  last_updated: string        // Timestamp of last update
  user?: {                    // Optional joined user data
    username: string
    citizen_score: number
  }
}
```

#### Bias Score Interpretation

| Score Range | Interpretation |
|-------------|----------------|
| +0.8 to +1.0 | Extremely positive bias (mostly upvotes) |
| +0.5 to +0.8 | Significant positive bias |
| -0.5 to +0.5 | Neutral/balanced voting |
| -0.8 to -0.5 | Significant negative bias |
| -1.0 to -0.8 | Extremely negative bias (mostly downvotes) |

### `CoordinatedVotingGroup`

Represents a detected group of users voting in coordinated patterns.

```typescript
interface CoordinatedVotingGroup {
  id: string                  // Unique group ID
  group_members: string[]     // Array of user IDs in the group
  verification_ids: string[]  // Array of verification IDs they voted on
  vote_type: string           // Type of coordinated vote ('upvote' or 'downvote')
  coordination_score: number  // Confidence score for coordination detection
  time_window_minutes: number // Time window in which votes occurred
  detected_at: string         // When the pattern was detected
}
```

## Exported Functions

### `getExtremeBiasUsers(minBiasScore?: number): Promise<Result>`

Retrieves users with extreme partisan voting bias.

#### Parameters

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `minBiasScore` | `number` | `0.8` | Minimum absolute bias score threshold |

#### Return Type

```typescript
Promise<{
  data: UserPartyBias[] | null  // Array of biased user records
  error: any                     // Error object if query failed
}>
```

#### Query Logic

1. Queries `user_party_bias` view/table
2. Joins with `users` table for username and citizen_score
3. Filters for bias scores > threshold OR < -threshold
4. Requires minimum 10 total votes (to filter noise)
5. Orders by bias_score descending

---

### `getCoordinatedVotingGroups(): Promise<Result>`

Retrieves detected coordinated voting groups.

#### Parameters

None

#### Return Type

```typescript
Promise<{
  data: CoordinatedVotingGroup[] | null  // Array of detected groups
  error: any                              // Error object if query failed
}>
```

#### Query Logic

1. Queries `coordinated_voting_groups` table
2. Orders by detection time (most recent first)
3. Limits to 50 most recent groups

---

### `getPartyVotingStats(): Promise<Result>`

Retrieves aggregated voting statistics by political party.

#### Parameters

None

#### Return Type

```typescript
Promise<{
  data: Array<{
    party_name: string     // Party name
    total_users: number    // Number of users who voted on this party's promises
    avg_bias_score: number // Average bias score across users
    total_votes: number    // Total votes for this party
  }> | null
  error: any
}>
```

#### Implementation Note

Uses the `get_party_voting_stats` RPC function. If the function doesn't exist, returns empty array gracefully.

---

### `runVotePatternAnalysis(): Promise<Result>`

Manually triggers the vote pattern analysis algorithm.

#### Parameters

None

#### Return Type

```typescript
Promise<{
  success: boolean   // Whether the analysis ran successfully
  error?: string     // Error message if failed
}>
```

#### Implementation Note

Calls the `run_vote_pattern_analysis` database RPC function. This is typically run on a schedule but can be triggered manually by admins.

---

### `getUserPartyBias(userId: string): Promise<Result>`

Retrieves party bias data for a specific user (for profile pages).

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `userId` | `string` | The user's ID to query |

#### Return Type

```typescript
Promise<{
  data: UserPartyBias[] | null  // Array of bias records by party
  error: any                     // Error object if query failed
}>
```

#### Query Logic

1. Queries `user_party_bias` for the specific user
2. Orders by total_votes descending (most voted party first)

## Usage Examples

### Admin Dashboard - Bias Detection

```typescript
import { getExtremeBiasUsers } from '@/lib/votePatterns';

async function BiasMonitoringPanel() {
  const { data: biasedUsers, error } = await getExtremeBiasUsers(0.85);

  if (error) {
    return <div>Error loading bias data</div>;
  }

  return (
    <div>
      <h2>Users with Extreme Partisan Bias</h2>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Party</th>
            <th>Bias Score</th>
            <th>Votes</th>
            <th>Citizen Score</th>
          </tr>
        </thead>
        <tbody>
          {biasedUsers?.map(record => (
            <tr key={record.id}>
              <td>{record.user?.username}</td>
              <td>{record.party_name}</td>
              <td>
                <span className={record.bias_score > 0 ? 'text-green-600' : 'text-red-600'}>
                  {(record.bias_score * 100).toFixed(1)}%
                </span>
              </td>
              <td>{record.total_votes}</td>
              <td>{record.user?.citizen_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Coordinated Voting Detection

```typescript
import { getCoordinatedVotingGroups } from '@/lib/votePatterns';

async function CoordinationAlerts() {
  const { data: groups, error } = await getCoordinatedVotingGroups();

  if (error) {
    console.error('Failed to fetch coordinated voting groups');
    return null;
  }

  const recentGroups = groups?.filter(g => {
    const detected = new Date(g.detected_at);
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return detected > hourAgo;
  });

  return (
    <div>
      <h2>Recent Coordinated Voting Alerts</h2>
      {recentGroups?.length === 0 && <p>No recent coordination detected</p>}

      {recentGroups?.map(group => (
        <div key={group.id} className="alert alert-warning">
          <p>
            <strong>{group.group_members.length} users</strong> voted{' '}
            <strong>{group.vote_type}</strong> on{' '}
            <strong>{group.verification_ids.length} verifications</strong>
          </p>
          <p>
            Time window: {group.time_window_minutes} minutes |
            Confidence: {(group.coordination_score * 100).toFixed(0)}%
          </p>
        </div>
      ))}
    </div>
  );
}
```

### Party Voting Statistics

```typescript
import { getPartyVotingStats } from '@/lib/votePatterns';

async function PartyVotingDashboard() {
  const { data: stats } = await getPartyVotingStats();

  return (
    <div>
      <h2>Voting Statistics by Party</h2>
      <div className="grid grid-cols-3 gap-4">
        {stats?.map(party => (
          <div key={party.party_name} className="card">
            <h3>{party.party_name}</h3>
            <ul>
              <li>Total Votes: {party.total_votes}</li>
              <li>Unique Voters: {party.total_users}</li>
              <li>Avg Bias: {(party.avg_bias_score * 100).toFixed(1)}%</li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### User Profile - Personal Voting Bias

```typescript
import { getUserPartyBias } from '@/lib/votePatterns';

async function UserVotingProfile({ userId }: { userId: string }) {
  const { data: biasData } = await getUserPartyBias(userId);

  return (
    <div>
      <h3>Your Voting Patterns</h3>
      {biasData?.map(record => (
        <div key={record.id}>
          <span>{record.party_name}</span>
          <div className="flex items-center gap-2">
            <span className="text-green-600">+{record.upvotes_count}</span>
            <span className="text-red-600">-{record.downvotes_count}</span>
          </div>
          <progress
            value={record.bias_score + 1}
            max={2}
            title={`Bias: ${(record.bias_score * 100).toFixed(0)}%`}
          />
        </div>
      ))}
    </div>
  );
}
```

### Manual Analysis Trigger

```typescript
import { runVotePatternAnalysis } from '@/lib/votePatterns';

async function AdminControls() {
  const [running, setRunning] = useState(false);

  async function handleAnalysis() {
    setRunning(true);
    try {
      const result = await runVotePatternAnalysis();
      if (result.success) {
        showToast('Vote pattern analysis completed');
      } else {
        showError(result.error);
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <button onClick={handleAnalysis} disabled={running}>
      {running ? 'Analyzing...' : 'Run Vote Pattern Analysis'}
    </button>
  );
}
```

## Database Schema Notes

This module expects the following database structure:

- **`user_party_bias`** table/view with user voting bias metrics per party
- **`coordinated_voting_groups`** table for detected coordination patterns
- **`users`** table for user information
- **RPC functions**:
  - `get_party_voting_stats()` - Aggregates voting stats by party
  - `run_vote_pattern_analysis()` - Runs the detection algorithms

## Detection Algorithm Notes

The vote pattern analysis typically looks for:

1. **Temporal Clustering**: Multiple users voting on same items within short time windows
2. **IP/Device Correlation**: Same source voting patterns (if tracked)
3. **Voting Pattern Similarity**: Users with highly correlated voting histories
4. **Extreme Bias**: Users who consistently vote one way for specific parties

## File Location

`C:\Users\Prithvi Putta\Desktop\political-accountability-platform\frontend\src\lib\votePatterns.ts`
