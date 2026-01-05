# Alert Components

## File Location
`frontend/src/components/ui/alert.tsx`

## Component Purpose

The Alert component system provides styled notification/alert components for displaying important messages. The system includes:

- `Alert`: Main container with variant styling
- `AlertTitle`: Styled heading for the alert
- `AlertDescription`: Body text for the alert

## Props Interface

### Alert
```typescript
const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => { ... })
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'destructive'` | `'default'` | Visual style variant |
| `className` | `string` | - | Additional CSS classes |
| `...props` | `HTMLAttributes` | - | Standard div HTML attributes |

### AlertTitle & AlertDescription
Standard HTML element props with ref forwarding.

## Variants Configuration

```typescript
const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
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
| `default` | Standard informational alert | Background color, standard border |
| `destructive` | Error/warning alert | Red border and text |

## State and Hooks Used

All components are presentational using `React.forwardRef` for ref forwarding. No internal state or hooks are used.

## Rendered Elements

### Alert
Container with role="alert".
```css
relative w-full rounded-lg border px-4 py-3 text-sm
[&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7
```

### AlertTitle
Heading element.
```css
mb-1 font-medium leading-none tracking-tight
```

### AlertDescription
Description text.
```css
text-sm [&_p]:leading-relaxed
```

## Dependencies

### External Libraries
- `class-variance-authority`: Variant-based class management

### Internal Utilities
- `@/lib/utils`: `cn` function for class merging

## Usage Examples

### Basic Alert
```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

<Alert>
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    This is an informational alert message.
  </AlertDescription>
</Alert>
```

### Destructive Alert
```tsx
<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Something went wrong. Please try again.
  </AlertDescription>
</Alert>
```

### With Icon
```tsx
import { Terminal, AlertTriangle } from 'lucide-react'

<Alert>
  <Terminal className="h-4 w-4" />
  <AlertTitle>Terminal Command</AlertTitle>
  <AlertDescription>
    Run npm install to install dependencies.
  </AlertDescription>
</Alert>

<Alert variant="destructive">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>
    This action cannot be undone.
  </AlertDescription>
</Alert>
```

### Description Only
```tsx
<Alert>
  <AlertDescription>
    A simple notification without a title.
  </AlertDescription>
</Alert>
```

### Custom Styling
```tsx
<Alert className="bg-blue-50 border-blue-200">
  <AlertTitle className="text-blue-800">Information</AlertTitle>
  <AlertDescription className="text-blue-700">
    This is a custom styled info alert.
  </AlertDescription>
</Alert>
```

### In Form Validation
```tsx
{errors.email && (
  <Alert variant="destructive" className="mt-2">
    <AlertDescription>{errors.email.message}</AlertDescription>
  </Alert>
)}
```

## Exports

```typescript
export { Alert, AlertTitle, AlertDescription }
```

## Styling Notes

- Uses `role="alert"` for accessibility
- Full width by default
- Rounded corners with border
- When an SVG icon is present:
  - Icon is positioned absolutely at left
  - Content gets left padding to avoid icon overlap
  - Icon color inherits based on variant
- Destructive variant uses red color tokens
- Supports dark mode via Tailwind's `dark:` prefix

## Accessibility

- Uses semantic `role="alert"` for screen reader announcement
- AlertTitle renders as `<h5>` for proper heading hierarchy
- Color contrast maintained in both variants
- Content is announced immediately when alert appears
