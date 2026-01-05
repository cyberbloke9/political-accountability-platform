# fraudDetection.ts

## Overview

The `fraudDetection.ts` file provides fraud detection and management functionality for the political accountability platform. It handles querying, reviewing, and managing fraud flags that identify potentially malicious or abusive behavior such as spam, vote manipulation, low-quality content, duplicates, and coordinated voting attacks.

This module is critical for maintaining platform integrity by surfacing suspicious activities for admin review and enabling automated fraud detection algorithms.

## Dependencies

| Module | Purpose |
|--------|---------|
| `./supabase` | Provides the Supabase client instance for database operations |

## Interfaces

### `FraudFlag`

Represents a detected fraud indicator requiring review.

```typescript
interface FraudFlag {
  id: string
  flag_type: 'spam' | 'vote_manipulation' | 'low_quality' | 'duplicate' | 'coordinated_voting'
  target_type: 'verification' | 'user' | 'vote'
  target_id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'reviewed' | 'confirmed' | 'dismissed'
  confidence_score: number        // 0-1 confidence in detection
  details: Record<string, any>    // Detection algorithm details
  auto_detected: boolean          // True if system-detected
  reviewed_by?: string            // Admin who reviewed
  reviewed_at?: string            // When it was reviewed
  created_at: string              // When flag was created
}
```

#### Flag Types Explained

| Type | Description |
|------|-------------|
| `spam` | Content identified as spam or promotional |
| `vote_manipulation` | Artificial vote inflation/deflation |
| `low_quality` | Content failing quality standards |
| `duplicate` | Repeated/copied content |
| `coordinated_voting` | Organized voting campaigns |

#### Severity Levels

| Level | Description | Priority |
|-------|-------------|----------|
| `low` | Minor concern, monitor | Lowest |
| `medium` | Moderate concern, review soon | Normal |
| `high` | Significant issue, review quickly | High |
| `critical` | Urgent, immediate action needed | Highest |

#### Status Values

| Status | Description |
|--------|-------------|
| `pending` | Awaiting admin review |
| `reviewed` | Reviewed but no decision yet |
| `confirmed` | Fraud confirmed, action taken |
| `dismissed` | False positive, no action needed |

### `FraudFlagWithTarget`

Extended fraud flag with enriched target information.

```typescript
interface FraudFlagWithTarget extends FraudFlag {
  verification?: {
    id: string
    verdict: string
    evidence_text: string
    promise: {
      id: string
      promise_text: string
      politician_name: string
    }
    submitted_by_user: {
      username: string
      citizen_score: number
    }
  }
  user?: {
    id: string
    username: string
    citizen_score: number
    created_at: string
  }
}
```

## Exported Functions

### `getFraudFlags(filters?: FlagFilters): Promise<Result>`

Retrieves fraud flags with optional filtering and enriched target data.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `filters.status` | `string` | Filter by status |
| `filters.severity` | `string` | Filter by severity |
| `filters.flag_type` | `string` | Filter by flag type |

#### Return Type

```typescript
Promise<{
  data: FraudFlagWithTarget[] | null
  error: any
}>
```

#### Logic

1. Queries fraud flags with applied filters
2. For each flag, fetches related target data:
   - For verifications: Fetches verification details with promise and user
   - For users: Fetches user profile data
3. Returns enriched flag objects

---

### `runFraudDetection(): Promise<Result>`

Manually triggers the fraud detection algorithms.

#### Parameters

None

#### Return Type

```typescript
Promise<{
  success: boolean
  error?: string
}>
```

#### Implementation

Calls the `run_fraud_detection` RPC function which runs various detection algorithms including:
- Spam content detection
- Vote pattern analysis
- Duplicate content identification
- Coordinated behavior detection

---

### `reviewFraudFlag(flagId: string, newStatus: Status, adminNotes?: string): Promise<Result>`

Reviews and updates a fraud flag status.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `flagId` | `string` | Flag to review |
| `newStatus` | `'confirmed' \| 'dismissed'` | Review decision |
| `adminNotes` | `string` | Optional notes about the review |

