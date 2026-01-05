# Tabs Components

## File Location
`frontend/src/components/ui/tabs.tsx`

## Component Purpose

The Tabs component system provides accessible tabbed navigation built on Radix UI primitives. The system includes:

- `Tabs`: Root container that manages tab state
- `TabsList`: Container for tab triggers
- `TabsTrigger`: Individual clickable tab buttons
- `TabsContent`: Content panels associated with each tab

## Props Interface

### Tabs
```typescript
const Tabs = TabsPrimitive.Root
```
Inherits all props from Radix Tabs Root including:
| Prop | Type | Description |
|------|------|-------------|
| `defaultValue` | `string` | Initial active tab value |
| `value` | `string` | Controlled active tab value |
| `onValueChange` | `(value: string) => void` | Callback when tab changes |
| `orientation` | `'horizontal' \| 'vertical'` | Tab orientation |

### TabsList, TabsTrigger, TabsContent
All extend their respective Radix UI primitives with ref forwarding.

```typescript
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => { ... })
```

## State and Hooks Used

Components use `React.forwardRef` for ref forwarding. State management is handled internally by Radix UI.

## Rendered Elements

### TabsList
Container for tab buttons.
```css
inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground
```

### TabsTrigger
Individual tab button.
```css
inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1
text-sm font-medium ring-offset-background transition-all
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
disabled:pointer-events-none disabled:opacity-50
data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow
```

### TabsContent
Content panel for each tab.
```css
mt-2 ring-offset-background
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

## Dependencies

### External Libraries
- `@radix-ui/react-tabs`: Accessible tabs primitive

### Internal Utilities
- `@/lib/utils`: `cn` function for class merging

## Usage Examples

### Basic Tabs
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    <p>Account settings content</p>
  </TabsContent>
  <TabsContent value="password">
    <p>Password settings content</p>
  </TabsContent>
</Tabs>
```

### Controlled Tabs
```tsx
const [activeTab, setActiveTab] = useState('tab1')

<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

### Tabs with Icons
```tsx
import { User, Settings, Bell } from 'lucide-react'

<Tabs defaultValue="profile">
  <TabsList>
    <TabsTrigger value="profile" className="gap-2">
      <User className="h-4 w-4" />
      Profile
    </TabsTrigger>
    <TabsTrigger value="settings" className="gap-2">
      <Settings className="h-4 w-4" />
      Settings
    </TabsTrigger>
    <TabsTrigger value="notifications" className="gap-2">
      <Bell className="h-4 w-4" />
      Notifications
    </TabsTrigger>
  </TabsList>
  {/* Content panels */}
</Tabs>
```

### Full Width Tabs
```tsx
<Tabs defaultValue="tab1" className="w-full">
  <TabsList className="w-full">
    <TabsTrigger value="tab1" className="flex-1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2" className="flex-1">Tab 2</TabsTrigger>
  </TabsList>
  {/* Content panels */}
</Tabs>
```

### Disabled Tab
```tsx
<TabsList>
  <TabsTrigger value="active">Active</TabsTrigger>
  <TabsTrigger value="disabled" disabled>Disabled</TabsTrigger>
</TabsList>
```

### Tabs with Cards
```tsx
<Tabs defaultValue="overview">
  <TabsList className="mb-4">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Overview content here</p>
      </CardContent>
    </Card>
  </TabsContent>
</Tabs>
```

## Exports

```typescript
export { Tabs, TabsList, TabsTrigger, TabsContent }
```

## Styling Notes

- TabsList has muted background with padding
- Active trigger has white/light background with shadow
- Inactive triggers have muted foreground color
- Smooth transitions between states
- Focus ring for keyboard navigation
- Disabled triggers reduce opacity to 50%
- Content has margin-top spacing from triggers

## Accessibility

- Built on Radix UI's accessible Tabs primitive
- Full keyboard navigation support (Arrow keys, Home, End)
- Proper ARIA attributes automatically applied
- Focus management between triggers and content
- Disabled state properly communicated to assistive technology
