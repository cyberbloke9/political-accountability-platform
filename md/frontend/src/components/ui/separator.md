# Separator Component

## File Location
`frontend/src/components/ui/separator.tsx`

## Component Purpose

The `Separator` component is a styled wrapper around Radix UI's Separator primitive. It provides:

- Visual separation between content sections
- Horizontal and vertical orientation support
- Accessible decorative element handling
- Consistent border styling

## Props Interface

```typescript
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => { ... })
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Direction of the separator |
| `decorative` | `boolean` | `true` | Whether separator is purely decorative (affects accessibility) |
| `className` | `string` | - | Additional CSS classes |
| `...props` | `SeparatorPrimitive.Root props` | - | All Radix Separator props |

## State and Hooks Used

This is a presentational component using `React.forwardRef` for ref forwarding. No internal state or hooks are used.

## Rendered Elements

Renders a Radix UI `SeparatorPrimitive.Root` component.

### Base Styles
```css
shrink-0 bg-border
```

### Orientation-Specific Styles
- Horizontal: `h-[1px] w-full`
- Vertical: `h-full w-[1px]`

## Dependencies

### External Libraries
- `@radix-ui/react-separator`: Accessible separator primitive

### Internal Utilities
- `@/lib/utils`: `cn` function for class merging

## Usage Examples

### Horizontal Separator (Default)
```tsx
import { Separator } from '@/components/ui/separator'

<div>
  <p>Content above</p>
  <Separator />
  <p>Content below</p>
</div>
```

### Vertical Separator
```tsx
<div className="flex items-center space-x-4 h-10">
  <span>Left content</span>
  <Separator orientation="vertical" />
  <span>Right content</span>
</div>
```

### With Custom Styling
```tsx
<Separator className="my-8" />
<Separator className="bg-primary" />
```

### In Header/Navigation
```tsx
<header className="flex items-center gap-4">
  <Logo />
  <Separator orientation="vertical" className="h-6" />
  <nav>...</nav>
</header>
```

### Between Form Sections
```tsx
<form>
  <div className="space-y-4">
    <Input placeholder="Name" />
    <Input placeholder="Email" />
  </div>

  <Separator className="my-6" />

  <div className="space-y-4">
    <Input placeholder="Address" />
    <Input placeholder="City" />
  </div>
</form>
```

## Styling Notes

- Uses `bg-border` design token for color consistency
- Shrink-0 prevents flexbox compression
- 1px height/width for subtle appearance
- Full width/height based on orientation
- Integrates seamlessly with Tailwind spacing utilities

## Accessibility

- Built on Radix UI's accessible Separator primitive
- `decorative={true}` (default) hides from screen readers
- Set `decorative={false}` for semantically meaningful separators
- Uses proper ARIA attributes automatically
