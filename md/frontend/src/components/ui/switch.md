# Switch Component

## File Location
`frontend/src/components/ui/switch.tsx`

## Component Purpose

The `Switch` component provides an accessible toggle switch built on Radix UI primitives. It is used for binary on/off settings and provides:

- Checked and unchecked states
- Animated thumb transition
- Focus and disabled states
- Visual feedback on state change

## Props Interface

```typescript
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => { ... })
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | - | Controlled checked state |
| `defaultChecked` | `boolean` | - | Default checked state (uncontrolled) |
| `onCheckedChange` | `(checked: boolean) => void` | - | Change handler |
| `disabled` | `boolean` | `false` | Disabled state |
| `required` | `boolean` | `false` | Required for form validation |
| `name` | `string` | - | Form field name |
| `value` | `string` | `'on'` | Value when submitted in form |
| `className` | `string` | - | Additional CSS classes |

## State and Hooks Used

This is a presentational component using `React.forwardRef` for ref forwarding. Switch state is managed by Radix UI internally or controlled externally via props.

## Rendered Elements

### Root (Track)
```css
peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full
border-2 border-transparent shadow-sm transition-colors
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
disabled:cursor-not-allowed disabled:opacity-50
data-[state=checked]:bg-primary data-[state=unchecked]:bg-input
```

### Thumb (Circle)
```css
pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0
transition-transform
data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0
```

## Dependencies

### External Libraries
- `@radix-ui/react-switch`: Accessible switch primitive

### Internal Utilities
- `@/lib/utils`: `cn` function for class merging

## Usage Examples

### Basic Switch
```tsx
import { Switch } from '@/components/ui/switch'

<Switch />
```

### With Label
```tsx
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">Airplane Mode</Label>
</div>
```

### Controlled Switch
```tsx
const [enabled, setEnabled] = useState(false)

<Switch
  checked={enabled}
  onCheckedChange={setEnabled}
/>
```

### Disabled State
```tsx
<div className="flex items-center space-x-2">
  <Switch id="disabled" disabled />
  <Label htmlFor="disabled">Disabled</Label>
</div>

<div className="flex items-center space-x-2">
  <Switch id="disabled-checked" disabled checked />
  <Label htmlFor="disabled-checked">Disabled On</Label>
</div>
```

### In Settings Form
```tsx
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <div>
      <Label htmlFor="notifications">Notifications</Label>
      <p className="text-sm text-muted-foreground">
        Receive email notifications
      </p>
    </div>
    <Switch id="notifications" />
  </div>

  <div className="flex items-center justify-between">
    <div>
      <Label htmlFor="marketing">Marketing emails</Label>
      <p className="text-sm text-muted-foreground">
        Receive marketing updates
      </p>
    </div>
    <Switch id="marketing" />
  </div>
</div>
```

### With React Hook Form
```tsx
import { useForm, Controller } from 'react-hook-form'

const { control } = useForm()

<Controller
  name="notifications"
  control={control}
  render={({ field }) => (
    <Switch
      checked={field.value}
      onCheckedChange={field.onChange}
    />
  )}
/>
```

### Peer Styling
```tsx
<div className="flex items-center space-x-2">
  <Switch id="theme" className="peer" />
  <Label
    htmlFor="theme"
    className="peer-data-[state=checked]:text-primary"
  >
    Dark Mode
  </Label>
</div>
```

## Styling Notes

- Track size: 36x20 pixels (w-9 h-5)
- Thumb size: 16x16 pixels (h-4 w-4)
- Fully rounded with `rounded-full`
- When checked:
  - Track uses primary color
  - Thumb translates 16px to right (translate-x-4)
- When unchecked:
  - Track uses input color
  - Thumb at starting position
- Smooth transition on state change
- Uses `peer` class for sibling styling
- Focus ring with offset for keyboard navigation
- Disabled state reduces opacity to 50%
- Transparent border for layout consistency
- Shadow on both track and thumb for depth

## Accessibility

- Built on Radix UI's accessible Switch primitive
- Proper role="switch" applied automatically
- Supports keyboard interaction (Space to toggle)
- Works with standard `<Label>` association
- Focus visible styles for keyboard users
- aria-checked reflects current state
- Disabled state properly communicated
