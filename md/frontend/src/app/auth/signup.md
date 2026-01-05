# Signup Page (auth/signup/page.tsx)

## Overview

**File Path:** `frontend/src/app/auth/signup/page.tsx`
**URL:** `/auth/signup`
**Type:** Client Component (`'use client'`)

## Purpose

The Signup Page allows new users to create an account on the Political Accountability Platform. It includes email, username, and password fields with real-time validation and password strength indication.

## Data Fetching

- No initial data fetching
- Uses `useAuth()` hook for registration operations
- POST request to Supabase Auth on form submission

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Button` - Submit and link buttons
- `Input` - Form input fields
- `Label` - Form labels
- `Card`, `CardContent`, `CardDescription`, `CardFooter`, `CardHeader`, `CardTitle` - Form container

### Icons (Lucide React)
- `ShieldCheck` - Logo icon
- `Loader2` - Loading spinner
- `Check` - Valid input indicator
- `X` - Invalid input indicator

### External Libraries
- `sonner` - Toast notifications

## State Management

```typescript
const [isLoading, setIsLoading] = useState(false)
const [formData, setFormData] = useState({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
})
const [errors, setErrors] = useState({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
})
```

## Form Validation

### Email Validation
- Required field
- Valid email format (regex)

### Username Validation
- Required field
- Minimum 3 characters
- Only letters, numbers, and underscores: `/^[a-zA-Z0-9_]+$/`

### Password Validation
- Required field
- Minimum 8 characters

### Confirm Password Validation
- Required field
- Must match password

## Password Strength Indicator

The page includes a visual password strength meter with 5 levels:

| Level | Label | Criteria |
|-------|-------|----------|
| 0 | Very Weak | Base |
| 1 | Weak | 8+ characters |
| 2 | Fair | 12+ characters OR mixed case |
| 3 | Good | Numbers included |
| 4 | Strong | Special characters included |

Color progression: Red -> Orange -> Yellow -> Lime -> Green

## User Interactions

1. **Email Input** - Enter email address
2. **Username Input** - Choose a username (with real-time validation feedback)
3. **Password Input** - Create password (with strength meter)
4. **Confirm Password Input** - Re-enter password (with match indicator)
5. **Create Account Button** - Submit form
6. **Sign In Link** - Navigate to `/auth/login`

## Registration Flow

1. User fills in all fields
2. Client-side validation runs on submit
3. If valid, `signUp()` from `useAuth()` hook is called
4. On success:
   - Toast: "Account created! Please check your email to verify."
   - Redirect to `/auth/verify-email`
5. On error:
   - Toast notification with error message

## Authentication Requirements

- **Required:** No (this is the signup page itself)
- Already authenticated users should be redirected

## Real-time Feedback

- Username validation shows check/X icons as user types
- Password strength bar updates in real-time
- Confirm password shows "Passwords match" when valid

## Styling

- Centered layout with max-width: `max-w-md`
- Password strength bars: 5 colored segments
- Error states use `border-destructive` class
- Success indicators use green text

## Navigation Links

| Element | Destination |
|---------|-------------|
| Sign in | `/auth/login` |
| On Success | `/auth/verify-email` |
