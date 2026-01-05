# AdminLayout Component

## File Location
`frontend/src/components/admin/AdminLayout.tsx`

## Component Purpose

The `AdminLayout` component provides a consistent layout wrapper for admin pages. It includes:

- Sticky header with navigation
- Back to dashboard button
- Current page title
- Optional breadcrumb navigation
- Content container with max width

## Props Interface

```typescript
interface Breadcrumb {
  label: string
  href?: string
}

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
  breadcrumbs?: Breadcrumb[]
}
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | Yes | - | Page content |
| `title` | `string` | Yes | - | Page title displayed in header |
| `breadcrumbs` | `Breadcrumb[]` | No | `[]` | Breadcrumb navigation items |

### Breadcrumb Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `label` | `string` | Yes | Display text |
| `href` | `string` | No | Link URL (if clickable) |

## State and Hooks Used

This is a stateless presentational component. No hooks are used.

## Rendered Elements

### Structure
```
div (min-h-screen bg-gray-50)
├── header (sticky, white background, border, shadow)
│   └── div (max-w-7xl container)
│       ├── Top Row (flex between)
│       │   ├── Back to Dashboard Button
│       │   │   ├── ArrowLeft Icon
│       │   │   ├── Shield Icon
│       │   │   └── "Admin Dashboard" text
│       │   └── Page Title (h1)
│       └── Breadcrumbs Row (if breadcrumbs provided)
│           ├── "Dashboard" link
│           └── Breadcrumb items with chevrons
└── main (max-w-7xl container, padding)
    └── {children}
```

## Dependencies

### Internal Components
- `@/components/ui/button`: Button component

### External Libraries
- `lucide-react`: Shield, ChevronRight, ArrowLeft icons
- `next/link`: Link for navigation

## Usage Examples

### Basic Usage
```tsx
import AdminLayout from '@/components/admin/AdminLayout'

export default function AdminDashboard() {
  return (
    <AdminLayout title="Dashboard">
      <div>Dashboard content here</div>
    </AdminLayout>
  )
}
```

### With Breadcrumbs
```tsx
<AdminLayout
  title="Edit User"
  breadcrumbs={[
    { label: 'Users', href: '/admin/users' },
    { label: 'Edit User' }
  ]}
>
  <UserEditForm />
</AdminLayout>
```

### Verification Review Page
```tsx
<AdminLayout
  title="Verification Review"
  breadcrumbs={[
    { label: 'Verifications', href: '/admin/verifications' },
    { label: 'Review' }
  ]}
>
  <VerificationReviewList />
</AdminLayout>
```

### Nested Breadcrumbs
```tsx
<AdminLayout
  title="User Details"
  breadcrumbs={[
    { label: 'Users', href: '/admin/users' },
    { label: 'John Doe', href: '/admin/users/123' },
    { label: 'Activity Log' }
  ]}
>
  <UserActivityLog />
</AdminLayout>
```

### Settings Page
```tsx
<AdminLayout title="System Settings">
  <SettingsForm />
</AdminLayout>
```

## Styling Notes

### Container
- Minimum full screen height (`min-h-screen`)
- Light gray background (`bg-gray-50`)

### Header
- White background
- Bottom border with gray color
- Sticky positioning with z-index 10
- Subtle shadow (`shadow-sm`)
- Max width 7xl with responsive padding
- Height 16 (64px)

### Navigation Button
- Ghost variant with hover effect (`hover:bg-indigo-50`)
- Indigo-colored shield icon
- Includes left arrow for visual "back" indication

### Breadcrumbs
- Small text size
- Gray text with hover effect to indigo
- Chevron separators between items
- Last item (no href) shown in darker color with bold weight

### Content Area
- Max width 7xl
- Responsive padding (4/6/8)
- Vertical padding of 8 (32px)

## Breadcrumb Behavior

- First link is always "Dashboard" pointing to `/admin`
- Items with `href` are clickable links
- Last item (typically without `href`) is styled as current page
- Chevron icons separate all items

## Responsive Design

- Padding increases on larger screens (sm, lg breakpoints)
- Container maintains max width on all screens
- Text remains readable at all sizes
