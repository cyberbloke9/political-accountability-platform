# Feedback API Route (api/feedback/route.ts)

## Overview

**File Path:** `frontend/src/app/api/feedback/route.ts`
**URL:** `/api/feedback`
**Type:** Next.js API Route

## Purpose

The Feedback API Route handles user feedback submissions from the Contact page. It validates input, connects to Supabase, and stores feedback in the database.

## Endpoints

### GET /api/feedback

Returns API status for health checking.

**Response:**
```json
{
  "status": "API is working",
  "supabaseUrl": true,
  "hasServiceKey": true,
  "hasAnonKey": true
}
```

### POST /api/feedback

Submits user feedback to the database.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "subject": "string",
  "message": "string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": [/* inserted record */]
}
```

**Error Responses:**

| Status | Condition | Response |
|--------|-----------|----------|
| 400 | Missing required fields | `{ "error": "All fields are required" }` |
| 400 | Invalid email format | `{ "error": "Invalid email format" }` |
| 500 | Database error | `{ "error": "Failed to submit feedback", "details": "..." }` |
| 500 | Server error | `{ "error": "Internal server error" }` |

## Supabase Configuration

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
```

- Uses service role key for elevated permissions
- Falls back to anon key if service key not available
- Disables session persistence for stateless API

## Validation

### Required Fields
All four fields are required:
- name
- email
- subject
- message

### Email Validation
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  // Return 400 error
}
```

## Data Processing

Before insertion, data is cleaned:
```typescript
{
  name: name.trim(),
  email: email.trim().toLowerCase(),
  subject: subject.trim(),
  message: message.trim()
}
```

- Whitespace trimmed from all fields
- Email converted to lowercase

## Database Schema

The API inserts into the `feedback` table with the following fields:
- name
- email
- subject
- message
- created_at (database default)
- updated_at (database default)
- status (database default)

## Error Handling

### Connection Test
```typescript
const { error: connectionError } = await supabase
  .from('feedback')
  .select('count')
  .limit(1)
```

Tests database connection before insert.

### Detailed Logging (Development)
```typescript
console.error('Database error details:', {
  message: error.message,
  details: error.details,
  hint: error.hint,
  code: error.code
})
```

Detailed error information logged in development mode.

### Error Response
In development, includes error details in response.
In production, returns generic error message.

## Environment Variables Required

| Variable | Required | Purpose |
|----------|----------|---------|
| NEXT_PUBLIC_SUPABASE_URL | Yes | Supabase project URL |
| SUPABASE_SERVICE_ROLE_KEY | Preferred | Service role key for elevated access |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Fallback | Anonymous key if service key unavailable |

## Security Considerations

1. Email validation prevents malformed input
2. All inputs trimmed to prevent whitespace abuse
3. Service role key used for trusted server-side operations
4. Error details only exposed in development
5. No authentication required (public feedback endpoint)
