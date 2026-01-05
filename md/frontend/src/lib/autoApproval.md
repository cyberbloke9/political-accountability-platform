# autoApproval.ts

## Overview

The `autoApproval.ts` file manages the automatic verification approval system for the political accountability platform. It provides functionality to configure, monitor, and analyze the auto-approval rules that allow trusted users to have their verifications approved without manual review.

This system reduces moderator workload while maintaining quality by only auto-approving submissions from users who meet strict trust criteria.

## Dependencies

| Module | Purpose |
|--------|---------|
| `./supabase` | Provides the Supabase client instance for database operations |

## Interfaces

### `AutoApprovalRules`

Defines the configurable criteria for automatic verification approval.

```typescript
interface AutoApprovalRules {
  id: string                      // Unique rules ID
  enabled: boolean                // Whether auto-approval is active
  min_citizen_score: number       // Minimum reputation score required
  min_evidence_length: number     // Minimum evidence text length
  require_source_url: boolean     // Whether a source URL is mandatory
  min_account_age_days: number    // Minimum account age in days
  min_approved_verifications: number  // Minimum prior approved verifications
  max_recent_rejections: number   // Maximum allowed recent rejections
  rejection_lookback_days: number // Days to look back for rejections
  description: string             // Description of current rules
  updated_at: string              // Last update timestamp
}
```

#### Rules Criteria Explained

| Criterion | Purpose |
|-----------|---------|
| `min_citizen_score` | Ensures user has demonstrated trustworthiness |
| `min_evidence_length` | Prevents low-effort submissions |
| `require_source_url` | Ensures verifiable sources are provided |
| `min_account_age_days` | Prevents new account abuse |
| `min_approved_verifications` | Requires proven track record |
| `max_recent_rejections` | Catches declining quality |
| `rejection_lookback_days` | Time window for rejection count |

### `AutoApprovalLog`

Records each auto-approval evaluation attempt.

```typescript
interface AutoApprovalLog {
  id: string                       // Log entry ID
  verification_id: string          // Verification that was evaluated
  user_id: string                  // User who submitted
  auto_approved: boolean           // Whether it was auto-approved
  reason: string                   // Human-readable reason
  criteria_met: Record<string, any>    // Which criteria passed/failed
  rules_snapshot: Record<string, any>  // Rules at time of evaluation
  created_at: string               // When evaluation occurred
}
```

## Exported Functions

### `getAutoApprovalRules(): Promise<Result>`

Retrieves the current auto-approval configuration.

#### Parameters

None

#### Return Type

```typescript
Promise<{
  data: AutoApprovalRules | null
  error: any
}>
```

#### Note

The system uses a single rules row, fetched with `.single()`.

---

### `updateAutoApprovalRules(updates: Partial<Updates>): Promise<Result>`

Updates the auto-approval rules (SuperAdmin only).

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `updates` | `Partial<Omit<AutoApprovalRules, 'id' \| 'created_at' \| 'updated_at'>>` | Fields to update |

#### Return Type

```typescript
Promise<{
  success: boolean
  error?: string
}>
```

#### Logic Flow

1. Fetches current rules to get the ID
2. Updates only the specified fields
3. Sets `updated_at` to current timestamp

---

### `getAutoApprovalLogs(filters?: Filters): Promise<Result>`

Retrieves auto-approval evaluation logs with optional filtering.

#### Parameters

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `filters.auto_approved` | `boolean` | - | Filter by approval result |
| `filters.limit` | `number` | `50` | Maximum records to return |

#### Return Type

```typescript
Promise<{
  data: AutoApprovalLog[] | null
  error: any
}>
```

---

### `getAutoApprovalStats(): Promise<Stats>`

Retrieves comprehensive auto-approval statistics.

#### Parameters

None

#### Return Type