#### Return Type

```typescript
Promise<{
  success: boolean
  error?: string
}>
```

#### Logic

1. Gets current authenticated admin user
2. Looks up admin's internal user ID
3. Calls `review_fraud_flag` RPC with decision

---

### `getFraudStats(): Promise<FraudStats>`

Retrieves aggregated fraud flag statistics.

#### Parameters

None

#### Return Type

```typescript
Promise<{
  total: number              // Total flags ever created
  pending: number            // Flags awaiting review
  confirmed: number          // Confirmed fraud cases
  dismissed: number          // Dismissed false positives
  bySeverity: Record<string, number>  // Count by severity level
  byType: Record<string, number>      // Count by flag type
}>
```

## Usage Examples

### Fraud Queue Dashboard

```typescript
import { getFraudFlags, reviewFraudFlag } from '@/lib/fraudDetection';

async function FraudReviewQueue() {
  const { data: flags } = await getFraudFlags({ status: 'pending' });

  async function handleReview(flagId: string, decision: 'confirmed' | 'dismissed') {
    const notes = prompt('Add review notes (optional):');
    const result = await reviewFraudFlag(flagId, decision, notes || undefined);

    if (result.success) {
      // Refresh the queue
    }
  }

  return (
    <div>
      <h2>Fraud Review Queue ({flags?.length} pending)</h2>

      {flags?.map(flag => (
        <div key={flag.id} className="border p-4 rounded mb-4">
          <div className="flex justify-between">
            <div>
              <span className={`badge severity-${flag.severity}`}>
                {flag.severity.toUpperCase()}
              </span>
              <span className={`badge type-${flag.flag_type}`}>
                {flag.flag_type}
              </span>
            </div>
            <span className="text-gray-500">
              Confidence: {(flag.confidence_score * 100).toFixed(0)}%
            </span>
          </div>

          {flag.verification && (
            <div className="mt-2">
              <p><strong>Verification:</strong> {flag.verification.evidence_text.substring(0, 100)}...</p>
              <p><strong>Submitter:</strong> {flag.verification.submitted_by_user.username}
                (Score: {flag.verification.submitted_by_user.citizen_score})</p>
            </div>
          )}

          {flag.user && (
            <div className="mt-2">
              <p><strong>User:</strong> {flag.user.username}</p>
              <p><strong>Score:</strong> {flag.user.citizen_score}</p>
              <p><strong>Joined:</strong> {new Date(flag.user.created_at).toLocaleDateString()}</p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleReview(flag.id, 'confirmed')}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Confirm Fraud
            </button>
            <button
              onClick={() => handleReview(flag.id, 'dismissed')}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Fraud Statistics Dashboard

```typescript
import { getFraudStats } from '@/lib/fraudDetection';

