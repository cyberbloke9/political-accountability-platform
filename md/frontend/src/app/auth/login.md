# Login Page (auth/login/page.tsx)

## Overview

**File Path:** `frontend/src/app/auth/login/page.tsx`
**URL:** `/auth/login`
**Type:** Client Component (`'use client'`)

## Purpose

The Login Page provides user authentication functionality, allowing existing users to sign in to their accounts using email and password credentials.

## Data Fetching

- No initial data fetching
- Uses `useAuth()` hook for authentication operations
- POST request to Supabase Auth on form submission

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Button` - Submit and link buttons
- `Input` - Email and password fields
- `Label` - Form labels
- `Card`, `CardContent`, `CardDescription`, `CardFooter`, `CardHeader`, `CardTitle` - Form container

### Icons (Lucide React)
- `ShieldCheck` - Logo icon in header
- `Loader2` - Loading spinner

### External Libraries
- `sonner` - Toast notifications via `toast`

## State Management

```typescript
const [isLoading, setIsLoading] = useState(false)
const [formData, setFormData] = useState({
  email: '',
  password: '',
})
const [errors, setErrors] = useState({
  email: '',
  password: '',
})
```

## Form Validation

### Email Validation
- Required field check
- Email format validation using regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### Password Validation
- Required field check
- Minimum 6 characters

## User Interactions

1. **Email Input** - Enter email address
2. **Password Input** - Enter password
3. **Sign In Button** - Submit form and authenticate
4. **Forgot Password Link** - Navigate to `/auth/forgot-password`
5. **Sign Up Link** - Navigate to `/auth/signup`

## Authentication Flow

1. User enters email and password
2. Client-side validation runs
3. If valid, `signIn()` from `useAuth()` hook is called
4. On success:
   - Toast notification: "Welcome back!"
   - Redirect to `/dashboard`
5. On error:
   - Toast notification with error message

## Authentication Requirements

- **Required:** No (this is the login page itself)
- Authenticated users should be redirected (handled by `useAuth` hook)

## Error Handling

- Form validation errors displayed inline below fields
- API errors displayed via toast notifications
- Loading state prevents double submission

## Styling

- Centered layout: `flex items-center justify-center`
- Card max width: `max-w-md`
- Error states: `border-destructive` class on invalid fields
- Disabled states during loading

## Navigation Links

| Element | Destination |
|---------|-------------|
| Forgot password? | `/auth/forgot-password` |
| Sign up | `/auth/signup` |
| On Success | `/dashboard` |
