# Progress Component

## File Location
`frontend/src/components/ui/progress.tsx`

## Component Purpose

The `Progress` component displays a visual progress bar indicator built on Radix UI primitives. It provides:

- Animated progress indicator
- Accessible progress bar semantics
- Smooth transitions between values
- Customizable styling

## Props Interface

```typescript
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => { ... })
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number \| null` | `0` | Current progress value (0-100) |
| `max` | `number` | `100` | Maximum value |
| `className` | `string` | - | Additional CSS classes |
| `...props` | `ProgressPrimitive.Root props` | - | All Radix Progress props |

## State and Hooks Used

This is a presentational component using `React.forwardRef` for ref forwarding. Progress state is managed externally and passed via the `value` prop.

## Rendered Elements

### Root Container
```css
relative h-2 w-full overflow-hidden rounded-full bg-primary/20
```

### Indicator
The progress fill element with transform-based animation.
```css
h-full w-full flex-1 bg-primary transition-all
```

The indicator uses CSS transform to show progress:
```typescript
style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
```

## Dependencies

### External Libraries
- `@radix-ui/react-progress`: Accessible progress primitive

### Internal Utilities
- `@/lib/utils`: `cn` function for class merging

## Usage Examples

### Basic Progress
```tsx
import { Progress } from '@/components/ui/progress'

<Progress value={50} />
```

### Dynamic Progress
```tsx
const [progress, setProgress] = useState(0)

useEffect(() => {
  const timer = setInterval(() => {
    setProgress((prev) => (prev >= 100 ? 0 : prev + 10))
  }, 500)
  return () => clearInterval(timer)
}, [])

<Progress value={progress} />
```

### With Label
```tsx
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>Progress</span>
    <span>{progress}%</span>
  </div>
  <Progress value={progress} />
</div>
```

### Custom Height
```tsx
<Progress value={75} className="h-4" />
<Progress value={25} className="h-1" />
```

### Custom Colors
```tsx
<Progress
  value={60}
  className="bg-blue-200 [&>div]:bg-blue-600"
/>

<Progress
  value={80}
  className="bg-green-200 [&>div]:bg-green-600"
/>
```

### Loading State (Indeterminate)
```tsx
// For indeterminate loading, you might use animation
<Progress
  value={null}
  className="[&>div]:animate-pulse"
/>
```

### In Card/Form
```tsx
<Card>
  <CardHeader>
    <CardTitle>Upload Progress</CardTitle>
  </CardHeader>
  <CardContent>
    <Progress value={uploadProgress} />
    <p className="text-sm text-muted-foreground mt-2">
      {uploadProgress}% complete
    </p>
  </CardContent>
</Card>
```

### Multiple Progress Bars
```tsx
<div className="space-y-4">
  <div>
    <span className="text-sm">JavaScript</span>
    <Progress value={85} />
  </div>
  <div>
    <span className="text-sm">TypeScript</span>
    <Progress value={72} />
  </div>
  <div>
    <span className="text-sm">React</span>
    <Progress value={90} />
  </div>
</div>
```

## Styling Notes

- Default height is `h-2` (8px)
- Full width by default
- Fully rounded with `rounded-full`
- Background uses `bg-primary/20` (20% opacity of primary color)
- Indicator uses full `bg-primary`
- `overflow-hidden` clips the indicator
- Smooth transitions with `transition-all`
- Uses transform for GPU-accelerated animation

## Accessibility

- Built on Radix UI's accessible Progress primitive
- Includes proper ARIA attributes:
  - `role="progressbar"`
  - `aria-valuenow`
  - `aria-valuemin`
  - `aria-valuemax`
- Automatically communicates progress to screen readers
