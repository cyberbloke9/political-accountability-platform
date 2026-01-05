# Label Component

## File Location
`frontend/src/components/ui/label.tsx`

## Component Purpose

The `Label` component is a styled wrapper around Radix UI's Label primitive. It provides:

- Consistent label styling across forms
- Accessibility features from Radix UI
- Peer-disabled state styling for associated inputs
- Variant support via class-variance-authority

## Props Interface

```typescript
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => { ... })
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | - | Additional CSS classes |
| `htmlFor` | `string` | - | ID of the associated form element |
| `...props` | `LabelPrimitive.Root props` | - | All Radix Label props |

## Variants Configuration

```typescript
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)
```

Currently a single base variant with no additional variant options.

## State and Hooks Used

This is a presentational component using `React.forwardRef` for ref forwarding. No internal state or hooks are used.

## Rendered Elements

Renders a Radix UI `LabelPrimitive.Root` component which outputs a semantic `<label>` element.

### Base Styles
```css
text-sm font-medium leading-none
peer-disabled:cursor-not-allowed peer-disabled:opacity-70
```

## Dependencies

### External Libraries
- `@radix-ui/react-label`: Accessible label primitive
- `class-variance-authority`: Variant-based class management

### Internal Utilities
- `@/lib/utils`: `cn` function for class merging

## Usage Examples

### Basic Usage
```tsx
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

<div className="space-y-2">
  <Label htmlFor="name">Name</Label>
  <Input id="name" placeholder="Enter your name" />
</div>
```

### With Required Indicator
```tsx
<Label htmlFor="email">
  Email <span className="text-red-500">*</span>
</Label>
```

### Peer-Disabled Behavior
```tsx
// When input has 'peer' class and is disabled,
// the label will automatically show disabled styling
<div className="space-y-2">
  <Input id="disabled-input" className="peer" disabled />
  <Label htmlFor="disabled-input">Disabled Field</Label>
</div>
```

### With Checkbox
```tsx
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms and conditions</Label>
</div>
```

## Styling Notes

- Small text size (`text-sm`)
- Medium font weight (`font-medium`)
- No line height spacing (`leading-none`)
- When a sibling input with `peer` class is disabled:
  - Shows `cursor-not-allowed`
  - Reduces opacity to 70%

## Accessibility

- Built on Radix UI's accessible Label primitive
- Properly associates with form controls via `htmlFor`
- Clicking the label focuses/toggles the associated control
