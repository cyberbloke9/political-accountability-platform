# Badge Component

## File Location
`frontend/src/components/ui/badge.tsx`

## Component Purpose

The `Badge` component displays small status indicators, labels, or tags. It provides:

- Multiple visual variants (default, secondary, destructive, outline)
- Consistent styling with rounded corners
- Focus states for accessibility
- Compact size suitable for inline usage

## Props Interface

```typescript
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps)
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'secondary' \| 'destructive' \| 'outline'` | `'default'` | Visual style variant |
| `className` | `string` | - | Additional CSS classes |
| `children` | `ReactNode` | - | Badge content |
| `...props` | `HTMLAttributes` | - | Standard div HTML attributes |

## Variants Configuration

```typescript
const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

### Visual Variants

| Variant | Description | Styling |
|---------|-------------|---------|
| `default` | Primary badges | Primary background with shadow |
| `secondary` | Less prominent badges | Secondary background |
| `destructive` | Error/warning badges | Destructive (red) background |
| `outline` | Minimal outline style | Border only, no background |

## State and Hooks Used

This is a stateless presentational component. No hooks or internal state are used.

## Rendered Elements

Renders a single `<div>` element with badge styling.

### Base Styles
```css
inline-flex items-center rounded-md border px-2.5 py-0.5
text-xs font-semibold transition-colors
focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
```

## Dependencies

### External Libraries
- `class-variance-authority`: Variant-based class management

### Internal Utilities
- `@/lib/utils`: `cn` function for class merging

## Usage Examples

### Basic Usage
```tsx
import { Badge } from '@/components/ui/badge'

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

### Status Indicators
```tsx
<Badge variant="default" className="bg-green-500">Active</Badge>
<Badge variant="destructive">Expired</Badge>
<Badge variant="secondary">Pending</Badge>
```

### With Icons
```tsx
import { CheckCircle, AlertTriangle } from 'lucide-react'

<Badge className="gap-1">
  <CheckCircle className="h-3 w-3" />
  Verified
</Badge>

<Badge variant="destructive" className="gap-1">
  <AlertTriangle className="h-3 w-3" />
  Warning
</Badge>
```

### Custom Colors
```tsx
<Badge style={{ backgroundColor: '#4CAF50' }}>Custom Green</Badge>
<Badge className="bg-blue-500 text-white">Blue Badge</Badge>
```

### In Cards/Lists
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Item Title</CardTitle>
      <Badge>New</Badge>
    </div>
  </CardHeader>
</Card>
```

### Clickable Badge
```tsx
<Badge
  className="cursor-pointer"
  onClick={() => handleClick()}
>
  Click Me
</Badge>
```

## Exports

```typescript
export { Badge, badgeVariants }
```

- `Badge`: The React component
- `badgeVariants`: CVA function for generating badge classes (useful for custom implementations)

## Styling Notes

- Extra small text (`text-xs`)
- Semibold font weight
- Rounded corners (`rounded-md`)
- Compact padding (`px-2.5 py-0.5`)
- Hover effects reduce opacity to 80%
- Default and destructive variants include subtle shadow
- Outline variant only shows border without background
- Focus ring for keyboard accessibility
