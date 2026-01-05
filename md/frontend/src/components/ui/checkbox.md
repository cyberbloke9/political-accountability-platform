# Checkbox Component

## File Location
`frontend/src/components/ui/checkbox.tsx`

## Component Purpose

The `Checkbox` component provides an accessible checkbox input built on Radix UI primitives. It includes:

- Checked and unchecked states
- Indeterminate state support
- Focus and disabled states
- Animated check icon

## Props Interface

```typescript
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => { ... })
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean \| 'indeterminate'` | - | Checked state |
| `defaultChecked` | `boolean` | - | Default checked state (uncontrolled) |
| `onCheckedChange` | `(checked: boolean \| 'indeterminate') => void` | - | Change handler |
| `disabled` | `boolean` | `false` | Disabled state |
| `required` | `boolean` | `false` | Required for form validation |
| `name` | `string` | - | Form field name |
| `value` | `string` | `'on'` | Value when submitted in form |
| `className` | `string` | - | Additional CSS classes |

## State and Hooks Used

This is a presentational component using `React.forwardRef` for ref forwarding. Checkbox state is managed by Radix UI internally or controlled externally via props.

## Rendered Elements

### Root Checkbox
```css
grid place-content-center peer h-4 w-4 shrink-0 rounded-sm
border border-primary shadow
focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
disabled:cursor-not-allowed disabled:opacity-50
data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground
```

### Indicator (Check Icon)
```css
grid place-content-center text-current
```
Contains a CheckIcon (h-4 w-4) from Radix Icons.

## Dependencies

### External Libraries
- `@radix-ui/react-checkbox`: Accessible checkbox primitive
- `@radix-ui/react-icons`: CheckIcon

### Internal Utilities
- `@/lib/utils`: `cn` function for class merging

## Usage Examples

### Basic Checkbox
```tsx
import { Checkbox } from '@/components/ui/checkbox'

<Checkbox id="terms" />
```

### With Label
```tsx
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms and conditions</Label>
</div>
```

### Controlled Checkbox
```tsx
const [checked, setChecked] = useState(false)

<Checkbox
  checked={checked}
  onCheckedChange={setChecked}
/>
```

### Disabled State
```tsx
<div className="flex items-center space-x-2">
  <Checkbox id="disabled" disabled />
  <Label htmlFor="disabled">Disabled checkbox</Label>
</div>

<div className="flex items-center space-x-2">
  <Checkbox id="disabled-checked" disabled checked />
  <Label htmlFor="disabled-checked">Disabled checked</Label>
</div>
```

### In Forms
```tsx
<form onSubmit={handleSubmit}>
  <div className="flex items-center space-x-2">
    <Checkbox id="newsletter" name="newsletter" />
    <Label htmlFor="newsletter">Subscribe to newsletter</Label>
  </div>
  <Button type="submit">Submit</Button>
</form>
```

### With React Hook Form
```tsx
import { useForm } from 'react-hook-form'

const { register, handleSubmit, watch, setValue } = useForm()

<Checkbox
  checked={watch('terms')}
  onCheckedChange={(checked) => setValue('terms', checked)}
/>
```

### Checkbox List
```tsx
const [selectedItems, setSelectedItems] = useState<string[]>([])

const items = ['Option 1', 'Option 2', 'Option 3']

<div className="space-y-2">
  {items.map((item) => (
    <div key={item} className="flex items-center space-x-2">
      <Checkbox
        id={item}
        checked={selectedItems.includes(item)}
        onCheckedChange={(checked) => {
          if (checked) {
            setSelectedItems([...selectedItems, item])
          } else {
            setSelectedItems(selectedItems.filter(i => i !== item))
          }
        }}
      />
      <Label htmlFor={item}>{item}</Label>
    </div>
  ))}
</div>
```

### Peer Styling with Label
```tsx
<div className="flex items-center space-x-2">
  <Checkbox id="show" className="peer" />
  <Label
    htmlFor="show"
    className="peer-data-[state=checked]:text-primary"
  >
    Toggle me to change color
  </Label>
</div>
```

## Styling Notes

- Size is 16x16 pixels (h-4 w-4)
- Rounded corners with `rounded-sm`
- Border uses primary color
- Subtle shadow for depth
- When checked:
  - Background fills with primary color
  - Check icon appears in primary-foreground color
- Uses `peer` class for sibling styling
- Focus ring on keyboard navigation
- Disabled state reduces opacity to 50%
- Uses CSS Grid for centering indicator

## Accessibility

- Built on Radix UI's accessible Checkbox primitive
- Proper ARIA attributes automatically applied
- Supports keyboard interaction (Space to toggle)
- Works with standard `<Label>` association
- Required state supported for form validation
- Focus visible styles for keyboard users
