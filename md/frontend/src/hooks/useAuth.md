# useAuth Hook

## Overview

The `useAuth` hook provides a comprehensive authentication interface for the political accountability platform. It manages user authentication state, handles sign-up, sign-in, sign-out, and password reset operations using Supabase Auth. The hook maintains reactive authentication state that automatically updates when the user's session changes, making it the central authentication mechanism for the entire application.

## File Location

`C:\Users\Prithvi Putta\Desktop\political-accountability-platform\frontend\src\hooks\useAuth.ts`

## Dependencies

- `react` - useEffect and useState hooks
- `@supabase/supabase-js` - User, Session, and AuthError types
- `../lib/supabase` - Supabase client instance
- `next/navigation` - useRouter for navigation after sign-out

## Interfaces

### UseAuthReturn

The interface defining the hook's return type:

```typescript
export interface UseAuthReturn {
  user: User | null                                                           // Current authenticated user
  session: Session | null                                                     // Current session object
  loading: boolean                                                            // Loading state during auth operations
  isAuthenticated: boolean                                                    // Whether user is currently authenticated
  signUp: (email: string, password: string, username: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}
```

## Parameters

This hook takes no parameters.

## Return Values

| Property | Type | Description |
|----------|------|-------------|
| `user` | `User \| null` | The current Supabase User object, or null if not authenticated |
| `session` | `Session \| null` | The current Supabase Session object containing tokens and expiry |
| `loading` | `boolean` | True during initial auth check and auth operations |
| `isAuthenticated` | `boolean` | Derived boolean indicating if a user is logged in |
| `signUp` | `function` | Registers a new user with email, password, and username |
| `signIn` | `function` | Authenticates a user with email and password |
| `signOut` | `function` | Signs out the current user and redirects to home |
| `resetPassword` | `function` | Initiates password reset email flow |

## State Management

The hook maintains three pieces of state:

```typescript
const [user, setUser] = useState<User | null>(null)
const [session, setSession] = useState<Session | null>(null)
const [loading, setLoading] = useState(true)
```

### State Flow

1. **Initial Load**: `loading: true`, `user: null`, `session: null`
2. **Session Retrieved**: Updates `user` and `session` from existing session, sets `loading: false`
3. **Auth State Change**: Automatically updates `user` and `session` when auth events occur
4. **Sign Out**: Clears `user` and `session`, redirects to home page

### Derived State

```typescript
isAuthenticated: !!user  // True if user exists, false otherwise
```

## Functions

### signUp

Registers a new user account with the platform.

**Parameters:**
- `email: string` - User's email address
- `password: string` - User's chosen password
- `username: string` - User's display name

**Returns:** `Promise<{ error: AuthError | null }>`

**Behavior:**
1. Calls Supabase `auth.signUp` with email and password
2. Includes username in user metadata
3. Sets email redirect URL for verification callback
4. Returns error object if signup fails, null on success

**Redirect Configuration:**
```typescript
emailRedirectTo: `${window.location.origin}/auth/callback`
```

### signIn

Authenticates an existing user.

**Parameters:**
- `email: string` - User's email address
- `password: string` - User's password

**Returns:** `Promise<{ error: AuthError | null }>`

**Behavior:**
1. Calls Supabase `signInWithPassword`
2. Session is automatically updated via the auth state listener
3. Returns error object if signin fails, null on success

### signOut

Terminates the current user session.

**Parameters:** None

**Returns:** `Promise<void>`

**Behavior:**
1. Calls Supabase `auth.signOut`
2. Clears local session state via auth listener
3. Redirects user to the home page (`/`)
4. Errors are silently caught (no error thrown to caller)

### resetPassword

Initiates the password reset flow.

**Parameters:**
- `email: string` - Email address for password reset

**Returns:** `Promise<{ error: AuthError | null }>`

**Behavior:**
1. Sends password reset email via Supabase
2. Configures redirect URL for password reset page
3. Returns error object if the operation fails

**Redirect Configuration:**
```typescript
redirectTo: `${window.location.origin}/auth/reset-password`
```

## Side Effects

### 1. Initial Session Fetch

On mount, the hook fetches the current session:

```typescript
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session)
    setUser(session?.user ?? null)
    setLoading(false)
  })
  // ...
}, [])
```

### 2. Auth State Subscription

The hook subscribes to Supabase auth state changes for real-time updates:

```typescript
const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((_event, session) => {
  setSession(session)
  setUser(session?.user ?? null)
  setLoading(false)
})

return () => subscription.unsubscribe()
```

This listener responds to events such as:
- `SIGNED_IN` - User signs in
- `SIGNED_OUT` - User signs out
- `TOKEN_REFRESHED` - Session token is refreshed
- `USER_UPDATED` - User data is modified

### 3. Navigation

The `signOut` function triggers a navigation side effect:
```typescript
router.push('/')
```

## Usage Examples

### Basic Authentication Check

```tsx
import { useAuth } from '@/hooks/useAuth'

function AuthStatus() {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (isAuthenticated) {
    return <div>Welcome, {user?.email}</div>
  }

  return <div>Please log in</div>
}
```

### Login Form

```tsx
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

function LoginForm() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
    }
    // Success: auth state listener will update automatically
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Sign In</button>
    </form>
  )
}
```

### Registration Form

```tsx
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

function SignUpForm() {
  const { signUp } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  })
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.username
    )

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Check your email for verification link!')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        placeholder="Username"
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Password"
      />
      {message && <p>{message}</p>}
      <button type="submit">Sign Up</button>
    </form>
  )
}
```

### Protected Route Component

```tsx
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
```

### Navigation with Auth State

```tsx
import { useAuth } from '@/hooks/useAuth'

function Navigation() {
  const { user, isAuthenticated, signOut } = useAuth()

  return (
    <nav>
      <a href="/">Home</a>
      {isAuthenticated ? (
        <>
          <span>Hello, {user?.user_metadata?.username}</span>
          <button onClick={signOut}>Sign Out</button>
        </>
      ) : (
        <>
          <a href="/login">Login</a>
          <a href="/register">Register</a>
        </>
      )}
    </nav>
  )
}
```

### Password Reset Flow

```tsx
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

function ForgotPasswordForm() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await resetPassword(email)

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return <p>Password reset email sent! Check your inbox.</p>
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Reset Password</button>
    </form>
  )
}
```

## Error Handling

The hook handles errors in two ways:

1. **Return Values**: All auth operations return an object with an `error` property
2. **Try-Catch**: Operations are wrapped in try-catch blocks to handle unexpected errors

```typescript
try {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error }
  return { error: null }
} catch (error) {
  return { error: error as AuthError }
}
```

## Notes

- The hook uses the `'use client'` directive for Next.js client-side rendering
- The `isAuthenticated` boolean is a convenience derived from checking if `user` exists
- Session tokens are automatically refreshed by Supabase in the background
- The auth state subscription is properly cleaned up on component unmount
- Username is stored in Supabase user metadata during registration
- Email verification is required by default (configurable in Supabase dashboard)
- The hook is designed to be used as a singleton pattern - multiple components using the hook will share the same auth state through Supabase's internal mechanisms
