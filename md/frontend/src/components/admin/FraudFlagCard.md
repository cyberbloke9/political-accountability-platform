# FraudFlagCard Component

## File Location
`frontend/src/components/admin/FraudFlagCard.tsx`

## Component Purpose

The `FraudFlagCard` component displays fraud detection flags for admin review. It shows:

- Severity level (low, medium, high, critical)
- Flag type (spam, vote manipulation, low quality, etc.)
- Review status (pending, reviewed, confirmed, dismissed)
- Target details (verification or user)
- Detection details and confidence score
- Admin action buttons for confirming or dismissing flags

## Props Interface

```typescript
interface FraudFlagCardProps {
  flag: FraudFlagWithTarget
  onConfirm?: (flagId: string, notes?: string) => void
  onDismiss?: (flagId: string, notes?: string) => void
  loading?: boolean
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `flag` | `FraudFlagWithTarget` | Yes | Fraud flag data with target details |
| `onConfirm` | `(flagId: string, notes?: string) => void` | No | Callback to confirm fraud |
| `onDismiss` | `(flagId: string, notes?: string) => void` | No | Callback to dismiss flag |
| `loading` | `boolean` | No | Loading state for buttons |

### FraudFlagWithTarget Type
Imported from `@/lib/fraudDetection`. Contains:
- `id`: Flag ID
- `severity`: 'low' | 'medium' | 'high' | 'critical'
- `flag_type`: Type of fraud detected
- `status`: Review status
- `confidence_score`: Detection confidence (0-1)
- `target_type`: 'verification' | 'user'
- `auto_detected`: Boolean
- `details`: JSON object with detection details
- `reviewed_at`: Review timestamp
- `verification`: Linked verification (if target_type is 'verification')
- `user`: Linked user (if target_type is 'user')

## State and Hooks Used

### Local State

| State Variable | Type | Initial Value | Purpose |
|---------------|------|---------------|---------|
| `expanded` | `boolean` | `false` | Controls detail section visibility |
| `adminNotes` | `string` | `''` | Admin notes input value |

## Configuration Objects

### Severity Config
```typescript
const severityConfig = {
  low: { label: 'Low', color: 'bg-blue-100 text-blue-800', icon: Shield },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
}
```

### Type Config
```typescript
const typeConfig = {
  spam: { label: 'Spam', description: 'Rapid or repetitive submissions' },
  vote_manipulation: { label: 'Vote Manipulation', description: 'Suspicious voting patterns' },
  low_quality: { label: 'Low Quality', description: 'Poor evidence or AI-generated content' },
  duplicate: { label: 'Duplicate', description: 'Plagiarized or copied evidence' },
  coordinated_voting: { label: 'Coordinated Voting', description: 'Organized vote brigading' }
}
```

### Status Config
```typescript
const statusConfig = {
  pending: { label: 'Pending Review', color: 'bg-gray-100 text-gray-800' },
  reviewed: { label: 'Reviewed', color: 'bg-blue-100 text-blue-800' },
  confirmed: { label: 'Confirmed', color: 'bg-red-100 text-red-800' },
  dismissed: { label: 'Dismissed', color: 'bg-green-100 text-green-800' }
}
```

## Rendered Elements

### Card Structure
```
Card (hover:shadow-md)
├── CardHeader
│   ├── Info Section
│   │   ├── Badge Row
│   │   │   ├── Severity Badge (with icon)
│   │   │   ├── Type Badge
│   │   │   ├── Status Badge
│   │   │   └── Auto-detected Badge (if applicable)
│   │   ├── Meta Info (confidence, target type)
│   │   └── Type Description
│   └── Expand/Collapse Button
└── CardContent (if expanded)
    ├── Target Details Section
    │   ├── Verification Details (if verification target)
    │   │   ├── Promise text
    │   │   ├── Politician name
    │   │   ├── Verdict
    │   │   ├── Submitter info
    │   │   └── Evidence preview
    │   └── User Details (if user target)
    │       ├── Username
    │       ├── Citizen Score
    │       └── Account Created date
    ├── Detection Details (JSON display)
    ├── Review Section (if pending and handlers provided)
    │   ├── Admin Notes Textarea
    │   └── Action Buttons (Confirm/Dismiss)
    └── Review Info (if already reviewed)
        ├── Review timestamp
        └── Admin notes (if any)
```

## Dependencies

### Internal Components
- `@/components/ui/badge`: Badge component
- `@/components/ui/button`: Button component
- `@/components/ui/card`: Card, CardContent, CardHeader

### External Libraries
- `lucide-react`: AlertTriangle, CheckCircle, Shield, User, FileText, XCircle, ChevronDown, ChevronUp

### Types
- `@/lib/fraudDetection`: FraudFlagWithTarget type

## Usage Examples

### Basic Usage
```tsx
import { FraudFlagCard } from '@/components/admin/FraudFlagCard'

<FraudFlagCard flag={fraudFlag} />
```

### With Action Handlers
```tsx
const handleConfirm = async (flagId: string, notes?: string) => {
  await confirmFraudFlag(flagId, notes)
  refetchFlags()
}

const handleDismiss = async (flagId: string, notes?: string) => {
  await dismissFraudFlag(flagId, notes)
  refetchFlags()
}

<FraudFlagCard
  flag={fraudFlag}
  onConfirm={handleConfirm}
  onDismiss={handleDismiss}
  loading={isProcessing}
/>
```

### In Flag Review List
```tsx
<div className="space-y-4">
  {fraudFlags.map((flag) => (
    <FraudFlagCard
      key={flag.id}
      flag={flag}
      onConfirm={handleConfirm}
      onDismiss={handleDismiss}
    />
  ))}
</div>
```

### Read-Only (Already Reviewed)
```tsx
// When flag.status !== 'pending', action buttons are hidden
<FraudFlagCard flag={reviewedFlag} />
```

## Styling Notes

- Card has hover shadow effect
- Collapsible detail section for cleaner UI
- Color-coded badges for quick severity identification
- Muted background for nested content sections
- JSON details displayed in monospace font
- Warning note section for action consequences
- Destructive styling for confirm button
- Disabled state on buttons during loading

## Admin Workflow

1. Admin views fraud flags list
2. Clicks expand to see details
3. Reviews target information and detection details
4. Optionally adds notes in textarea
5. Clicks "Confirm Fraud" or "Dismiss" button
6. onConfirm/onDismiss callback processes the action
7. Card updates to show reviewed state
