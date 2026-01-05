# reputationEngine.ts

## Overview

The `reputationEngine.ts` file provides comprehensive reputation system management for the political accountability platform. It handles reputation rules configuration, user reputation history tracking, activity status monitoring, and reputation decay mechanics.

The reputation system incentivizes quality contributions by rewarding good behavior and penalizing violations, creating a gamified trust mechanism for user credibility.

## Dependencies

| Module | Purpose |
|--------|---------|
| `./supabase` | Provides the Supabase client instance for database operations |

## Interfaces

### `ReputationRule`

Defines a configurable rule for reputation point changes based on user actions.

```typescript
interface ReputationRule {
  id: string              // Unique rule ID
  rule_name: string       // Human-readable rule name
  event_type: string      // Type of event that triggers this rule
  points_change: number   // Points to add (positive) or subtract (negative)
  description: string     // Detailed description of the rule
  enabled: boolean        // Whether this rule is active
  created_at: string      // When the rule was created
  updated_at: string      // When the rule was last modified
}
```

### `ReputationHistory`

Represents a single entry in a user's reputation history log.

```typescript
interface ReputationHistory {
  id: string              // Unique record ID
  user_id: string         // User who received the change
  points_change: number   // Points added or subtracted
  reason: string          // Human-readable reason for the change
  event_type: string | null    // Type of event (links to rules)
  related_id: string | null    // ID of related entity (verification, vote, etc.)
  previous_score: number  // Score before this change
  new_score: number       // Score after this change
  created_at: string      // When the change occurred
}
```

### `UserActivityStatus`

Tracks a user's activity metrics for decay calculations.

```typescript
interface UserActivityStatus {
  user_id: string              // User ID
  last_verification_at: string | null  // Last verification submission
  last_vote_at: string | null          // Last vote cast
  last_active_at: string               // Most recent activity
  total_verifications: number          // Total verifications submitted
  total_votes: number                  // Total votes cast
  inactive_days: number                // Days since last activity
  updated_at: string                   // Last status update
}
```

## Exported Functions

### `getReputationRules(): Promise<Result>`

Retrieves all reputation rules from the system.

#### Parameters

None

#### Return Type

```typescript
Promise<{
  data: ReputationRule[] | null
  error: any
}>
```

#### Query Logic

Orders rules by `event_type` for organized display.

---

### `updateReputationRule(ruleId: string, updates: Partial<RuleUpdates>): Promise<Result>`

Updates a reputation rule (SuperAdmin only).

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `ruleId` | `string` | ID of the rule to update |
| `updates` | `Partial<Pick<ReputationRule, 'points_change' \| 'description' \| 'enabled'>>` | Fields to update |

#### Return Type

```typescript
Promise<{
  success: boolean
  error?: string
}>
```

#### Allowed Updates

- `points_change`: Modify point value
- `description`: Update description text
- `enabled`: Enable/disable the rule

---

### `getUserReputationHistory(userId: string, limit?: number): Promise<Result>`

Retrieves a user's reputation change history.

#### Parameters

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `userId` | `string` | - | User ID to query |
| `limit` | `number` | `50` | Maximum records to return |

#### Return Type

```typescript
Promise<{
  data: ReputationHistory[] | null
  error: any
}>
```

#### Query Logic

Orders by `created_at` descending (most recent first).

---

### `getReputationBreakdown(userId: string): Promise<Result>`

Gets a summary of reputation points grouped by event type.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `userId` | `string` | User ID to analyze |

#### Return Type

```typescript
Promise<{
  data: Array<{
    event_type: string    // Type of event
    total_points: number  // Sum of points from this type
    count: number         // Number of occurrences
  }> | null
  error: any
}>
```

#### Logic

1. Fetches all reputation history for the user
2. Groups records by event_type
3. Sums points and counts occurrences per type

---

### `getUserActivityStatus(userId: string): Promise<Result>`

Retrieves activity status for a user.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `userId` | `string` | User ID to query |

#### Return Type

```typescript
Promise<{
  data: UserActivityStatus | null
  error: any
}>
```

#### Error Handling

Returns `null` data (not error) if user has no activity status record yet (PGRST116 error code).

---

### `applyReputationDecay(): Promise<Result>`

Triggers reputation decay for inactive users (admin action).

#### Parameters

None

#### Return Type

```typescript
Promise<{
  success: boolean
  error?: string
}>
```

#### Implementation Note

Calls the `apply_reputation_decay` RPC function which:
- Identifies users with extended inactivity (configurable threshold)
- Applies graduated point reduction based on inactivity duration
- Logs decay actions in reputation history

---

### `getReputationStats(): Promise<Stats>`

Retrieves platform-wide reputation statistics.

#### Parameters

None

#### Return Type

```typescript
Promise<{
  totalUsers: number        // Total registered users
  avgReputation: number     // Average citizen score across platform
  highestReputation: number // Highest individual score
  usersWithDecay: number    // Users who have been inactive 30+ days
}>
```

## Common Event Types

| Event Type | Typical Points | Description |
|------------|---------------|-------------|
| `verification_approved` | +10 | User's verification was approved |
| `verification_rejected` | -15 | User's verification was rejected |
| `vote_upvoted` | +1 | User's content received an upvote |
| `vote_downvoted` | -1 | User's content received a downvote |
| `daily_login` | +1 | Daily login bonus |
| `inactivity_decay` | -5 | Periodic inactivity penalty |
| `spam_penalty` | -20 | Detected spam activity |
| `quality_bonus` | +25 | High-quality contribution bonus |

