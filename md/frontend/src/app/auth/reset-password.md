# Reset Password Page (auth/reset-password/page.tsx)

## Overview

**File Path:** `frontend/src/app/auth/reset-password/page.tsx`
**URL:** `/auth/reset-password`
**Type:** Client Component (`'use client'`)

## Purpose

The Reset Password Page allows users to set a new password after clicking a reset link from their email. It includes password strength requirements and confirmation.

## Data Fetching

- Uses Supabase `auth.updateUser()` to set new password
- No initial data fetching

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Button` - Submit button
- `Input` - Password input fields
- `Label` - Form labels
- `Card`, `CardContent`, `CardDescription`, `CardFooter`, `CardHeader`, `CardTitle`

### Icons (Lucide React)
- `ShieldCheck` - Logo icon
- `Loader2` - Loading spinner
- `Check` - Requirement met indicator
- `X` - Requirement not met indicator

### External Libraries
- `sonner` - Toast notifications

## State Management

```typescript
const [isLoading, setIsLoading] = useState(false)
const [formData, setFormData] = useState({
  password: '',
  confirmPassword: '',
})
const [errors, setErrors] = useState({
  password: '',
  confirmPassword: '',
})
```

## Password Requirements

Real-time validation displayed in a requirements box:

| Requirement | Check |
|-------------|-------|
| At least 6 characters | `password.length >= 6` |
| Contains uppercase letter | `/[A-Z]/.test(password)` |
| Contains lowercase letter | `/[a-z]/.test(password)` |
| Passwords match | `password === confirmPassword && password.length > 0` |

## Form Validation

```typescript
const validateForm = () => {
  // Password: required, min 6 characters
  // Confirm Password: required, must match
}
```

## User Interactions

1. **New Password Input** - Enter new password
2. **Confirm Password Input** - Re-enter new password
3. **Submit Button** - Reset password (disabled until all requirements met)

## Reset Flow

1. User arrives from email reset link
2. User enters new password twice
3. All requirements must be met (button enabled)
4. Client-side validation
5. `supabase.auth.updateUser({ password })` called
6. On success:
   - Toast: "Password reset successfully!"
   - 1.5 second delay
   - Redirect to `/auth/login`
7. On error:
   - Toast with error message

## Button Disabled State

Submit button is disabled when:
- Loading state is active
- Any password requirement is not met

```typescript
disabled={isLoading || !passwordRequirements.every(req => req.met)}
```

## Authentication Requirements

- **Required:** Implicit (user must have valid reset token from email link)
- Supabase handles token validation in the auth state

## Styling

- Centered layout with max-width: `max-w-md`
- Requirements box: `bg-muted/50` with rounded border
- Met requirements: Green check + green text
- Unmet requirements: Gray X + muted text
- Error states: `border-red-500` on inputs

## Navigation

After successful reset:
- Automatically redirected to `/auth/login` after 1.5 seconds
- Info text explains redirect behavior
