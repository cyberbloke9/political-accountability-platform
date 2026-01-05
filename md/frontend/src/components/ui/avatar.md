# Avatar Components

## File Location
`frontend/src/components/ui/avatar.tsx`

## Component Purpose

The Avatar component system provides a set of composable components for displaying user avatars. The system includes:

- `Avatar`: Container component with circular shape
- `AvatarImage`: Image element with proper aspect ratio
- `AvatarFallback`: Fallback content when image is unavailable

## Props Interface

All avatar components extend Radix UI Avatar primitives and support ref forwarding.

```typescript
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => { ... })
```

### Common Props (All Components)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | - | Additional CSS classes |
| `...props` | Radix Avatar props | - | Component-specific Radix UI props |

### AvatarImage Additional Props

| Prop | Type | Description |
|------|------|-------------|
| `src` | `string` | Image source URL |
| `alt` | `string` | Alt text for accessibility |

## State and Hooks Used

All avatar components are presentational and use `React.forwardRef` for ref forwarding. Internal state is managed by Radix UI for image loading detection.

## Rendered Elements

### Avatar
Container with circular shape.
```css
relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full
```

### AvatarImage
Image element inside container.
```css
aspect-square h-full w-full
```

### AvatarFallback
Fallback content container.
```css
flex h-full w-full items-center justify-center rounded-full bg-muted
```

## Dependencies

### External Libraries
- `@radix-ui/react-avatar`: Accessible avatar primitive with image loading state

### Internal Utilities
- `@/lib/utils`: `cn` function for class merging

## Usage Examples

### Basic Avatar with Image
```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

<Avatar>
  <AvatarImage src="/user-photo.jpg" alt="User Name" />
  <AvatarFallback>UN</AvatarFallback>
</Avatar>
```

### Avatar with Initials Fallback
```tsx
<Avatar>
  <AvatarImage src={user.imageUrl} alt={user.name} />
  <AvatarFallback>
    {user.name.charAt(0).toUpperCase()}
  </AvatarFallback>
</Avatar>
```

### Different Sizes
```tsx
// Small
<Avatar className="h-6 w-6">
  <AvatarFallback className="text-xs">S</AvatarFallback>
</Avatar>

// Default (h-10 w-10)
<Avatar>
  <AvatarFallback>M</AvatarFallback>
</Avatar>

// Large
<Avatar className="h-16 w-16">
  <AvatarFallback className="text-xl">L</AvatarFallback>
</Avatar>
```

### Styled Fallback
```tsx
<Avatar>
  <AvatarImage src={imageUrl} />
  <AvatarFallback className="bg-primary text-primary-foreground">
    AB
  </AvatarFallback>
</Avatar>
```

### With Icon Fallback
```tsx
import { User } from 'lucide-react'

<Avatar>
  <AvatarImage src={imageUrl} />
  <AvatarFallback>
    <User className="h-5 w-5" />
  </AvatarFallback>
</Avatar>
```

### Avatar Stack
```tsx
<div className="flex -space-x-2">
  {users.map((user) => (
    <Avatar key={user.id} className="border-2 border-background">
      <AvatarImage src={user.image} />
      <AvatarFallback>{user.initials}</AvatarFallback>
    </Avatar>
  ))}
</div>
```

### In User Profile Section
```tsx
<div className="flex items-center space-x-4">
  <Avatar>
    <AvatarImage src={user.avatar} alt={user.name} />
    <AvatarFallback>{user.name[0]}</AvatarFallback>
  </Avatar>
  <div>
    <p className="font-medium">{user.name}</p>
    <p className="text-sm text-muted-foreground">{user.email}</p>
  </div>
</div>
```

## Exports

```typescript
export { Avatar, AvatarImage, AvatarFallback }
```

## Styling Notes

- Default size is 40x40 pixels (`h-10 w-10`)
- Circular shape using `rounded-full`
- `overflow-hidden` clips content to circle
- `shrink-0` prevents flexbox compression
- AvatarImage maintains aspect ratio with `aspect-square`
- Fallback uses `bg-muted` background by default
- Fallback centers content with flexbox

## Accessibility

- Built on Radix UI's accessible Avatar primitive
- AvatarImage requires `alt` prop for screen readers
- Fallback automatically shows when image fails to load
- Radix handles loading states internally
