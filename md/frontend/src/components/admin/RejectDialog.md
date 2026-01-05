# RejectDialog Component

## File Location
`frontend/src/components/admin/RejectDialog.tsx`

## Component Purpose

The `RejectDialog` component provides a modal dialog for admin verification rejection. It:

- Requires a rejection reason (minimum 10 characters)
- Shows character count and validation status
- Displays warning about reputation penalty
- Provides cancel and confirm actions
- Shows loading state during submission

## Props Interface

```typescript
interface RejectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
  loading?: boolean
}
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `open` | `boolean` | - | Yes | Controls dialog visibility |
| `onOpenChange` | `(open: boolean) => void` | - | Yes | Callback when open state changes |
| `onConfirm` | `(reason: string) => void` | - | Yes | Callback with rejection reason |
| `loading` | `boolean` | `false` | No | Loading state for submit button |

## State and Hooks Used

### Local State

| State Variable | Type | Initial Value | Purpose |
|---------------|------|---------------|---------|
| `reason` | `string` | `''` | Rejection reason text |

### Validation Constants

```typescript
const minLength = 10
const maxLength = 500
const isValid = reason.trim().length >= minLength
```

## Rendered Elements

### Dialog Structure
```
Dialog
└── DialogContent (max-w-[500px])
    ├── DialogHeader
    │   ├── DialogTitle (with AlertCircle icon, red color)
    │   └── DialogDescription
    ├── Form Content (py-4)
    │   ├── Label with required indicator
    │   ├── Textarea (5 rows, max 500 chars)
    │   ├── Validation Message Row
    │   │   ├── Character requirement status
    │   │   └── Character count
    │   └── Warning Note (yellow background)
    └── DialogFooter
        ├── Cancel Button (outline)
        └── Confirm Button (destructive)
```

## Internal Functions

### handleConfirm
```typescript
const handleConfirm = () => {
  if (isValid && !loading) {
    onConfirm(reason.trim())
    setReason('')
  }
}
```

### handleCancel
```typescript
const handleCancel = () => {
  if (!loading) {
    setReason('')
    onOpenChange(false)
  }
}
```

## Dependencies

### Internal Components
- `@/components/ui/dialog`: Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
- `@/components/ui/button`: Button
- `@/components/ui/textarea`: Textarea
- `@/components/ui/label`: Label

### External Libraries
- `lucide-react`: AlertCircle, Loader2 icons

## Usage Examples

### Basic Usage
```tsx
import { RejectDialog } from '@/components/admin/RejectDialog'
import { useState } from 'react'

function VerificationReview() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleReject = async (reason: string) => {
    setIsLoading(true)
    try {
      await rejectVerification(verificationId, reason)
      setDialogOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setDialogOpen(true)} variant="destructive">
        Reject
      </Button>
      <RejectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleReject}
        loading={isLoading}
      />
    </>
  )
}
```

### In Verification Review Card
```tsx
function VerificationReviewCard({ verification }) {
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  const handleReject = async (reason: string) => {
    setRejecting(true)
    await api.rejectVerification(verification.id, reason)
    setRejecting(false)
    setShowRejectDialog(false)
    refetch()
  }

  return (
    <Card>
      {/* Card content */}
      <Button onClick={() => setShowRejectDialog(true)}>
        Reject
      </Button>

      <RejectDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        onConfirm={handleReject}
        loading={rejecting}
      />
    </Card>
  )
}
```

### With Toast Notification
```tsx
const handleReject = async (reason: string) => {
  try {
    await rejectVerification(id, reason)
    toast.success('Verification rejected')
  } catch (error) {
    toast.error('Failed to reject verification')
  }
}
```

## Validation Rules

| Rule | Value | Description |
|------|-------|-------------|
| Minimum length | 10 characters | Ensures meaningful feedback |
| Maximum length | 500 characters | Prevents excessive text |
| Trim whitespace | Yes | Leading/trailing spaces ignored |

## UI States

### Invalid (< 10 characters)
- Red text: "Minimum 10 characters required"
- Confirm button disabled

### Valid (>= 10 characters)
- Green text: "Valid reason provided"
- Confirm button enabled

### Loading
- Both buttons disabled
- Confirm button shows spinner
- Dialog cannot be closed

## Warning Message

The dialog displays a warning:
> "The user will lose 15 reputation points and receive a notification with this reason. Make sure your feedback is constructive and helps them improve future submissions."

## Styling Notes

- Dialog max width: 500px
- Title has red color with alert icon
- Textarea is non-resizable (5 rows)
- Yellow warning box for consequence notice
- Character count in muted color (right-aligned)
- Validation message color changes based on validity
- Loading spinner on submit button
- Destructive (red) submit button
