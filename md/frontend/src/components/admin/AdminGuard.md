# AdminGuard Component

## File Location
`frontend/src/components/admin/AdminGuard.tsx`

## Component Purpose

The `AdminGuard` component is a route protection component that restricts access to admin pages. It:

- Verifies the user has admin privileges
- Checks for specific permission requirements
- Validates minimum admin level requirements
- Redirects unauthorized users appropriately
- Shows loading and access denied states

## Props Interface

```typescript
interface AdminGuardProps {
  children: React.ReactNode
  requiredPermission?: string
  requiredPermissions?: string[]
  minLevel?: number
  requireAll?: boolean // For requiredPermissions: true = need all, false = need any
}
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `children` | `ReactNode` | - | Yes | Protected content to render |
| `requiredPermission` | `string` | - | No | Single permission required |
| `requiredPermissions` | `string[]` | - | No | Array of permissions required |
| `minLevel` | `number` | - | No | Minimum admin level required |
| `requireAll` | `boolean` | `false` | No | If true, all permissions required; if false, any permission suffices |

## State and Hooks Used

### Hooks

| Hook | Source | Purpose |
|------|--------|---------|
| `useRouter` | `next/navigation` | Navigation/redirection |
| `useAdmin` | `@/hooks/useAdmin` | Admin state and permission checking |
| `useEffect` | React | Authorization side effects |

### Admin Hook Properties Used
```typescript
const admin = useAdmin()
// admin.loading - Loading state
// admin.isAdmin - Is user an admin
// admin.level - Admin level (number)
// admin.hasPermission(perm) - Check single permission
// admin.hasMinimumLevel(level) - Check minimum level
// admin.hasAllPermissions(perms) - Check all permissions
// admin.hasAnyPermission(perms) - Check any permission
```

## Authorization Flow

```
1. useEffect triggered when admin state changes
   │
   ├─ If loading → Show loading spinner
   │
   ├─ If not admin → Redirect to home (/)
   │
   ├─ If minLevel set and not met → Redirect to /admin
   │
   ├─ If requiredPermission set and not met → Redirect to /admin
   │
   ├─ If requiredPermissions set
   │   ├─ requireAll=true → Check hasAllPermissions
   │   └─ requireAll=false → Check hasAnyPermission
   │   └─ If not met → Redirect to /admin
   │
   └─ If all checks pass → Render children
```

## Rendered Elements

### Loading State
```tsx
<div className="flex min-h-screen items-center justify-center">
  <Loader2 className="h-8 w-8 animate-spin text-primary" />
  <p className="text-muted-foreground">Verifying admin access...</p>
</div>
```

### Access Denied State
```tsx
<div className="flex min-h-screen items-center justify-center">
  <Shield className="h-16 w-16 text-muted-foreground" />
  <h2 className="text-2xl font-bold">Access Denied</h2>
  <p className="text-muted-foreground">Redirecting...</p>
</div>
```

### Insufficient Permissions State
```tsx
<div className="flex min-h-screen items-center justify-center">
  <Shield className="h-16 w-16 text-muted-foreground" />
  <h2 className="text-2xl font-bold">Insufficient Permissions</h2>
  <p>Required Level: {minLevel}, Your Level: {admin.level}</p>
</div>
```

## Dependencies

### External Libraries
- `lucide-react`: Shield, Loader2 icons
- `next/navigation`: useRouter

### Internal Hooks
- `@/hooks/useAdmin`: Admin authentication and permissions

## Usage Examples

### Basic Admin Protection
```tsx
import { AdminGuard } from '@/components/admin/AdminGuard'

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  )
}
```

### With Single Permission Requirement
```tsx
<AdminGuard requiredPermission="manage_verifications">
  <VerificationReviewPage />
</AdminGuard>
```

### With Multiple Permissions (Any)
```tsx
<AdminGuard
  requiredPermissions={['manage_users', 'manage_verifications']}
  requireAll={false}
>
  <ModerationPage />
</AdminGuard>
```

### With Multiple Permissions (All Required)
```tsx
<AdminGuard
  requiredPermissions={['manage_users', 'manage_admins']}
  requireAll={true}
>
  <SuperAdminPage />
</AdminGuard>
```

### With Minimum Level
```tsx
<AdminGuard minLevel={2}>
  <ModeratorOnlyPage />
</AdminGuard>
```

### Combined Requirements
```tsx
<AdminGuard
  minLevel={3}
  requiredPermission="super_admin"
>
  <SuperAdminSettingsPage />
</AdminGuard>
```

### In Layout
```tsx
// app/admin/layout.tsx
import { AdminGuard } from '@/components/admin/AdminGuard'

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <AdminHeader />
      <main>{children}</main>
    </AdminGuard>
  )
}
```

## Redirect Behavior

| Condition | Redirect Target |
|-----------|-----------------|
| Not an admin | `/` (home) |
| Missing permission | `/admin` (dashboard) |
| Insufficient level | `/admin` (dashboard) |

## Styling Notes

- Full-screen centered layout for loading/error states
- Animated spinner during loading
- Muted colors for icons and secondary text
- Large shield icon for visual feedback
- Bold headings for clear messaging

## Best Practices

1. Always wrap admin pages with AdminGuard
2. Use specific permissions when possible (not just isAdmin)
3. Set minLevel for hierarchical access control
4. Use requireAll=true for sensitive operations
5. Place guard at the page level, not component level
