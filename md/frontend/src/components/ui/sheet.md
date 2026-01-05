# Sheet Components

## File Location
`frontend/src/components/ui/sheet.tsx`

## Component Purpose

The Sheet component system provides a slide-out panel/drawer built on Radix UI's Dialog primitive. The system includes:

- `Sheet`: Root container managing open/close state
- `SheetTrigger`: Button/element that opens the sheet
- `SheetContent`: The slide-out panel with side variants
- `SheetHeader`/`SheetFooter`: Layout components for content organization
- `SheetTitle`/`SheetDescription`: Accessible title and description
- `SheetClose`: Button to close the sheet
- `SheetOverlay`: Background overlay
- `SheetPortal`: Portal for rendering outside DOM hierarchy

## Props Interface

### SheetContent
```typescript
interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'right'` | Side from which sheet slides in |
| `className` | `string` | - | Additional CSS classes |
| `children` | `ReactNode` | - | Sheet content |

### Other Components
Inherit from respective Radix UI Dialog primitives.

## Variants Configuration

```typescript
const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)
```

## State and Hooks Used

Components use `React.forwardRef` for ref forwarding. State is managed by Radix UI Dialog internally or can be controlled externally.

## Rendered Elements

### SheetOverlay
Background overlay with fade animation.
```css
fixed inset-0 z-50 bg-black/80
data-[state=open]:animate-in data-[state=closed]:animate-out
data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
```

### SheetContent
Main panel with slide animations.
- Includes close button in top-right corner
- Wraps content in portal with overlay

### SheetHeader
```css
flex flex-col space-y-2 text-center sm:text-left
```

### SheetFooter
```css
flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2
```

### SheetTitle
```css
text-lg font-semibold text-foreground
```

### SheetDescription
```css
text-sm text-muted-foreground
```

## Dependencies

### External Libraries
- `@radix-ui/react-dialog`: Accessible dialog primitive
- `@radix-ui/react-icons`: Close icon (Cross2Icon)
- `class-variance-authority`: Variant-based class management

### Internal Utilities
- `@/lib/utils`: `cn` function for class merging

## Usage Examples

### Basic Right Sheet
```tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

<Sheet>
  <SheetTrigger asChild>
    <Button>Open Menu</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Menu</SheetTitle>
      <SheetDescription>Navigation options</SheetDescription>
    </SheetHeader>
    <nav className="mt-4">
      <ul className="space-y-2">
        <li>Home</li>
        <li>About</li>
        <li>Contact</li>
      </ul>
    </nav>
  </SheetContent>
</Sheet>
```

### Left Side Sheet
```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">
      <Menu className="h-4 w-4" />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Sidebar</SheetTitle>
    </SheetHeader>
    {/* Sidebar content */}
  </SheetContent>
</Sheet>
```

### Controlled Sheet
```tsx
const [isOpen, setIsOpen] = useState(false)

<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetTrigger asChild>
    <Button>Open</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Controlled Sheet</SheetTitle>
    </SheetHeader>
    <Button onClick={() => setIsOpen(false)}>Close</Button>
  </SheetContent>
</Sheet>
```

### With Footer
```tsx
<SheetContent>
  <SheetHeader>
    <SheetTitle>Settings</SheetTitle>
  </SheetHeader>
  <div className="py-4">
    {/* Form content */}
  </div>
  <SheetFooter>
    <SheetClose asChild>
      <Button variant="outline">Cancel</Button>
    </SheetClose>
    <Button>Save Changes</Button>
  </SheetFooter>
</SheetContent>
```

### Bottom Sheet (Mobile)
```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button>Show Actions</Button>
  </SheetTrigger>
  <SheetContent side="bottom" className="h-auto">
    <SheetHeader>
      <SheetTitle>Actions</SheetTitle>
    </SheetHeader>
    <div className="grid gap-4 py-4">
      <Button>Action 1</Button>
      <Button>Action 2</Button>
      <Button variant="outline">Cancel</Button>
    </div>
  </SheetContent>
</Sheet>
```

### Custom Width
```tsx
<SheetContent className="w-[400px] sm:w-[540px]">
  {/* Content */}
</SheetContent>
```

## Exports

```typescript
export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
```

## Styling Notes

- Sheets are fixed positioned with high z-index (50)
- Default padding of `p-6`
- Background uses `bg-background` design token
- Close button is positioned absolutely in top-right
- Left/right sheets take 75% width on mobile, max 384px on larger screens
- Smooth slide animations with different durations for open (500ms) vs close (300ms)
- Overlay uses 80% black for dimming

## Accessibility

- Built on Radix UI's accessible Dialog primitive
- Focus is trapped within the sheet when open
- Escape key closes the sheet
- Click outside (on overlay) closes the sheet
- SheetTitle and SheetDescription provide accessible labels
- Close button includes screen-reader only label