```typescript
Promise<{
  totalChecked: number     // Total evaluations performed
  totalApproved: number    // Number auto-approved
  totalRejected: number    // Number not auto-approved (sent to queue)
  approvalRate: number     // Percentage auto-approved (0-100)
  todayApproved: number    // Auto-approvals today
  topUsers: Array<{        // Most auto-approved users (TODO)
    user_id: string
    username: string
    auto_approved_count: number
  }>
}>
```

---

### `estimateQualificationRate(rules: AutoApprovalRules): Promise<Estimate>`

Estimates how many recent submissions would qualify under given rules.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `rules` | `AutoApprovalRules` | Rules configuration to test |

#### Return Type

```typescript
Promise<{
  totalRecent: number        // Submissions in last 7 days
  wouldQualify: number       // Number that would qualify
  qualificationRate: number  // Percentage (0-100)
}>
```

#### Use Case

Allows admins to preview the impact of rule changes before applying them.

## Usage Examples

### Rules Configuration Panel

```typescript
import { getAutoApprovalRules, updateAutoApprovalRules } from '@/lib/autoApproval';
import { useState, useEffect } from 'react';

function AutoApprovalConfig() {
  const [rules, setRules] = useState<AutoApprovalRules | null>(null);

  useEffect(() => {
    getAutoApprovalRules().then(({ data }) => setRules(data));
  }, []);

  async function handleToggle() {
    if (!rules) return;

    const result = await updateAutoApprovalRules({
      enabled: !rules.enabled
    });

    if (result.success) {
      setRules({ ...rules, enabled: !rules.enabled });
    }
  }

  async function handleUpdate(field: string, value: number | boolean) {
    const result = await updateAutoApprovalRules({
      [field]: value
    });

    if (result.success) {
      setRules(r => r ? { ...r, [field]: value } : null);
    }
  }

  if (!rules) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h2>Auto-Approval Settings</h2>
        <button
          onClick={handleToggle}
          className={rules.enabled ? 'bg-green-500' : 'bg-gray-500'}
        >
          {rules.enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label>
          Minimum Citizen Score
          <input
            type="number"
            value={rules.min_citizen_score}
            onChange={(e) => handleUpdate('min_citizen_score', parseInt(e.target.value))}
          />
        </label>

        <label>
          Minimum Evidence Length
          <input
            type="number"
            value={rules.min_evidence_length}
            onChange={(e) => handleUpdate('min_evidence_length', parseInt(e.target.value))}
          />
        </label>

        <label>
          Minimum Account Age (days)
          <input
            type="number"
            value={rules.min_account_age_days}
            onChange={(e) => handleUpdate('min_account_age_days', parseInt(e.target.value))}
          />
        </label>

        <label>
          Minimum Approved Verifications
          <input
            type="number"
            value={rules.min_approved_verifications}
            onChange={(e) => handleUpdate('min_approved_verifications', parseInt(e.target.value))}
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={rules.require_source_url}
            onChange={(e) => handleUpdate('require_source_url', e.target.checked)}
          />
          Require Source URL
        </label>
      </div>
    </div>
  );
}
```

### Auto-Approval Statistics Dashboard

```typescript
import { getAutoApprovalStats } from '@/lib/autoApproval';

async function AutoApprovalDashboard() {
  const stats = await getAutoApprovalStats();

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Total Evaluated"
        value={stats.totalChecked}
      />
      <StatCard
        title="Auto-Approved"
        value={stats.totalApproved}
        color="green"
      />
      <StatCard
        title="Sent to Queue"
        value={stats.totalRejected}
        color="orange"
      />
      <StatCard
        title="Approval Rate"
        value={`${stats.approvalRate}%`}
        color={stats.approvalRate > 50 ? 'green' : 'red'}
      />
      <StatCard
        title="Approved Today"
        value={stats.todayApproved}
      />
    </div>
  );
}
```

### Evaluation Logs Viewer

