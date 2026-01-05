# Toaster Component

## File Location
`frontend/src/components/ui/toaster.tsx`

## Component Purpose

The `Toaster` component is a provider component that renders all active toasts from the toast system. It connects the `useToast` hook with the Toast UI components.

## Props Interface

```typescript
export function Toaster() { ... }
```

This component does not accept any props. It automatically renders all toasts managed by the `useToast` hook.

## State and Hooks Used

### Hooks

| Hook | Source | Purpose |
|------|--------|---------|
| `useToast` | `@/hooks/use-toast` | Provides the list of active toasts |

### Hook Return Value

```typescript
const { toasts } = useToast()
// toasts: Array<{
//   id: string
//   title?: string
//   description?: string
//   action?: ReactElement
//   ...ToastProps
// }>
```

## Rendered Elements

Renders a `ToastProvider` containing:
1. A mapped list of `Toast` components for each toast in state
2. A `ToastViewport` for positioning

### Toast Structure
```tsx
<Toast key={id} {...props}>
  <div className="grid gap-1">
    {title && <ToastTitle>{title}</ToastTitle>}
    {description && <ToastDescription>{description}</ToastDescription>}
  </div>
  {action}
  <ToastClose />
</Toast>
```

## Dependencies

### Internal Hooks
- `@/hooks/use-toast`: Toast state management

### Internal Components
- `@/components/ui/toast`: Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport

## Usage Examples

### Setup in Root Layout
```tsx
// app/layout.tsx
import { Toaster } from '@/components/ui/toaster'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

### Using with Toast Hook
```tsx
import { useToast } from '@/hooks/use-toast'

function MyComponent() {
  const { toast } = useToast()

  const handleClick = () => {
    toast({
      title: "Success",
      description: "Operation completed successfully.",
    })
  }

  return <Button onClick={handleClick}>Click me</Button>
}
```

### Toast with All Options
```tsx
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'

function MyComponent() {
  const { toast } = useToast()

  const showToast = () => {
    toast({
      title: "Scheduled: Catch up",
      description: "Friday, February 10, 2023 at 5:57 PM",
      action: (
        <ToastAction altText="Goto schedule to undo">Undo</ToastAction>
      ),
    })
  }

  return <Button onClick={showToast}>Show Toast</Button>
}
```

### Destructive Toast
```tsx
toast({
  variant: "destructive",
  title: "Uh oh! Something went wrong.",
  description: "There was a problem with your request.",
})
```

## Architecture Notes

### Toast Flow
1. Component calls `toast()` from `useToast` hook
2. Toast is added to global toast state
3. `Toaster` component re-renders with new toast
4. Toast appears with animation
5. After duration (or manual dismiss), toast is removed from state

### Placement
- The `Toaster` should be placed once at the root of your application
- It renders toasts in a fixed position via `ToastViewport`
- Multiple toasts stack in reverse chronological order

## Styling Notes

- Toasts are rendered inside a portal (via ToastProvider)
- ToastViewport handles positioning (bottom-right on desktop, top on mobile)
- Each toast includes a close button that appears on hover
- Grid layout (gap-1) for title and description
- Action button is rendered alongside content

## Accessibility

- Toasts are announced to screen readers
- Close button is keyboard accessible
- Each toast has proper role and aria attributes
- Action buttons require altText for accessibility
