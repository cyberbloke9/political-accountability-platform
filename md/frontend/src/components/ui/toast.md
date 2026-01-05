# Toast Components

## File Location
`frontend/src/components/ui/toast.tsx`

## Component Purpose

The Toast component system provides accessible toast notifications built on Radix UI primitives. The system includes:

- `ToastProvider`: Context provider for toasts
- `ToastViewport`: Container where toasts appear
- `Toast`: Individual toast notification
- `ToastTitle`: Toast heading
- `ToastDescription`: Toast message content
- `ToastAction`: Action button within toast
- `ToastClose`: Button to dismiss toast

## Props Interface

### Toast
```typescript
const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => { ... })
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'destructive'` | `'default'` | Visual style variant |
| `className` | `string` | - | Additional CSS classes |
| `open` | `boolean` | - | Controlled open state |
| `onOpenChange` | `(open: boolean) => void` | - | Open state change handler |
| `duration` | `number` | `5000` | Auto-dismiss duration (ms) |

### ToastAction
| Prop | Type | Description |
|------|------|-------------|
| `altText` | `string` | Required accessible description |

## Variants Configuration

```typescript
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

## State and Hooks Used

Components use `React.forwardRef` for ref forwarding. Toast state is typically managed through the `useToast` hook.

## Rendered Elements

### ToastViewport
```css
fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4
sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]
```

### Toast (default)
```css
border bg-background text-foreground
```

### Toast (destructive)
```css
destructive group border-destructive bg-destructive text-destructive-foreground
```

### ToastTitle
```css
text-sm font-semibold [&+div]:text-xs
```

### ToastDescription
```css
text-sm opacity-90
```

### ToastAction
```css
inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium
transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring
disabled:pointer-events-none disabled:opacity-50
group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30
group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground
group-[.destructive]:focus:ring-destructive
```

### ToastClose
```css
absolute right-1 top-1 rounded-md p-1 text-foreground/50 opacity-0
transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1
group-hover:opacity-100
group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50
group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600
```

## Dependencies

### External Libraries
- `@radix-ui/react-toast`: Accessible toast primitives
- `@radix-ui/react-icons`: Cross2Icon for close button
- `class-variance-authority`: Variant-based class management

### Internal Utilities
- `@/lib/utils`: `cn` function for class merging

## Usage Examples

### Basic Toast (with useToast hook)
```tsx
import { useToast } from '@/hooks/use-toast'

function MyComponent() {
  const { toast } = useToast()

  return (
    <Button
      onClick={() => {
        toast({
          title: "Success!",
          description: "Your action was completed.",
        })
      }}
    >
      Show Toast
    </Button>
  )
}
```

### Destructive Toast
```tsx
toast({
  variant: "destructive",
  title: "Error",
  description: "Something went wrong.",
})
```

### Toast with Action
```tsx
toast({
  title: "File deleted",
  description: "The file has been moved to trash.",
  action: (
    <ToastAction altText="Undo delete action" onClick={handleUndo}>
      Undo
    </ToastAction>
  ),
})
```

### Custom Duration
```tsx
toast({
  title: "Quick message",
  duration: 2000, // 2 seconds
})

toast({
  title: "Important notice",
  duration: Infinity, // Won't auto-dismiss
})
```

### Direct Usage (without hook)
```tsx
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'

<ToastProvider>
  <Toast>
    <div className="grid gap-1">
      <ToastTitle>Title</ToastTitle>
      <ToastDescription>Description</ToastDescription>
    </div>
    <ToastClose />
  </Toast>
  <ToastViewport />
</ToastProvider>
```

## Types

```typescript
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>
type ToastActionElement = React.ReactElement<typeof ToastAction>
```

## Exports

```typescript
export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
```

## Styling Notes

- High z-index (100) to appear above everything
- Positioned at top on mobile, bottom-right on desktop
- Maximum width of 420px on desktop
- Swipe to dismiss support
- Close button appears on hover
- Slide animations for enter/exit
- Destructive variant uses red colors
- Subtle border and shadow for depth
- Action button adapts style for destructive variant

## Accessibility

- Built on Radix UI's accessible Toast primitive
- Toasts are announced by screen readers
- Swipe gesture for dismissal on touch devices
- Keyboard accessible close button
- Action button requires `altText` for screen readers
- Focus management when toast appears
- Respects reduced motion preferences
