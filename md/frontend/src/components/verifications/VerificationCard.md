# VerificationCard Component

## File Location
`frontend/src/components/verifications/VerificationCard.tsx`

## Component Purpose

The `VerificationCard` component displays a verification submission for a political promise. It includes:

- Verdict badge (fulfilled, broken, in_progress, stalled)
- Approval status (pending, approved, rejected)
- Trust level indicator
- Self-verification warning flag
- Submitter information
- Evidence text and URLs
- Voting functionality (upvote/downvote)

## Props Interface

```typescript
interface VerificationCardProps {
  verification: {
    id: string
    verdict: 'fulfilled' | 'broken' | 'in_progress' | 'stalled'
    evidence_text: string
    evidence_urls?: string[]
    status: 'pending' | 'approved' | 'rejected'
    created_at: string
    upvotes: number
    downvotes: number
    trust_level?: 'admin' | 'trusted_community' | 'community' | 'untrusted'
    is_self_verification?: boolean
    submitter?: {
      username: string
      citizen_score: number
    }
  }
  onVoteChange?: () => void
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `verification` | `object` | Yes | Verification data object |
| `onVoteChange` | `() => void` | No | Callback after voting |

## State and Hooks Used

### Local State

| State Variable | Type | Initial Value | Purpose |
|---------------|------|---------------|---------|
| `userVote` | `'upvote' \| 'downvote' \| null` | `null` | User's current vote |
| `upvotes` | `number` | `verification.upvotes` | Current upvote count |
| `downvotes` | `number` | `verification.downvotes` | Current downvote count |
| `isVoting` | `boolean` | `false` | Loading state during vote |
| `hasVoted` | `boolean` | `false` | Whether user has voted |

### Hooks

| Hook | Source | Purpose |
|------|--------|---------|
| `useAuth` | `@/hooks/useAuth` | Get current user for voting |
| `useState` | React | Manage local state |

## Configuration Objects

### Verdict Config
```typescript
const verdictConfig = {
  fulfilled: { label: 'Fulfilled', icon: CheckCircle, className: 'bg-success/10 text-success border-success/20' },
  broken: { label: 'Broken', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
  in_progress: { label: 'In Progress', icon: Clock, className: 'bg-warning/10 text-warning border-warning/20' },
  stalled: { label: 'Stalled', icon: Clock, className: 'bg-muted text-muted-foreground border-muted' },
}
```

### Status Config
```typescript
const statusConfig = {
  pending: { label: 'Pending Review', className: 'bg-muted text-muted-foreground' },
  approved: { label: 'Approved', className: 'bg-success/10 text-success' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive' },
}
```

### Trust Level Config
```typescript
const trustLevelConfig = {
  admin: { label: 'Admin Verified', icon: Shield, className: '...', weight: '3.0x' },
  trusted_community: { label: 'Trusted', icon: Shield, className: '...', weight: '2.0x' },
  community: { label: 'Community', icon: User, className: '...', weight: '1.0x' },
  untrusted: { label: 'New User', icon: ShieldAlert, className: '...', weight: '0.5x' },
}
```

## Rendered Elements

### Card Structure
```
Card
├── CardHeader
│   ├── Badges Section
│   │   ├── Verdict Badge (with icon)
│   │   ├── Status Badge
│   │   ├── Trust Level Badge (if applicable)
│   │   └── Self-Verification Warning (if applicable)
│   ├── Submitter Info (username, score)
│   └── Submission Date
└── CardContent
    ├── Evidence Section
    │   ├── Evidence Text
    │   └── Separator
    ├── Supporting Links (if evidence_urls present)
    │   └── External Links List
    ├── Separator
    └── Voting Section
        ├── Upvote Button (with count)
        ├── Downvote Button (with count)
        └── Total Votes Text
```

## Voting Functionality

### handleVote Function
```typescript
const handleVote = async (voteType: 'upvote' | 'downvote') => {
  // 1. Check if user is logged in
  // 2. Get user's database ID from Supabase
  // 3. Check for existing vote
  // 4. Update or insert vote in database
  // 5. Update local state
  // 6. Call onVoteChange callback
}
```

## Dependencies

### Internal Components
- `@/components/ui/card`: Card, CardContent, CardHeader
- `@/components/ui/button`: Button
- `@/components/ui/badge`: Badge
- `@/components/ui/separator`: Separator

### External Libraries
- `lucide-react`: Various icons
- `date-fns`: format function for dates
- `sonner`: toast notifications

### Services
- `@/lib/supabase`: Supabase client
- `@/hooks/useAuth`: Authentication hook

## Usage Examples

### Basic Usage
```tsx
import { VerificationCard } from '@/components/verifications/VerificationCard'

const verification = {
  id: '123',
  verdict: 'fulfilled',
  evidence_text: 'The government has completed the highway project...',
  evidence_urls: ['https://news.example.com/article'],
  status: 'approved',
  created_at: '2024-01-15T10:00:00Z',
  upvotes: 25,
  downvotes: 3,
  trust_level: 'trusted_community',
  submitter: {
    username: 'john_doe',
    citizen_score: 150
  }
}

<VerificationCard verification={verification} />
```

### With Vote Change Callback
```tsx
const handleVoteChange = () => {
  // Refresh promise data or recalculate status
  refetchPromiseData()
}

<VerificationCard
  verification={verification}
  onVoteChange={handleVoteChange}
/>
```

### In a List
```tsx
<div className="space-y-4">
  {verifications.map((verification) => (
    <VerificationCard
      key={verification.id}
      verification={verification}
      onVoteChange={handleVoteChange}
    />
  ))}
</div>
```

### Self-Verification Example
```tsx
const selfVerification = {
  id: '456',
  verdict: 'in_progress',
  evidence_text: 'Project is currently under construction...',
  status: 'pending',
  created_at: '2024-02-01T14:00:00Z',
  upvotes: 0,
  downvotes: 0,
  is_self_verification: true,
  trust_level: 'community',
  submitter: {
    username: 'jane_smith',
    citizen_score: 75
  }
}

<VerificationCard verification={selfVerification} />
```

## Styling Notes

- Responsive design with sm: breakpoints
- Badges use color-coded backgrounds with transparency
- Evidence text preserves whitespace with `whitespace-pre-wrap`
- External links are truncated with `break-all`
- Vote buttons highlight when user has voted
- Loading state disables vote buttons
- Flexible layout adapts to mobile screens

## Database Interactions

The component interacts with Supabase for:
1. Getting user's database ID from auth_id
2. Checking for existing votes
3. Updating or inserting votes in the `votes` table

## Toast Notifications

Uses `sonner` toast for:
- Login required warning
- Already voted warning
- Vote update success
- Vote recorded success
- Error handling
