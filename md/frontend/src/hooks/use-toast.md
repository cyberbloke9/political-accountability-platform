# use-toast Hook

## Overview

The `use-toast` module provides a comprehensive toast notification system for the political accountability platform. Inspired by the `react-hot-toast` library, it implements a custom state management solution using a reducer pattern with an external listener system. This allows toast notifications to be triggered from anywhere in the application while maintaining a centralized state. The module exports both a React hook (`useToast`) for component integration and a standalone `toast` function for programmatic notifications.

## File Location

`C:\Users\Prithvi Putta\Desktop\political-accountability-platform\frontend\src\hooks\use-toast.ts`

## Dependencies

- `react` - React core library for hooks and ReactNode type
- `@/components/ui/toast` - Toast component types (`ToastActionElement`, `ToastProps`)

## Constants

```typescript
const TOAST_LIMIT = 1              // Maximum number of toasts visible at once
const TOAST_REMOVE_DELAY = 1000000 // Delay before toast removal (ms) - ~16.6 minutes
```

## Types and Interfaces

### ToasterToast

Extended toast type combining base props with additional fields:

```typescript
type ToasterToast = ToastProps & {
  id: string                      // Unique identifier for the toast
  title?: React.ReactNode         // Toast title (optional)
  description?: React.ReactNode   // Toast description (optional)
  action?: ToastActionElement     // Action button element (optional)
}
```

### ActionType

Enumeration of available reducer actions:

```typescript
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const
```

### Action

Union type for all possible reducer actions:

```typescript
type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string }
```

### State

The state shape for the toast system:

```typescript
interface State {
  toasts: ToasterToast[]
}
```

### Toast

Input type for creating new toasts (without id):

```typescript
type Toast = Omit<ToasterToast, "id">
```

## Architecture

The toast system uses a custom state management approach:

```
     +----------------+
     |  toast()       |  <-- Programmatic API
     +-------+--------+
             |
             v
     +-------+--------+
     |  dispatch()    |  <-- Central dispatcher
     +-------+--------+
             |
             v
     +-------+--------+
     |  reducer()     |  <-- State transformation
     +-------+--------+
             |
             v
     +-------+--------+
     |  memoryState   |  <-- In-memory state store
     +-------+--------+
             |
             v
     +-------+--------+
     |  listeners[]   |  <-- Component subscriptions
     +-------+--------+
             |
             v
     +-------+--------+
     |  useToast()    |  <-- React hook consumers
     +----------------+
```

## Core Functions

### genId

Generates unique IDs for toasts:

```typescript
let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}
```

### reducer

Processes actions and returns new state:

```typescript
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      // Adds new toast, limits to TOAST_LIMIT
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      // Updates existing toast by id
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST":
      // Marks toast(s) as closed and queues removal
      // Sets open: false on matching toasts

    case "REMOVE_TOAST":
      // Removes toast(s) from state
      // If no toastId provided, removes all
  }
}
```

### dispatch

Dispatches actions and notifies listeners:

```typescript
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}
```

### addToRemoveQueue

Schedules toast removal after delay:

```typescript
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}
```

## Exported Functions

### toast

Creates a new toast notification:

**Parameters:**
- `props: Toast` - Toast properties (title, description, action, etc.)

**Returns:**
```typescript
{
  id: string                           // The toast's unique identifier
  dismiss: () => void                  // Function to dismiss the toast
  update: (props: ToasterToast) => void // Function to update the toast
}
```

**Implementation:**
```typescript
function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return { id, dismiss, update }
}
```

### useToast

React hook for accessing toast state and functions:

**Returns:**
```typescript
{
  toasts: ToasterToast[]                           // Current toast array
  toast: (props: Toast) => { id, dismiss, update } // Create toast function
  dismiss: (toastId?: string) => void              // Dismiss function
}
```

**Implementation:**
```typescript
function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}
```

## State Management

### Memory State

Global state stored outside React:

```typescript
let memoryState: State = { toasts: [] }
```

### Listeners

Array of setState functions from hook consumers:

```typescript
const listeners: Array<(state: State) => void> = []
```

### Timeout Management

Map tracking removal timeouts:

```typescript
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
```

## Side Effects

### 1. Listener Registration

Components using `useToast` register their setState function:

```typescript
React.useEffect(() => {
  listeners.push(setState)
  return () => {
    const index = listeners.indexOf(setState)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }
}, [state])
```

### 2. Timeout Scheduling

Dismissing a toast schedules its removal:
- Timeout is set for `TOAST_REMOVE_DELAY` milliseconds
- Timeout is stored in `toastTimeouts` Map
- Duplicate timeouts are prevented

### 3. State Propagation

State changes are propagated to all listeners:
```typescript
listeners.forEach((listener) => {
  listener(memoryState)
})
```

## Usage Examples

### Basic Toast

