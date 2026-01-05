# Select Components

## File Location
`frontend/src/components/ui/select.tsx`

## Component Purpose

The Select component system provides a fully accessible dropdown select built on Radix UI primitives. The system includes:

- `Select`: Root container managing selection state
- `SelectTrigger`: Button that opens the dropdown
- `SelectValue`: Displays the selected value
- `SelectContent`: Dropdown container with items
- `SelectItem`: Individual selectable option
- `SelectGroup`: Groups related items
- `SelectLabel`: Label for a group of items
- `SelectSeparator`: Visual separator between items
- `SelectScrollUpButton`/`SelectScrollDownButton`: Scroll indicators

## Props Interface

### SelectTrigger
```typescript
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => { ... })
```

### SelectContent
```typescript
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => { ... })
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `'popper' \| 'item-aligned'` | `'popper'` | Positioning strategy |

### SelectItem
```typescript
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => { ... })
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | Yes | Value for the item |
| `disabled` | `boolean` | No | Disabled state |

## State and Hooks Used

Components use `React.forwardRef` for ref forwarding. Selection state is managed by Radix UI Select internally or can be controlled externally.

## Rendered Elements

### SelectTrigger
```css
flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md
border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background
data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring
disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1
```

### SelectContent
```css
relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden
rounded-md border bg-popover text-popover-foreground shadow-md
/* Animations */
data-[state=open]:animate-in data-[state=closed]:animate-out
data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
```

### SelectItem
```css
relative flex w-full cursor-default select-none items-center rounded-sm
py-1.5 pl-2 pr-8 text-sm outline-none
focus:bg-accent focus:text-accent-foreground
data-[disabled]:pointer-events-none data-[disabled]:opacity-50
```

## Dependencies

### External Libraries
- `@radix-ui/react-select`: Accessible select primitive
- `@radix-ui/react-icons`: Check, ChevronDown, ChevronUp icons

### Internal Utilities
- `@/lib/utils`: `cn` function for class merging

## Usage Examples

### Basic Select
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select a fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="banana">Banana</SelectItem>
    <SelectItem value="orange">Orange</SelectItem>
  </SelectContent>
</Select>
```

### Controlled Select
```tsx
const [value, setValue] = useState('')

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### With Groups and Labels
```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select a timezone" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>North America</SelectLabel>
      <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
      <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>Europe</SelectLabel>
      <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
      <SelectItem value="cet">Central European Time (CET)</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

### Disabled State
```tsx
<Select disabled>
  <SelectTrigger>
    <SelectValue placeholder="Disabled" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option">Option</SelectItem>
  </SelectContent>
</Select>
```

### Disabled Item
```tsx
<SelectContent>
  <SelectItem value="active">Active</SelectItem>
  <SelectItem value="disabled" disabled>Disabled Option</SelectItem>
</SelectContent>
```

### With Form
```tsx
<form>
  <div className="space-y-2">
    <Label htmlFor="country">Country</Label>
    <Select name="country" required>
      <SelectTrigger id="country">
        <SelectValue placeholder="Select your country" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="us">United States</SelectItem>
        <SelectItem value="uk">United Kingdom</SelectItem>
        <SelectItem value="in">India</SelectItem>
      </SelectContent>
    </Select>
  </div>
</form>
```

### Full Width Select
```tsx
<Select>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    {/* items */}
  </SelectContent>
</Select>
```

## Exports

```typescript
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
```

## Styling Notes

- Trigger height matches Input component (h-9)
- Full width by default on trigger
- Chevron icon on right side of trigger
- Check icon appears on selected item
- Items highlight on focus/hover with accent colors
- Scroll buttons appear when content overflows
- Content uses popover background color
- Smooth fade and zoom animations
- Respects available height using CSS custom property

## Accessibility

- Built on Radix UI's accessible Select primitive
- Full keyboard navigation (Arrow keys, Enter, Escape)
- Type-ahead search functionality
- Proper ARIA attributes automatically applied
- Focus management between trigger and content
- Screen reader announces selected value
