# Forgot Password Page (auth/forgot-password/page.tsx)

## Overview

**File Path:** `frontend/src/app/auth/forgot-password/page.tsx`
**URL:** `/auth/forgot-password`
**Type:** Client Component (`'use client'`)

## Purpose

The Forgot Password Page allows users to request a password reset email. It validates the email address and sends a reset link via the authentication system.

## Data Fetching

- Uses `useAuth()` hook's `resetPassword()` function
- Sends password reset email through Supabase Auth

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Button` - Submit and navigation buttons
- `Input` - Email input field
- `Label` - Form label
- `Card`, `CardContent`, `CardDescription`, `CardFooter`, `CardHeader`, `CardTitle`

### Icons (Lucide React)
- `ShieldCheck` - Logo icon
- `Loader2` - Loading spinner
- `ArrowLeft` - Back to login icon
- `Mail` - Email icon

### External Libraries
- `sonner` - Toast notifications

## State Management

```typescript
const [isLoading, setIsLoading] = useState(false)
const [emailSent, setEmailSent] = useState(false)
const [email, setEmail] = useState('')
const [error, setError] = useState('')
```

## Two-State UI

### Before Email Sent (emailSent = false)
- Email input form
- "Send Reset Link" button
- "Back to login" link

### After Email Sent (emailSent = true)
- Success message with email address
- Green confirmation box
- "Resend Reset Link" button
- "Back to login" link

## Form Validation

```typescript
const validateEmail = (email: string) => {
  if (!email) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return 'Please enter a valid email'
  return ''
}
```

## User Interactions

1. **Email Input** - Enter email address
2. **Send Reset Link Button** - Submit reset request
3. **Resend Reset Link Button** - Return to form to try again
4. **Back to Login Link** - Navigate to login page

## Reset Flow

1. User enters email
2. Client-side validation
3. `resetPassword(email)` called
4. On success:
   - Toast: "Password reset email sent!"
   - Switch to confirmation view
5. On error:
   - Toast with error message

## Authentication Requirements

- **Required:** No
- This is the password recovery page

## Styling

- Centered layout with max-width: `max-w-md`
- Success state: Green background box (`bg-green-50 border-green-200`)
- Error states: `border-red-500` on input
- Large mail icon in success state

## Navigation Links

| Element | Destination |
|---------|-------------|
| Back to login | `/auth/login` |
