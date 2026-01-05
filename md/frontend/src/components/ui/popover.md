# Popover Components

## File Location
`frontend/src/components/ui/popover.tsx`

## Component Purpose

The Popover component system provides floating content panels built on Radix UI primitives. The system includes:

- `Popover`: Root container managing open/close state
- `PopoverTrigger`: Element that triggers the popover
- `PopoverContent`: The floating content panel
- `PopoverAnchor`: Optional anchor point for positioning

## Props Interface

### PopoverContent
```typescript
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => { ... })
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | Horizontal alignment relative to trigger |
| `sideOffset` | `number` | `4` | Distance from trigger in pixels |
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | - | Preferred side for popover |
| `className` | `string` | - | Additional CSS classes |

### Other Components
Inherit from respective Radix UI Popover primitives.

## State and Hooks Used

Components use `React.forwardRef` for ref forwarding. State is managed by Radix UI Popover internally or can be controlled externally.

## Rendered Elements

### PopoverContent
Floating panel with animations.
```css
z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none
data-[state=open]:animate-in data-[state=closed]:animate-out
data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2
data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2
origin-[--radix-popover-content-transform-origin]
```

## Dependencies

### External Libraries
- `@radix-ui/react-popover`: Accessible popover primitive

### Internal Utilities
- `@/lib/utils`: `cn` function for class merging

## Usage Examples

### Basic Popover
```tsx
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Open Popover</Button>
  </PopoverTrigger>
  <PopoverContent>
    <p>This is popover content.</p>
  </PopoverContent>
</Popover>
```

### Popover with Form
```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button>Settings</Button>
  </PopoverTrigger>
  <PopoverContent className="w-80">
    <div className="grid gap-4">
      <div className="space-y-2">
        <h4 className="font-medium leading-none">Settings</h4>
        <p className="text-sm text-muted-foreground">
          Manage your preferences.
        </p>
      </div>
      <div className="grid gap-2">
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="width">Width</Label>
          <Input id="width" defaultValue="100%" className="col-span-2 h-8" />
        </div>
      </div>
    </div>
  </PopoverContent>
</Popover>
```

### Controlled Popover
```tsx
const [isOpen, setIsOpen] = useState(false)

<Popover open={isOpen} onOpenChange={setIsOpen}>
  <PopoverTrigger asChild>
    <Button>Info</Button>
  </PopoverTrigger>
  <PopoverContent>
    <p>Controlled popover content</p>
    <Button onClick={() => setIsOpen(false)} className="mt-2">
      Close
    </Button>
  </PopoverContent>
</Popover>
```

### Different Alignments
```tsx
// Aligned to start
<PopoverContent align="start">
  Start aligned
</PopoverContent>

// Aligned to end
<PopoverContent align="end">
  End aligned
</PopoverContent>
```

### Different Sides
```tsx
<PopoverContent side="top">
  Appears above trigger
</PopoverContent>

<PopoverContent side="left">
  Appears to the left
</PopoverContent>
```

### With Anchor
```tsx
<Popover>
  <PopoverAnchor asChild>
    <div className="relative">
      <Input placeholder="Search..." />
    </div>
  </PopoverAnchor>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon">
      <Search className="h-4 w-4" />
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <p>Search suggestions will appear here</p>
  </PopoverContent>
</Popover>
```

### Custom Width
```tsx
<PopoverContent className="w-96">
  Wide popover content
</PopoverContent>

<PopoverContent className="w-48">
  Narrow popover
</PopoverContent>
```

## Exports

```typescript
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
```

## Styling Notes

- Default width of `w-72` (288px)
- Uses `bg-popover` and `text-popover-foreground` design tokens
- Rounded corners with border
- Medium shadow for depth
- Padding of `p-4`
- High z-index (50) for layering
- Smooth fade and zoom animations
- Slide-in animation based on position side
- Uses CSS custom property for transform origin

## Accessibility

- Built on Radix UI's accessible Popover primitive
- Click outside closes the popover
- Escape key closes the popover
- Focus is managed within the popover
- Proper ARIA attributes applied automatically
- Supports keyboard navigation
