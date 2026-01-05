# Auth Callback Route (auth/callback/route.ts)

## Overview

**File Path:** `frontend/src/app/auth/callback/route.ts`
**URL:** `/auth/callback`
**Type:** Next.js API Route (Route Handler)

## Purpose

The Auth Callback Route handles OAuth authentication callbacks and email verification links. It exchanges the authorization code from Supabase for a user session.

## Endpoints

### GET /auth/callback

Handles OAuth and email verification callbacks.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| code | string | Authorization code from Supabase |

**Response:**
- 302 Redirect to `/dashboard`

## Implementation

```typescript
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(requestUrl.origin + '/dashboard')
}
```

## Flow

### Email Verification Flow
1. User signs up
2. Supabase sends verification email
3. User clicks verification link
4. Link contains `?code=...` parameter
5. User is redirected to `/auth/callback?code=...`
6. Route exchanges code for session
7. User is redirected to `/dashboard` (now authenticated)

### OAuth Flow (if implemented)
1. User clicks OAuth provider button (Google, GitHub, etc.)
2. User authenticates with provider
3. Provider redirects back to `/auth/callback?code=...`
4. Route exchanges code for session
5. User is redirected to `/dashboard`

### Password Reset Flow
1. User clicks reset link in email
2. Link may contain code parameter
3. Session is established
4. User can then update password

## Dependencies

- `@supabase/auth-helpers-nextjs` - `createRouteHandlerClient`
- `next/server` - `NextResponse`
- `next/headers` - `cookies`

## Session Handling

The `exchangeCodeForSession(code)` function:
1. Validates the authorization code with Supabase
2. Creates a session for the user
3. Sets session cookies automatically

## Error Handling

- If no `code` parameter: Still redirects to `/dashboard`
- Invalid codes: Handled by Supabase (no session created)
- Users without valid sessions will be redirected from `/dashboard` to `/auth/login`

## Security Considerations

1. Code is single-use and expires quickly
2. Session cookies are httpOnly and secure
3. Origin check ensures redirect stays on same domain
4. No sensitive data exposed in URL after redirect
