# Textarea Component

## File Location
`frontend/src/components/ui/textarea.tsx`

## Component Purpose

The `Textarea` component is a styled wrapper around the native HTML `<textarea>` element. It provides:

- Consistent styling matching other form inputs
- Focus states with ring highlight
- Disabled state styling
- Responsive text sizing

## Props Interface

```typescript
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => { ... })
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | - | Additional CSS classes |
| `rows` | `number` | - | Number of visible text lines |
| `cols` | `number` | - | Visible width in average character widths |
| `placeholder` | `string` | - | Placeholder text |
| `disabled` | `boolean` | `false` | Disabled state |
| `...props` | `TextareaHTMLAttributes` | - | All standard textarea HTML attributes |

## State and Hooks Used

This is a presentational component using `React.forwardRef` for ref forwarding. No internal state or hooks are used.

## Rendered Elements

Renders a single `<textarea>` element with comprehensive styling.

### Base Styles
```css
flex min-h-[60px] w-full rounded-md border border-input bg-transparent
px-3 py-2 text-base shadow-sm
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
import { Textarea } from '@/components/ui/textarea'

<Textarea placeholder="Enter your message..." />
```

### With Labels
```tsx
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

<div className="space-y-2">
  <Label htmlFor="message">Message</Label>
  <Textarea id="message" placeholder="Type your message here..." />
</div>
```

### With Rows
```tsx
<Textarea rows={5} placeholder="Enter a longer description..." />
```

### Disabled State
```tsx
<Textarea disabled placeholder="Cannot edit" value="Read-only content" />
```

### With Character Count
```tsx
const [value, setValue] = useState('')
const maxLength = 500

<div className="space-y-2">
  <Textarea
    value={value}
    onChange={(e) => setValue(e.target.value)}
    maxLength={maxLength}
    placeholder="Enter your bio..."
  />
  <p className="text-sm text-muted-foreground text-right">
    {value.length}/{maxLength}
  </p>
</div>
```

### With Form Libraries
```tsx
// With React Hook Form
<Textarea {...register('description')} />

// With controlled state
const [description, setDescription] = useState('')
<Textarea
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>
```

### Non-Resizable
```tsx
<Textarea className="resize-none" rows={4} />
```

### Custom Height
```tsx
<Textarea className="min-h-[200px]" />
```

## Styling Notes

- Minimum height of 60px by default
- Full width by default (`w-full`)
- Transparent background to inherit parent background
- Shadow-sm for subtle depth
- Text is `text-base` on mobile, `text-sm` on desktop (`md:` breakpoint)
- Placeholder text uses muted foreground color
- Focus state shows a 1px ring
- Disabled state shows 50% opacity and `cursor-not-allowed`
- By default, textarea is resizable (use `resize-none` to prevent)
- Padding matches Input component for consistency

## Accessibility

- Supports all standard textarea accessibility features
- Works with label `htmlFor` association
- Supports `aria-describedby` for error messages
- Focus ring provides clear visual indicator
