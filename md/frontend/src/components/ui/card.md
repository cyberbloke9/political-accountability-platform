# Card Components

## File Location
`frontend/src/components/ui/card.tsx`

## Component Purpose

The Card component system provides a set of composable components for creating consistent card-based UI elements. The system includes:

- `Card`: Main container with border, background, and shadow
- `CardHeader`: Top section with padding for title and description
- `CardTitle`: Styled heading element
- `CardDescription`: Muted description text
- `CardContent`: Main content area
- `CardFooter`: Bottom section with flex alignment

## Props Interface

All card components extend standard HTML div attributes and support ref forwarding.

```typescript
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => { ... })
```

### Common Props (All Components)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | - | Additional CSS classes |
| `children` | `ReactNode` | - | Child elements |
| `...props` | `HTMLAttributes` | - | Standard div HTML attributes |

## State and Hooks Used

All card components are presentational and use `React.forwardRef` for ref forwarding. No internal state or hooks are used.

## Rendered Elements

### Card
Main container element.
```css
rounded-xl border bg-card text-card-foreground shadow
```

### CardHeader
Header section with spacing.
```css
flex flex-col space-y-1.5 p-6
```

### CardTitle
Title/heading element.
```css
font-semibold leading-none tracking-tight
```

### CardDescription
Description text.
```css
text-sm text-muted-foreground
```

### CardContent
Main content area.
```css
p-6 pt-0
```

### CardFooter
Footer section.
```css
flex items-center p-6 pt-0
```

## Dependencies

### Internal Utilities
- `@/lib/utils`: `cn` function for class merging

## Usage Examples

### Basic Card
```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Card Without Footer
```tsx
<Card>
  <CardHeader>
    <CardTitle>Simple Card</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Just content, no footer needed</p>
  </CardContent>
</Card>
```

### Card With Custom Styling
```tsx
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader className="bg-muted/50">
    <CardTitle className="text-primary">Featured</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Custom styled card</p>
  </CardContent>
</Card>
```

### Card as Link Container
```tsx
import Link from 'next/link'

<Link href="/details">
  <Card className="cursor-pointer hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <p>Click to view details</p>
    </CardContent>
  </Card>
</Link>
```

### Grid of Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map((item) => (
    <Card key={item.id}>
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
      </CardHeader>
      <CardContent>{item.content}</CardContent>
    </Card>
  ))}
</div>
```

## Exports

```typescript
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

## Styling Notes

- Card uses `rounded-xl` for larger border radius
- Background uses `bg-card` design token
- Text uses `text-card-foreground` design token
- Shadow provides subtle depth
- All internal components have consistent `p-6` padding
- CardContent and CardFooter have `pt-0` to avoid double padding after CardHeader
- CardFooter uses flexbox with `items-center` for horizontal alignment
