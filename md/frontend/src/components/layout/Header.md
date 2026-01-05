# Header Component

## File Location
`frontend/src/components/layout/Header.tsx`

## Component Purpose

The `Header` component serves as the main navigation header for the Political Accountability Platform. It provides:

- Brand logo display (responsive with different sizes for mobile/desktop)
- Main navigation links (Promises, Leaders, Leaderboard)
- User authentication controls (Login/Signup for guests, Dashboard/Profile for authenticated users)
- Admin access badge for users with admin privileges
- Mobile-responsive navigation using a slide-out Sheet component

## Props Interface

This component does not accept any props. It is a self-contained component that uses hooks for data fetching and state management.

```typescript
// No props - component is self-contained
export function Header() { ... }
```

## State and Hooks Used

### Hooks

| Hook | Source | Purpose |
|------|--------|---------|
| `usePathname` | `next/navigation` | Retrieves current URL path for active link highlighting |
| `useAuth` | `@/hooks/useAuth` | Provides authentication state (`user`, `isAuthenticated`, `signOut`, `loading`) |
| `useAdmin` | `@/hooks/useAdmin` | Provides admin role information (`isAdmin`, `isSuperAdmin`, `isModerator`) |
| `useState` | React | Manages local component state |
| `useEffect` | React | Handles side effects (username fetching) |

### Local State

| State Variable | Type | Initial Value | Purpose |
|---------------|------|---------------|---------|
| `username` | `string` | `''` | Stores the user's username fetched from Supabase |
| `mobileMenuOpen` | `boolean` | `false` | Controls the mobile navigation sheet visibility |

### Side Effects

```typescript
useEffect(() => {
  if (user) {
    supabase.from('users').select('username').eq('auth_id', user.id).single().then(({ data }) => {
      if (data) setUsername(data.username)
    })
  }
}, [user])
```
- Fetches the username from Supabase when the user object changes
- Runs only when authenticated user is available

## Rendered Elements

### Desktop Layout
1. **Logo Section**
   - Full logo for screens >= `sm` breakpoint
   - Small logo for mobile screens

2. **Navigation Links** (hidden on mobile)
   - Promises (`/promises`) with ShieldCheck icon
   - Leaders (`/politicians`) with Users icon
   - Leaderboard (`/leaderboard`) with TrendingUp icon

3. **Auth Section** (hidden on mobile)
   - **Loading State**: Animated pulse placeholder
   - **Authenticated**:
     - Dashboard button
     - Admin badge (if admin) showing role (SuperAdmin/Moderator/Reviewer)
     - User avatar with link to profile
     - Sign Out button
   - **Unauthenticated**:
     - Login button
     - Sign Up button

### Mobile Layout
- Hamburger menu button triggering a Sheet component
- Sheet contains:
  - Logo in header
  - Navigation links with icons
  - User profile section (if authenticated)
  - Dashboard link (if authenticated)
  - Sign Out button (if authenticated)
  - Login/Sign Up buttons (if not authenticated)

## Dependencies

### External Libraries
- `lucide-react`: Icons (Shield, LogIn, UserPlus, LogOut, LayoutDashboard, ShieldCheck, Users, TrendingUp, Menu)
- `next/link`: Navigation
- `next/image`: Optimized image loading

### Internal Components
- `@/components/ui/button`: Button component
- `@/components/ui/avatar`: Avatar, AvatarFallback components
- `@/components/ui/separator`: Separator component
- `@/components/ui/sheet`: Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger components

### Services
- `@/lib/supabase`: Supabase client for database queries

## Usage Examples

```tsx
// In a layout file (e.g., app/layout.tsx)
import { Header } from '@/components/layout/Header'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}
```

## Styling Notes

- Uses Tailwind CSS for responsive design
- Sticky header with `backdrop-blur` effect
- Active navigation links highlighted with different text color
- Responsive breakpoints: `sm`, `md`, `lg`
- Mobile menu uses Sheet component with slide-in animation from right

## Accessibility

- Mobile menu button includes `sr-only` label for screen readers
- Navigation links include icons with visible text
- Admin badge clearly indicates user role
