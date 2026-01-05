# VerificationReviewCard Component

## File Location
`frontend/src/components/admin/VerificationReviewCard.tsx`

## Component Purpose

The `VerificationReviewCard` component displays a verification for admin review. It provides a comprehensive view including:

- Verification status and verdict
- Trust level and self-verification indicators
- Promise and politician information
- Evidence with source links
- Submitter details with citizen score
- Vote statistics
- Approve/Reject action buttons

## Props Interface

```typescript
interface VerificationReviewCardProps {
  verification: {
    id: string
    evidence_text: string
    evidence_urls?: string[]
    verdict: 'fulfilled' | 'broken' | 'in_progress' | 'stalled'
    status: 'pending' | 'approved' | 'rejected'
    upvotes: number
    downvotes: number
    created_at: string
    trust_level?: 'admin' | 'trusted_community' | 'community' | 'untrusted'
    is_self_verification?: boolean
    verification_weight?: number
    promise: {
      id: string
      politician_name: string
      promise_text: string
    }
    submitter: {
      id: string
      username: string
      citizen_score: number
    }
  }
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `verification` | `object` | Yes | Verification data with related entities |
| `onApprove` | `(id: string) => void` | No | Callback for approve action |
| `onReject` | `(id: string) => void` | No | Callback for reject action |

## State and Hooks Used

This is a stateless presentational component. Computed values:

```typescript
const voteRatio = verification.upvotes + verification.downvotes > 0
  ? Math.round((verification.upvotes / (verification.upvotes + verification.downvotes)) * 100)
  : 0
```

## Configuration Objects

### Verdict Config
```typescript
const verdictConfig = {
  fulfilled: { label: 'Fulfilled', color: 'bg-green-500' },
  broken: { label: 'Broken', color: 'bg-red-500' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500' },
  stalled: { label: 'Stalled', color: 'bg-yellow-500' }
}
```

### Status Config
```typescript
const statusConfig = {
  pending: { label: 'Pending Review', color: 'bg-yellow-600' },
  approved: { label: 'Approved', color: 'bg-green-600' },
  rejected: { label: 'Rejected', color: 'bg-red-600' }
}
```

### Trust Level Config
```typescript
const trustLevelConfig = {
  admin: { label: 'Admin Verified', icon: Shield, className: '...', weight: '3.0x' },
  trusted_community: { label: 'Trusted', icon: Shield, className: '...', weight: '2.0x' },
  community: { label: 'Community', icon: User, className: '...', weight: '1.0x' },
  untrusted: { label: 'New User', icon: ShieldAlert, className: '...', weight: '0.5x' }
}
```

## Rendered Elements

### Card Structure
```
Card (hover:shadow-md)
├── CardHeader
│   ├── Main Section
│   │   ├── Badge Row
│   │   │   ├── Status Badge (Pending/Approved/Rejected)
│   │   │   ├── Verdict Badge (Claim: Fulfilled/Broken/etc.)
│   │   │   ├── Vote Ratio Badge (X% upvotes)
│   │   │   ├── Trust Level Badge (if applicable)
│   │   │   └── Self-Verified Warning (if applicable)
│   │   ├── CardTitle (politician name)
│   │   └── Promise Text
│   └── External Link Button (to promise page)
└── CardContent
    ├── Evidence Section
    │   ├── Evidence Text
    │   └── Evidence URLs (if present)
    ├── Submitter Info Section
    │   ├── Avatar with User Icon
    │   ├── Username
    │   ├── Citizen Score
    │   └── Submission Date
    ├── Voting Stats Section
    │   ├── Upvotes (green background)
    │   └── Downvotes (red background)
    └── Action Buttons (if handlers provided)
        ├── Approve Button (green)
        └── Reject Button (red/destructive)
```

## Dependencies

### Internal Components
- `@/components/ui/card`: Card, CardContent, CardHeader, CardTitle
- `@/components/ui/badge`: Badge
- `@/components/ui/button`: Button
- `@/components/ui/avatar`: Avatar, AvatarFallback

### External Libraries
- `lucide-react`: ThumbsUp, ThumbsDown, ExternalLink, User, Calendar, Award, Shield, ShieldAlert, AlertTriangle
- `next/link`: Link for navigation
- `date-fns`: format function for dates

## Usage Examples

### Basic Usage
```tsx
import { VerificationReviewCard } from '@/components/admin/VerificationReviewCard'

<VerificationReviewCard verification={verification} />
```

### With Action Handlers
```tsx
const handleApprove = async (id: string) => {
  await approveVerification(id)
  refetch()
}

const handleReject = (id: string) => {
  setSelectedId(id)
  setShowRejectDialog(true)
}

<VerificationReviewCard
  verification={verification}
  onApprove={handleApprove}
  onReject={handleReject}
/>
```

### In Review List
```tsx
<div className="space-y-4">
  {pendingVerifications.map((verification) => (
    <VerificationReviewCard
      key={verification.id}
      verification={verification}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  ))}
</div>
```

### With Reject Dialog
```tsx
function VerificationReviewPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  const handleReject = (id: string) => {
    setSelectedId(id)
    setShowRejectDialog(true)
  }

  const confirmReject = async (reason: string) => {
    if (selectedId) {
      await rejectVerification(selectedId, reason)
      setShowRejectDialog(false)
      refetch()
    }
  }

  return (
    <>
      {verifications.map((v) => (
        <VerificationReviewCard
          key={v.id}
          verification={v}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ))}
      <RejectDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        onConfirm={confirmReject}
      />
    </>
  )
}
```

## Styling Notes

- Card has hover shadow effect
- Responsive layout with sm: breakpoints
- Color-coded badges for quick identification
- External link opens in new tab
- Vote statistics have colored backgrounds (green/red)
- Action buttons span full width on mobile
- Evidence text truncated to 3 lines
- Evidence URLs truncated with external link icons

## Displayed Information

| Section | Data Shown |
|---------|------------|
| Header Badges | Status, Verdict, Vote ratio, Trust level, Self-verification warning |
| Promise Info | Politician name, Promise text |
| Evidence | Evidence text, Source URLs |
| Submitter | Username, Citizen score, Submission date |
| Votes | Upvote count, Downvote count |
| Actions | Approve button, Reject button |
