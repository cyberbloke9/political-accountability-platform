# FlaggedAccountCard Component

## File Location
`frontend/src/components/admin/FlaggedAccountCard.tsx`

## Component Purpose

The `FlaggedAccountCard` component displays flagged user accounts for admin review. It shows:

- Flag status (active, resolved, dismissed)
- Severity level (low, medium, high, critical)
- Flag type and description
- Flagged user information
- Flag reason and penalty information
- Resolution status and actions

## Props Interface

```typescript
interface FlaggedAccountCardProps {
  flag: {
    id: string
    user_id: string
    flag_type: 'sybil_voting_pattern' | 'rapid_submission' | 'coordinated_activity' | 'suspicious_voting'
    severity: 'low' | 'medium' | 'high' | 'critical'
    flag_reason: string
    penalty_applied: number
    status: 'active' | 'resolved' | 'dismissed'
    created_at: string
    resolved_at?: string
    resolved_by?: string
    user: {
      id: string
      username: string
      citizen_score: number
      trust_level?: string
    }
  }
  onResolve?: (id: string) => void
  onDismiss?: (id: string) => void
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `flag` | `object` | Yes | Flagged account data with user details |
| `onResolve` | `(id: string) => void` | No | Callback to mark as resolved |
| `onDismiss` | `(id: string) => void` | No | Callback to dismiss flag |

## State and Hooks Used

This is a stateless presentational component. No hooks are used.

## Configuration Objects

### Flag Type Config
```typescript
const flagTypeConfig = {
  sybil_voting_pattern: {
    label: 'Sybil Voting Pattern',
    description: 'Detected coordinated voting behavior',
    icon: TrendingDown,
  },
  rapid_submission: {
    label: 'Rapid Submission',
    description: 'Suspicious high-frequency submissions',
    icon: Clock,
  },
  coordinated_activity: {
    label: 'Coordinated Activity',
    description: 'Pattern of coordinated actions detected',
    icon: Shield,
  },
  suspicious_voting: {
    label: 'Suspicious Voting',
    description: 'Unusual voting patterns detected',
    icon: AlertTriangle,
  },
}
```

### Severity Config
```typescript
const severityConfig = {
  low: {
    label: 'Low',
    color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    textColor: 'text-yellow-600'
  },
  medium: {
    label: 'Medium',
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    textColor: 'text-orange-600'
  },
  high: {
    label: 'High',
    color: 'bg-red-500/10 text-red-600 border-red-500/20',
    textColor: 'text-red-600'
  },
  critical: {
    label: 'Critical',
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    textColor: 'text-purple-600'
  },
}
```

### Status Config
```typescript
const statusConfig = {
  active: {
    label: 'Active',
    color: 'bg-red-600 text-white',
    icon: AlertTriangle
  },
  resolved: {
    label: 'Resolved',
    color: 'bg-green-600 text-white',
    icon: CheckCircle
  },
  dismissed: {
    label: 'Dismissed',
    color: 'bg-gray-600 text-white',
    icon: XCircle
  },
}
```

## Rendered Elements

### Card Structure
```
Card (hover:shadow-md)
├── CardHeader
│   └── Main Section
│       ├── Badge Row
│       │   ├── Status Badge (with icon)
│       │   ├── Severity Badge
│       │   └── Flag Type Badge (with icon)
│       ├── CardTitle ("Flagged User: {username}")
│       └── Flag Type Description
└── CardContent
    ├── User Info Section (border-top)
    │   ├── Avatar with User Icon
    │   ├── Username
    │   ├── Citizen Score
    │   ├── Trust Level (if present)
    │   └── Flag Creation Date
    ├── Reason Section (border-top)
    │   └── Flag Reason Text
    ├── Penalty Info (if penalty > 0)
    │   └── Red warning box with penalty amount
    ├── Resolution Info (if resolved)
    │   └── Resolution date
    └── Action Buttons (if status === 'active' and handlers provided)
        ├── Mark Resolved Button (green)
        └── Dismiss Flag Button (outline)
```

## Dependencies

### Internal Components
- `@/components/ui/card`: Card, CardContent, CardHeader, CardTitle
- `@/components/ui/badge`: Badge
- `@/components/ui/button`: Button
- `@/components/ui/avatar`: Avatar, AvatarFallback

### External Libraries
- `lucide-react`: AlertTriangle, Shield, Clock, User, CheckCircle, XCircle, TrendingDown
- `date-fns`: format function for dates

## Usage Examples

### Basic Usage
```tsx
import { FlaggedAccountCard } from '@/components/admin/FlaggedAccountCard'

<FlaggedAccountCard flag={flaggedAccount} />
```

### With Action Handlers
```tsx
const handleResolve = async (id: string) => {
  await resolveFlaggedAccount(id)
  refetch()
}

const handleDismiss = async (id: string) => {
  await dismissFlaggedAccount(id)
  refetch()
}

<FlaggedAccountCard
  flag={flaggedAccount}
  onResolve={handleResolve}
  onDismiss={handleDismiss}
/>
```

### In Flagged Accounts List
```tsx
<div className="space-y-4">
  {flaggedAccounts.map((flag) => (
    <FlaggedAccountCard
      key={flag.id}
      flag={flag}
      onResolve={handleResolve}
      onDismiss={handleDismiss}
    />
  ))}
</div>
```

### Filtering by Status
```tsx
// Show only active flags
const activeFlags = flags.filter(f => f.status === 'active')

<div className="space-y-4">
  {activeFlags.map((flag) => (
    <FlaggedAccountCard
      key={flag.id}
      flag={flag}
      onResolve={handleResolve}
      onDismiss={handleDismiss}
    />
  ))}
</div>
```

## Displayed Information

| Section | Data Shown |
|---------|------------|
| Header Badges | Status with icon, Severity level, Flag type with icon |
| Title | "Flagged User: {username}" |
| Description | Flag type description |
| User Info | Avatar, Username, Citizen score, Trust level, Flag date |
| Reason | Full flag reason text |
| Penalty | Points deducted (if any) |
| Resolution | Resolution date (if resolved) |
| Actions | Resolve and Dismiss buttons (if active) |

## Styling Notes

- Card has hover shadow effect
- Responsive layout with sm: breakpoints
- Color-coded badges for severity and status
- Red warning box for penalty information
- Icon in badge for quick identification
- Action buttons span full width on mobile
- Status icons match status meaning (alert for active, check for resolved, X for dismissed)

## Action Button Behavior

- Buttons only shown when:
  - Flag status is 'active'
  - AND (onResolve OR onDismiss is provided)
- "Mark Resolved" button has green background
- "Dismiss Flag" button has outline style
- Both buttons include relevant icons
