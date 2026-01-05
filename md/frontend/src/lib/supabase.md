# lib/supabase.ts

## Overview
Initializes and exports the Supabase client for frontend database operations. This is the core database connection used throughout the application.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key |

Both variables are cleaned of whitespace and newline characters.

## Client Configuration

```typescript
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,    // Auto-refresh JWT
      persistSession: true,      // Keep session in storage
      detectSessionInUrl: true,  // Handle auth callbacks
    },
  }
)
```

## Exports

### `supabase`
The main Supabase client instance.

```typescript
import { supabase } from '@/lib/supabase'

// Example: Fetch promises
const { data, error } = await supabase
  .from('promises')
  .select('*')
```

### `isSupabaseConfigured()`
Checks if Supabase is properly configured.

```typescript
import { isSupabaseConfigured } from '@/lib/supabase'

if (!isSupabaseConfigured()) {
  console.warn('Supabase not configured')
}
```

**Returns:** `true` if:
- URL is set
- Anon key is set
- URL is not the placeholder

### `default`
Same as `supabase` (default export).

## Error Handling

If environment variables are missing:
- Logs error with which variable is missing
- Uses placeholder values to prevent crashes
- `isSupabaseConfigured()` returns `false`

## Usage Examples

```typescript
// Basic query
const { data, error } = await supabase
  .from('promises')
  .select('*')
  .limit(10)

// With auth
const { data: { user } } = await supabase.auth.getUser()

// Insert data
const { error } = await supabase
  .from('verifications')
  .insert({ promise_id, verdict, evidence_text })

// Subscribe to realtime
const channel = supabase
  .channel('votes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' },
    payload => console.log(payload))
  .subscribe()

// Auth operations
await supabase.auth.signInWithPassword({ email, password })
await supabase.auth.signUp({ email, password, options: { data: { username } } })
await supabase.auth.signOut()
```

## Notes

- Uses `@supabase/supabase-js` client
- Session persists in localStorage
- Auth tokens auto-refresh before expiry
- URL params handled for OAuth callbacks
- Client-side only (no server secrets)

## Related Files

- `lib/supabase-server.ts` - Server-side client (with service role)
- `hooks/useAuth.ts` - Auth hook using this client
- All `lib/*.ts` files use this for database access
