# Error Page (error.tsx)

## Overview

**File Path:** `frontend/src/app/error.tsx`
**URL:** Displayed on any unhandled error
**Type:** Client Component (`'use client'`)

## Purpose

The Error Page is a Next.js error boundary that catches and displays unhandled errors in the application. It provides users with options to retry or navigate home.

## Props

```typescript
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
})
```

- `error` - The error object with optional digest for error tracking
- `reset` - Function to attempt re-rendering the failed segment

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Button` - Action buttons
- `Card`, `CardContent` - Error details container (development only)

### Icons (Lucide React)
- `AlertTriangle` - Error icon
- `Home` - Home button icon
- `RefreshCw` - Retry button icon

## Error Logging

```typescript
useEffect(() => {
  console.error('Application error:', error)
}, [error])
```

Logs error to console on mount. In production, this could be extended to send to an error tracking service.

## Page Sections

### 1. Error Icon
- Large AlertTriangle icon
- Red background circle (`bg-red-100`)
- Icon color: `text-red-600`

### 2. Title and Description
- Title: "Something Went Wrong"
- Description: Explains the issue and reassures users

### 3. Error Details (Development Only)
```typescript
{process.env.NODE_ENV === 'development' && (
  <Card>
    <CardContent>
      <pre>{error.message}</pre>
      {error.digest && <p>Error ID: {error.digest}</p>}
    </CardContent>
  </Card>
)}
```

Only shown in development mode for debugging.

### 4. Action Buttons
- **Try Again** - Calls `reset()` to retry rendering
- **Back to Home** - Links to `/`

### 5. Help Text
- Suggestion to contact support if issue persists

## User Interactions

1. **Try Again Button** - Attempts to re-render the failed component
2. **Back to Home Button** - Navigates to home page

## Error Digest

The `digest` property is a unique identifier for the error that can be used to track and debug issues in production logging systems.

## Styling

- Centered layout with max-width: `max-w-2xl`
- Large error icon: `h-16 w-16`
- Error details in monospace font
- Responsive button layout (column on mobile, row on desktop)

## Best Practices Implemented

1. Error logging for debugging
2. Development-only detailed error display
3. User-friendly messaging
4. Clear recovery options
5. Consistent layout with rest of application