```tsx
import { toast } from '@/hooks/use-toast'

function MyComponent() {
  const showSuccess = () => {
    toast({
      title: "Success!",
      description: "Your changes have been saved.",
    })
  }

  return <button onClick={showSuccess}>Save</button>
}
```

### Toast with Action

```tsx
import { toast } from '@/hooks/use-toast'

function UndoableAction() {
  const handleDelete = () => {
    const deletedItem = deleteItem()

    toast({
      title: "Item deleted",
      description: "The item has been removed.",
      action: (
        <ToastAction altText="Undo" onClick={() => restoreItem(deletedItem)}>
          Undo
        </ToastAction>
      ),
    })
  }

  return <button onClick={handleDelete}>Delete</button>
}
```

### Using the Hook

```tsx
import { useToast } from '@/hooks/use-toast'

function FormComponent() {
  const { toast, dismiss } = useToast()

  const handleSubmit = async (data: FormData) => {
    const { id } = toast({
      title: "Submitting...",
      description: "Please wait while we process your request.",
    })

    try {
      await submitForm(data)
      toast({
        title: "Success!",
        description: "Form submitted successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>
}
```

### Updating a Toast

```tsx
import { toast } from '@/hooks/use-toast'

async function uploadFile(file: File) {
  const { update, dismiss } = toast({
    title: "Uploading...",
    description: "0% complete",
  })

  try {
    await uploadWithProgress(file, (progress) => {
      update({
        id: "", // id is added automatically
        title: "Uploading...",
        description: `${progress}% complete`,
      })
    })

    update({
      id: "",
      title: "Upload complete!",
      description: "Your file has been uploaded.",
    })
  } catch (error) {
    update({
      id: "",
      title: "Upload failed",
      description: "Please try again.",
      variant: "destructive",
    })
  }
}
```

### Dismissing Toasts

```tsx
import { useToast } from '@/hooks/use-toast'

function NotificationCenter() {
  const { toasts, dismiss } = useToast()

  const dismissAll = () => {
    dismiss() // No id = dismiss all
  }

  return (
    <div>
      {toasts.map((t) => (
        <div key={t.id}>
          <span>{t.title}</span>
          <button onClick={() => dismiss(t.id)}>X</button>
        </div>
      ))}
      <button onClick={dismissAll}>Clear All</button>
    </div>
  )
}
```

### Toast from Outside React

```tsx
// In a non-React utility file
import { toast } from '@/hooks/use-toast'

export async function apiCall(endpoint: string) {
  try {
    const response = await fetch(endpoint)
    if (!response.ok) throw new Error('Request failed')
    return response.json()
  } catch (error) {
    toast({
      title: "API Error",
      description: "Failed to complete the request.",
      variant: "destructive",
    })
    throw error
  }
}
```

### Toast Renderer Component

```tsx
import { useToast } from '@/hooks/use-toast'
import { Toast, ToastProvider, ToastViewport } from '@/components/ui/toast'

function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          {title && <ToastTitle>{title}</ToastTitle>}
          {description && <ToastDescription>{description}</ToastDescription>}
          {action}
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
```

### Variant Toasts

```tsx
import { toast } from '@/hooks/use-toast'

// Success toast
toast({
  title: "Success",
  description: "Operation completed successfully.",
  variant: "default",
})

// Error toast
toast({
  title: "Error",
  description: "Something went wrong.",
  variant: "destructive",
})
```

## Toast Lifecycle

1. **Creation**: `toast()` is called with props
2. **ID Generation**: Unique ID is generated via `genId()`
3. **Dispatch ADD_TOAST**: Toast is added to state (limited to TOAST_LIMIT)
4. **Listener Notification**: All `useToast` consumers receive updated state
5. **Display**: Toast renders in UI with `open: true`
6. **Dismiss**: User or timeout triggers `DISMISS_TOAST`
7. **Close Animation**: `open` is set to `false`, `onOpenChange` fires
8. **Queue Removal**: `addToRemoveQueue` schedules removal
9. **Remove**: After delay, `REMOVE_TOAST` removes from state

## Performance Considerations

1. **Single Memory State**: One global state object, no context providers needed
2. **Listener Pattern**: Only subscribed components re-render
3. **Toast Limit**: Prevents toast overflow with `TOAST_LIMIT`
4. **Timeout Deduplication**: Prevents multiple removal timers for same toast
5. **Cleanup on Unmount**: Listeners are properly removed

## Notes

- The module uses `'use client'` directive for Next.js client-side rendering
- `TOAST_LIMIT = 1` means only one toast is visible at a time
- `TOAST_REMOVE_DELAY` is very long (~16.6 minutes) - toasts persist until dismissed
- The `toast` function can be used outside React components
- The reducer is exported for potential testing
- Toast IDs are numeric strings that wrap at `MAX_SAFE_INTEGER`
- The `open` property controls visibility and triggers `onOpenChange`
- The listener dependency on `state` ensures cleanup on any state change
