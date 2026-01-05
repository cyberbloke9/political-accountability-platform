# supabase-server.ts

## Overview

The `supabase-server.ts` file provides a server-side Supabase client factory for Next.js applications. It creates a Supabase client configured to work with Next.js Server Components and Server Actions by utilizing cookies for session management.

This module is essential for server-side authentication and database operations where the client needs to access user sessions from HTTP-only cookies set by Supabase Auth.

## Dependencies

| Package | Purpose |
|---------|---------|
| `@supabase/ssr` | Supabase Server-Side Rendering utilities for cookie-based auth |
| `next/headers` | Next.js server-side cookies API |

### Environment Variables Required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | The Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The Supabase anonymous/public API key |

## Exported Functions

### `createClient(): SupabaseClient`

Creates and returns a Supabase client configured for server-side use in Next.js.

#### Parameters

None

#### Return Type

`SupabaseClient` - A configured Supabase client instance from `@supabase/ssr`.

#### Cookie Handling

The function implements three cookie operations required by Supabase SSR:

| Operation | Description |
|-----------|-------------|
| `get(name)` | Retrieves a cookie value by name from the Next.js cookie store |
| `set(name, value, options)` | Sets a cookie with the given name, value, and options |
| `remove(name, options)` | Removes a cookie by setting its value to empty string |

**Note**: The `set` and `remove` operations are wrapped in try-catch blocks because they may fail when called from a Server Component (as opposed to a Server Action or Route Handler). This is expected behavior and can be safely ignored when middleware handles session refresh.

## Usage Examples

### In a Server Component

```typescript
import { createClient } from '@/lib/supabase-server';

export default async function ProfilePage() {
  const supabase = createClient();

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in</div>;
  }

  // Fetch user-specific data
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  return <div>Welcome, {profile?.username}</div>;
}
```

### In a Server Action

```typescript
'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const username = formData.get('username') as string;

  const { error } = await supabase
    .from('users')
    .update({ username })
    .eq('auth_id', user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/profile');
}
```

### In an API Route Handler

```typescript
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: promises } = await supabase
    .from('promises')
    .select('*')
    .order('created_at', { ascending: false });

  return NextResponse.json({ promises });
}
```

### Protected Route Pattern

```typescript
import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login');
  }

  // Continue with protected content
  return <Dashboard userId={user.id} />;
}
```

## Difference from Client-Side Supabase

| Aspect | `supabase-server.ts` | `supabase.ts` (client) |
|--------|----------------------|------------------------|
| Environment | Server-side (Node.js) | Client-side (Browser) |
| Cookie Access | Uses `next/headers` cookies | Uses browser cookies automatically |
| Use Case | Server Components, Server Actions, Route Handlers | Client Components, Browser-side operations |
| Session | Reads from HTTP-only cookies | Manages session in browser storage |

## Error Handling Notes

The `set` and `remove` cookie operations wrap their logic in try-catch blocks. This is intentional because:

1. **Server Components**: Cannot modify cookies directly; cookie modifications are ignored
2. **Middleware**: If you have Supabase middleware configured to refresh sessions, these errors are expected and harmless
3. **Server Actions/Route Handlers**: Cookie operations work normally in these contexts

## File Location

`C:\Users\Prithvi Putta\Desktop\political-accountability-platform\frontend\src\lib\supabase-server.ts`

## Source Code

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component
            // This can be ignored if you have middleware refreshing sessions
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component
            // This can be ignored if you have middleware refreshing sessions
          }
        },
      },
    }
  )
}
```
