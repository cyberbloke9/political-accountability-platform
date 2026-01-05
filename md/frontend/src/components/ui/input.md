# Input Component

## File Location
`frontend/src/components/ui/input.tsx`

## Component Purpose

The `Input` component is a styled wrapper around the native HTML `<input>` element. It provides:

- Consistent styling across the application
- Focus states with ring highlight
- Disabled state styling
- File input styling
- Responsive text sizing (larger on mobile)

## Props Interface

```typescript
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => { ... }
)
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `string` | - | HTML input type (text, email, password, file, etc.) |
| `className` | `string` | - | Additional CSS classes |
| `...props` | `InputHTMLAttributes` | - | All standard input HTML attributes |

## State and Hooks Used

This is a presentational component using `React.forwardRef` for ref forwarding. No internal state or hooks are used.

## Rendered Elements

Renders a single `<input>` element with comprehensive styling.

### Base Styles
```css
flex h-9 w-full rounded-md border border-input bg-transparent
px-3 py-1 text-base shadow-sm transition-colors
file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground
placeholder:text-muted-foreground
focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
disabled:cursor-not-allowed disabled:opacity-50
md:text-sm
```

## Dependencies

### Internal Utilities
- `@/lib/utils`: `cn` function for class merging

## Usage Examples

### Basic Usage
```tsx
import { Input } from '@/components/ui/input'

// Text input
<Input type="text" placeholder="Enter your name" />

// Email input
<Input type="email" placeholder="Enter your email" />

// Password input
<Input type="password" placeholder="Enter password" />
```

### With Labels
```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="john@example.com" />
</div>
```

### File Input
```tsx
<Input type="file" accept="image/*" />
```

### Disabled State
```tsx
<Input disabled placeholder="Cannot edit" />
```

### With Form Libraries
```tsx
// With React Hook Form
<Input {...register('email')} />

// With controlled state
const [value, setValue] = useState('')
<Input value={value} onChange={(e) => setValue(e.target.value)} />
```

## Styling Notes

- Height fixed at `h-9` (36px)
- Full width by default (`w-full`)
- Transparent background to inherit parent background
- Shadow-sm for subtle depth
- Text is `text-base` on mobile, `text-sm` on desktop (`md:` breakpoint)
- File input button has no border and transparent background
- Placeholder text uses muted foreground color
- Focus state shows a 1px ring
- Disabled state shows 50% opacity and `cursor-not-allowed`
