# moderationActions.ts

## Overview

The `moderationActions.ts` file provides core moderation functionality for handling verification submissions in the political accountability platform. It contains functions for approving and rejecting verifications, with integrated reputation system updates, admin action logging, and in-app notifications.

This module serves as the primary interface for moderators and admins to act on user-submitted verifications of political promises.

## Dependencies

| Module | Purpose |
|--------|---------|
| `./supabase` | Provides the Supabase client instance for authentication and database operations |

## Exported Functions

### `approveVerification(verificationId: string, adminReason?: string): Promise<Result>`

Approves a pending verification, triggering reputation increases and notifications.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `verificationId` | `string` | Yes | UUID of the verification to approve |
| `adminReason` | `string` | No | Optional reason/comment for the approval |

#### Return Type

```typescript
Promise<{
  success: boolean   // Whether the operation succeeded
  error?: string     // Error message if failed
}>
```

#### Side Effects (Handled by Database Function)

| Effect | Description |
|--------|-------------|
| Status Update | Changes verification status to 'approved' |
| Reputation Increase | Awards +10 reputation points to the submitter |
| Admin Action Logging | Records the approval in `admin_actions` table |
| In-App Notification | Sends notification to the submitter |

#### Logic Flow

1. Gets the current authenticated user (admin)
2. Retrieves the admin's internal user ID from `users` table
3. Calls the `approve_verification` database RPC function
4. Returns success/error result

#### Error Handling

Returns `{ success: false, error: message }` on:
- Not authenticated
- Admin user not found in database
- Database function error
- Any unexpected exception

---

### `rejectVerification(verificationId: string, reason: string): Promise<Result>`

Rejects a pending verification with a required reason, triggering reputation decrease and notifications.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `verificationId` | `string` | Yes | UUID of the verification to reject |
| `reason` | `string` | Yes | Required explanation for why the verification was rejected |

#### Return Type

```typescript
Promise<{
  success: boolean   // Whether the operation succeeded
  error?: string     // Error message if failed
}>
```

#### Validation

- The `reason` parameter is required and must not be empty (trimmed)
- Returns early with error if reason is missing

#### Side Effects (Handled by Database Function)

| Effect | Description |
|--------|-------------|
| Status Update | Changes verification status to 'rejected' |
| Reputation Decrease | Deducts -15 reputation points from the submitter |
| Admin Action Logging | Records the rejection in `admin_actions` table |
| In-App Notification | Sends notification with rejection reason to the submitter |

#### Logic Flow

1. Validates that rejection reason is provided
2. Gets the current authenticated user (admin)
3. Retrieves the admin's internal user ID
4. Calls the `reject_verification` database RPC function with the reason
5. Returns success/error result

#### Error Handling

Returns `{ success: false, error: message }` on:
- Missing rejection reason
- Not authenticated
- Admin user not found
- Database function error
- Any unexpected exception

## Reputation Points Reference

| Action | Points | Notes |
|--------|--------|-------|
| Verification Approved | +10 | Rewards quality contributions |
| Verification Rejected | -15 | Discourages low-quality or spam submissions |

## Usage Examples

### Basic Approval

```typescript
import { approveVerification } from '@/lib/moderationActions';

async function handleApprove(verificationId: string) {
  const result = await approveVerification(verificationId);

  if (result.success) {
    console.log('Verification approved successfully');
  } else {
    console.error('Approval failed:', result.error);
  }
}
```

### Approval with Reason

```typescript
import { approveVerification } from '@/lib/moderationActions';

async function handleApprove(verificationId: string) {
  const result = await approveVerification(
    verificationId,
    'Excellent evidence with verified sources'
  );

  if (result.success) {
    showToast('Verification approved!');
  } else {
    showError(result.error);
  }
}
```

### Rejection with Required Reason

```typescript
import { rejectVerification } from '@/lib/moderationActions';

async function handleReject(verificationId: string, reason: string) {
  if (!reason.trim()) {
    showError('Please provide a reason for rejection');
    return;
  }

  const result = await rejectVerification(verificationId, reason);

  if (result.success) {
    showToast('Verification rejected');
  } else {
    showError(result.error);
  }
}
```

### Moderation Queue Component

```typescript
import { approveVerification, rejectVerification } from '@/lib/moderationActions';
import { useState } from 'react';

function VerificationModerationCard({ verification }: { verification: any }) {
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  async function handleApprove() {
    setLoading(true);
    try {
      const result = await approveVerification(verification.id);
      if (result.success) {
        // Refresh list or remove from queue
        onApproved(verification.id);
      } else {
        alert(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }

    setLoading(true);
    try {
      const result = await rejectVerification(verification.id, rejectReason);
      if (result.success) {
        setShowRejectDialog(false);
        onRejected(verification.id);
      } else {
        alert(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded p-4">
      <h3>{verification.promise?.politician_name}</h3>
      <p>{verification.evidence_text}</p>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleApprove}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Approve
        </button>

        <button
          onClick={() => setShowRejectDialog(true)}
          disabled={loading}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Reject
        </button>
      </div>

      {showRejectDialog && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason (required)"
            className="w-full p-2 border rounded"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handleReject} disabled={loading}>
              Confirm Reject
            </button>
            <button onClick={() => setShowRejectDialog(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Batch Moderation

```typescript
import { approveVerification, rejectVerification } from '@/lib/moderationActions';

async function batchApprove(verificationIds: string[]) {
  const results = await Promise.allSettled(
    verificationIds.map(id => approveVerification(id))
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = verificationIds.length - successful;

  return { successful, failed };
}

async function batchReject(verificationIds: string[], reason: string) {
  const results = await Promise.allSettled(
    verificationIds.map(id => rejectVerification(id, reason))
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = verificationIds.length - successful;

  return { successful, failed };
}
```

## Database Functions

This module relies on the following Supabase RPC functions:

### `approve_verification(verification_id, admin_user_id, approval_reason)`

- Updates verification status
- Calculates and applies reputation change
- Logs admin action
- Creates notification for submitter

### `reject_verification(verification_id, admin_user_id, rejection_reason)`

- Updates verification status
- Calculates and applies reputation penalty
- Logs admin action
- Creates notification with rejection reason

## Security Considerations

1. **Authentication Required**: Both functions require an authenticated user
2. **Admin Verification**: The functions verify the user exists in the `users` table
3. **Database-Level Permissions**: Actual permission checks happen in the database functions
4. **Audit Trail**: All actions are logged in the `admin_actions` table
5. **Reason Required for Rejection**: Ensures accountability and user feedback

## File Location

`C:\Users\Prithvi Putta\Desktop\political-accountability-platform\frontend\src\lib\moderationActions.ts`
