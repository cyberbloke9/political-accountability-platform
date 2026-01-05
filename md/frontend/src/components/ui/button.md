# Button Component

## File Location
`frontend/src/components/ui/button.tsx`

## Component Purpose

The `Button` component is a reusable, highly customizable button built on top of Radix UI's Slot primitive. It provides:

- Multiple visual variants (default, destructive, outline, secondary, ghost, link)
- Multiple size options (default, sm, lg, icon)
- Polymorphic rendering capability via `asChild` prop
- Consistent styling with focus and disabled states
- Full TypeScript support with variant props

## Props Interface

```typescript
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | `'default'` | Visual style variant |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Size variant |
| `asChild` | `boolean` | `false` | When true, renders child element instead of button |
| `className` | `string` | - | Additional CSS classes |
| `...props` | `ButtonHTMLAttributes` | - | All standard button HTML attributes |

## Variants Configuration

### Visual Variants

| Variant | Description | Styling |
|---------|-------------|---------|
| `default` | Primary action button | Primary background, shadow, hover opacity |
| `destructive` | Dangerous/delete actions | Destructive background color |
| `outline` | Secondary outlined button | Border, transparent background |
| `secondary` | Less prominent button | Secondary background color |
| `ghost` | Minimal button | No background, hover effect only |
| `link` | Text link style | Underline on hover |

### Size Variants

| Size | Description | Dimensions |
|------|-------------|------------|
| `default` | Standard size | `h-9 px-4 py-2` |
| `sm` | Small button | `h-8 px-3 text-xs` |
| `lg` | Large button | `h-10 px-8` |
| `icon` | Square icon button | `h-9 w-9` |

## State and Hooks Used

This is a presentational component using `React.forwardRef` for ref forwarding. No internal state or hooks are used beyond the forwarded ref.

## Rendered Elements

The component renders either:
- A `<button>` element (default)
- A Radix UI `<Slot>` component when `asChild={true}`, which passes all props to its child

### Base Styles (All Variants)
```css
inline-flex items-center justify-center gap-2 whitespace-nowrap
rounded-md text-sm font-medium transition-colors
focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
disabled:pointer-events-none disabled:opacity-50
[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
```

## Dependencies

### External Libraries
- `@radix-ui/react-slot`: Slot primitive for polymorphic rendering
- `class-variance-authority`: Variant-based class management

### Internal Utilities
- `@/lib/utils`: `cn` function for class merging

## Usage Examples

### Basic Usage
```tsx
import { Button } from '@/components/ui/button'

// Default button
<Button>Click me</Button>

// With variant
<Button variant="destructive">Delete</Button>

// With size
<Button size="sm">Small Button</Button>

// Combined
<Button variant="outline" size="lg">Large Outline</Button>
```

### With Icons
```tsx
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

<Button>
  <Plus className="h-4 w-4" />
  Add Item
</Button>

// Icon-only button
<Button size="icon" variant="ghost">
  <Plus className="h-4 w-4" />
</Button>
```

### As Child (Polymorphic)
```tsx
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Render as a Next.js Link
<Button asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>
```

### Disabled State
```tsx
<Button disabled>Cannot Click</Button>
```

## Exports

```typescript
export { Button, buttonVariants }
```

- `Button`: The React component
- `buttonVariants`: CVA function for generating button classes (useful for applying button styles to other elements)

## Styling Notes

- Uses Tailwind CSS for all styling
- SVG icons inside buttons are automatically sized to 16x16 (size-4)
- Focus ring uses the `ring` design token
- Disabled state reduces opacity to 50% and disables pointer events
- All transitions use `transition-colors` for smooth hover effects