```typescript
import { getAutoApprovalLogs } from '@/lib/autoApproval';

async function AutoApprovalLogs() {
  const { data: logs } = await getAutoApprovalLogs({ limit: 100 });

  return (
    <div>
      <h2>Recent Auto-Approval Evaluations</h2>
      <table>
        <thead>
          <tr>
            <th>Verification</th>
            <th>Result</th>
            <th>Reason</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {logs?.map(log => (
            <tr key={log.id}>
              <td>{log.verification_id}</td>
              <td>
                <span className={log.auto_approved ? 'text-green-600' : 'text-orange-600'}>
                  {log.auto_approved ? 'Auto-Approved' : 'Queued'}
                </span>
              </td>
              <td>{log.reason}</td>
              <td>{new Date(log.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Failed Criteria Analysis

```typescript
import { getAutoApprovalLogs } from '@/lib/autoApproval';

async function FailedCriteriaAnalysis() {
  const { data: logs } = await getAutoApprovalLogs({ auto_approved: false });

  // Analyze which criteria fail most often
  const failureCounts: Record<string, number> = {};

  logs?.forEach(log => {
    Object.entries(log.criteria_met).forEach(([criterion, passed]) => {
      if (!passed) {
        failureCounts[criterion] = (failureCounts[criterion] || 0) + 1;
      }
    });
  });

  const sortedFailures = Object.entries(failureCounts)
    .sort(([, a], [, b]) => b - a);

  return (
    <div>
      <h2>Most Common Failure Reasons</h2>
      <ul>
        {sortedFailures.map(([criterion, count]) => (
          <li key={criterion}>
            {criterion}: {count} failures
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Rule Impact Estimation

```typescript
import { getAutoApprovalRules, estimateQualificationRate, updateAutoApprovalRules } from '@/lib/autoApproval';

async function RuleImpactPreview() {
  const { data: currentRules } = await getAutoApprovalRules();
  const [testRules, setTestRules] = useState(currentRules);
  const [estimate, setEstimate] = useState<any>(null);

  async function calculateImpact() {
    if (!testRules) return;
    const result = await estimateQualificationRate(testRules);
    setEstimate(result);
  }

  async function applyRules() {
    if (!testRules) return;
    await updateAutoApprovalRules(testRules);
  }

  return (
    <div>
      <h2>Rule Impact Preview</h2>

      <div className="space-y-2">
        <label>
          Test Minimum Citizen Score:
          <input
            type="number"
            value={testRules?.min_citizen_score || 0}
            onChange={(e) => setTestRules(r => r ? {
              ...r,
              min_citizen_score: parseInt(e.target.value)
            } : null)}
          />
        </label>
      </div>

      <button onClick={calculateImpact}>Calculate Impact</button>

      {estimate && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p>Based on last 7 days of submissions:</p>
          <ul>
            <li>Total Submissions: {estimate.totalRecent}</li>
            <li>Would Qualify: {estimate.wouldQualify}</li>
            <li>Qualification Rate: {estimate.qualificationRate}%</li>
          </ul>

          <button onClick={applyRules} className="mt-2 bg-blue-500 text-white">
            Apply These Rules
          </button>
        </div>
      )}
    </div>
  );
}
```

## Auto-Approval Flow

```
User Submits Verification
         |
         v
  +-------------------+
  | Check if enabled  |
  +-------------------+
         |
         v
  +-------------------+
  | Evaluate Criteria |
  |  - Citizen Score  |
  |  - Evidence Length|
  |  - Source URL     |
  |  - Account Age    |
  |  - Past Approvals |
  |  - Recent Rejects |
  +-------------------+
         |
    +----+----+
    |         |
 All Pass  Any Fail
    |         |
    v         v
+--------+ +--------+
|  Auto  | | Manual |
|Approve | | Queue  |
+--------+ +--------+
    |         |
    v         v
  +-------------------+
  |  Log Evaluation   |
  +-------------------+
```

## Database Schema Notes

This module expects:

- **`auto_approval_rules`** table with single row for configuration
- **`auto_approval_log`** table for evaluation history
- **`verifications`** table for submission data
- **`users`** table for user criteria checking

## File Location

`C:\Users\Prithvi Putta\Desktop\political-accountability-platform\frontend\src\lib\autoApproval.ts`