## Usage Examples

### Admin Rules Configuration

```typescript
import { getReputationRules, updateReputationRule } from '@/lib/reputationEngine';

async function ReputationRulesAdmin() {
  const { data: rules } = await getReputationRules();

  async function handleUpdate(ruleId: string, points: number) {
    const result = await updateReputationRule(ruleId, { points_change: points });
    if (result.success) {
      refreshRules();
    }
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Rule Name</th>
          <th>Event Type</th>
          <th>Points</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rules?.map(rule => (
          <tr key={rule.id}>
            <td>{rule.rule_name}</td>
            <td>{rule.event_type}</td>
            <td>
              <input
                type="number"
                value={rule.points_change}
                onChange={(e) => handleUpdate(rule.id, parseInt(e.target.value))}
              />
            </td>
            <td>{rule.enabled ? 'Active' : 'Disabled'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### User Reputation History

```typescript
import { getUserReputationHistory } from '@/lib/reputationEngine';

async function UserReputationTimeline({ userId }: { userId: string }) {
  const { data: history } = await getUserReputationHistory(userId, 20);

  return (
    <div className="timeline">
      {history?.map(entry => (
        <div key={entry.id} className="timeline-entry">
          <span className={entry.points_change > 0 ? 'text-green-600' : 'text-red-600'}>
            {entry.points_change > 0 ? '+' : ''}{entry.points_change}
          </span>
          <span>{entry.reason}</span>
          <span className="text-gray-500">
            {new Date(entry.created_at).toLocaleDateString()}
          </span>
          <span className="text-sm">
            Score: {entry.previous_score} → {entry.new_score}
          </span>
        </div>
      ))}
    </div>
  );
}
```

### Reputation Breakdown Chart

```typescript
import { getReputationBreakdown } from '@/lib/reputationEngine';

async function ReputationBreakdownChart({ userId }: { userId: string }) {
  const { data: breakdown } = await getReputationBreakdown(userId);

  const positiveTypes = breakdown?.filter(b => b.total_points > 0) || [];
  const negativeTypes = breakdown?.filter(b => b.total_points < 0) || [];

  return (
    <div>
      <h3>Points Earned By Activity</h3>
      <div className="chart">
        {positiveTypes.map(type => (
          <div key={type.event_type} className="bar bg-green-500">
            <span>{type.event_type}: +{type.total_points} ({type.count}x)</span>
          </div>
        ))}
      </div>

      <h3>Points Lost By Activity</h3>
      <div className="chart">
        {negativeTypes.map(type => (
          <div key={type.event_type} className="bar bg-red-500">
            <span>{type.event_type}: {type.total_points} ({type.count}x)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Activity Status Display

```typescript
import { getUserActivityStatus } from '@/lib/reputationEngine';

async function ActivityStatusCard({ userId }: { userId: string }) {
  const { data: status } = await getUserActivityStatus(userId);

  if (!status) {
    return <div>No activity recorded yet</div>;
  }

  return (
    <div className="card">
      <h3>Activity Status</h3>
      <ul>
        <li>Total Verifications: {status.total_verifications}</li>
        <li>Total Votes: {status.total_votes}</li>
        <li>
          Last Active: {new Date(status.last_active_at).toLocaleDateString()}
        </li>
        <li>
          Inactive Days: {status.inactive_days}
          {status.inactive_days >= 30 && (
            <span className="text-orange-500"> (decay risk)</span>
          )}
        </li>
      </ul>
    </div>
  );
}
```

### Platform Statistics Dashboard

```typescript
import { getReputationStats } from '@/lib/reputationEngine';

async function ReputationStatsDashboard() {
  const stats = await getReputationStats();

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard title="Total Users" value={stats.totalUsers} />
      <StatCard title="Average Reputation" value={stats.avgReputation} />
      <StatCard title="Highest Score" value={stats.highestReputation} />
      <StatCard
        title="Users at Decay Risk"
        value={stats.usersWithDecay}
        warning={stats.usersWithDecay > 100}
      />
    </div>
  );
}
```

### Manual Decay Trigger

```typescript
import { applyReputationDecay } from '@/lib/reputationEngine';

async function AdminDecayControl() {
  const [applying, setApplying] = useState(false);

  async function triggerDecay() {
    setApplying(true);
    try {
      const result = await applyReputationDecay();
      if (result.success) {
        showToast('Reputation decay applied successfully');
      } else {
        showError(result.error);
      }
    } finally {
      setApplying(false);
    }
  }

  return (
    <div>
      <p>Apply reputation decay to inactive users (30+ days inactive)</p>
      <button onClick={triggerDecay} disabled={applying}>
        {applying ? 'Applying...' : 'Apply Reputation Decay'}
      </button>
    </div>
  );
}
```

## Database Schema Notes

This module expects the following database structure:

- **`reputation_rules`** table with configurable rules
- **`reputation_history`** table logging all reputation changes
- **`user_activity_status`** table/view tracking user activity
- **`users`** table with `citizen_score` column
- **RPC function**: `apply_reputation_decay()` - Applies decay logic

## File Location

`C:\Users\Prithvi Putta\Desktop\political-accountability-platform\frontend\src\lib\reputationEngine.ts`