async function FraudStatsDashboard() {
  const stats = await getFraudStats();

  const severityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Flags" value={stats.total} />
        <StatCard title="Pending Review" value={stats.pending} color="yellow" />
        <StatCard title="Confirmed" value={stats.confirmed} color="red" />
        <StatCard title="Dismissed" value={stats.dismissed} color="gray" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3>By Severity</h3>
          <div className="space-y-2">
            {Object.entries(stats.bySeverity).map(([severity, count]) => (
              <div key={severity} className="flex justify-between">
                <span className={`px-2 py-1 rounded ${severityColors[severity as keyof typeof severityColors]}`}>
                  {severity}
                </span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3>By Type</h3>
          <div className="space-y-2">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex justify-between">
                <span>{type.replace('_', ' ')}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Filtered Fraud Investigation

```typescript
import { getFraudFlags } from '@/lib/fraudDetection';
import { useState, useEffect } from 'react';

function FraudInvestigation() {
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    flag_type: ''
  });
  const [flags, setFlags] = useState<FraudFlagWithTarget[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await getFraudFlags(
        Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v)
        )
      );
      setFlags(data || []);
    }
    load();
  }, [filters]);

  return (
    <div>
      <div className="filters grid grid-cols-3 gap-4 mb-6">
        <select
          value={filters.status}
          onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="confirmed">Confirmed</option>
          <option value="dismissed">Dismissed</option>
        </select>

        <select
          value={filters.severity}
          onChange={(e) => setFilters(f => ({ ...f, severity: e.target.value }))}
        >
          <option value="">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <select
          value={filters.flag_type}
          onChange={(e) => setFilters(f => ({ ...f, flag_type: e.target.value }))}
        >
          <option value="">All Types</option>
          <option value="spam">Spam</option>
          <option value="vote_manipulation">Vote Manipulation</option>
          <option value="low_quality">Low Quality</option>
          <option value="duplicate">Duplicate</option>
          <option value="coordinated_voting">Coordinated Voting</option>
        </select>
      </div>

      <div className="results">
        <p>Found {flags.length} flags</p>
        {/* Display flags */}
      </div>
    </div>
  );
}
```

### Manual Fraud Detection Trigger

```typescript
import { runFraudDetection, getFraudStats } from '@/lib/fraudDetection';
import { useState } from 'react';

function FraudDetectionControl() {
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  async function triggerDetection() {
    setRunning(true);
    setLastResult(null);

    try {
      const beforeStats = await getFraudStats();
      const result = await runFraudDetection();

      if (result.success) {
        const afterStats = await getFraudStats();
        const newFlags = afterStats.total - beforeStats.total;
        setLastResult(`Detection complete. ${newFlags} new flags created.`);
      } else {
        setLastResult(`Error: ${result.error}`);
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="p-4 border rounded">
      <h3>Fraud Detection</h3>
      <p className="text-gray-600 mb-4">
        Run the fraud detection algorithms to scan for suspicious activity.
      </p>

      <button
        onClick={triggerDetection}
        disabled={running}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {running ? 'Running Detection...' : 'Run Fraud Detection'}
      </button>

      {lastResult && (
        <p className="mt-4 p-2 bg-gray-100 rounded">{lastResult}</p>
      )}
    </div>
  );
}
```

### Critical Alerts Component

```typescript
import { getFraudFlags } from '@/lib/fraudDetection';

async function CriticalFraudAlerts() {
  const { data: criticalFlags } = await getFraudFlags({
    status: 'pending',
    severity: 'critical'
  });

  if (!criticalFlags?.length) return null;

  return (
    <div className="bg-red-100 border-l-4 border-red-500 p-4">
      <div className="flex items-center">
        <span className="text-red-700 font-bold">
          {criticalFlags.length} Critical Fraud Alert{criticalFlags.length > 1 ? 's' : ''}
        </span>
      </div>
      <ul className="mt-2">
        {criticalFlags.slice(0, 3).map(flag => (
          <li key={flag.id} className="text-red-600">
            {flag.flag_type}: {flag.target_type} {flag.target_id.substring(0, 8)}...
          </li>
        ))}
      </ul>
      <Link href="/admin/fraud" className="text-red-700 underline">
        View All
      </Link>
    </div>
  );
}
```

## Detection Algorithm Details

The `run_fraud_detection` RPC function typically checks for:

### Spam Detection
- Repetitive content patterns
- Excessive submission frequency
- Known spam indicators in text

### Vote Manipulation
- Voting patterns from same IP/device
- Unusual voting velocity
- Votes from new accounts

### Low Quality
- Very short evidence text
- Missing source URLs
- Generic/vague content

### Duplicate Detection
- Text similarity algorithms
- Cross-reference with existing content
- User submission patterns

### Coordinated Voting
- Temporal clustering analysis
- User relationship graphs
- Cross-platform behavior

## Database Schema Notes

This module expects:

- **`fraud_flags`** table with flag records
- **`verifications`** table for target lookups
- **`users`** table for user lookups
- **`promises`** table for promise context
- **RPC functions**:
  - `run_fraud_detection()` - Runs all detection algorithms
  - `review_fraud_flag(flag_id, admin_user_id, new_status, admin_notes)` - Records review decision

## File Location

`C:\Users\Prithvi Putta\Desktop\political-accountability-platform\frontend\src\lib\fraudDetection.ts`
