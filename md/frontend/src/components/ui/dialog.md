# Dialog Components

## File Location
`frontend/src/components/ui/dialog.tsx`

## Component Purpose

The Dialog component system provides accessible modal dialogs built on Radix UI primitives. The system includes:

- `Dialog`: Root container managing open/close state
- `DialogTrigger`: Element that opens the dialog
- `DialogContent`: The modal content container
- `DialogHeader`/`DialogFooter`: Layout components
- `DialogTitle`/`DialogDescription`: Accessible title and description
- `DialogClose`: Button to close the dialog
- `DialogOverlay`: Background overlay
- `DialogPortal`: Portal for rendering outside DOM hierarchy

## Props Interface

### DialogContent
```typescript
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => { ... })
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | - | Additional CSS classes |
| `children` | `ReactNode` | - | Dialog content |

### Other Components
Inherit from respective Radix UI Dialog primitives.

## State and Hooks Used

Components use `React.forwardRef` for ref forwarding. Dialog state is managed by Radix UI internally or can be controlled externally.

## Rendered Elements

### DialogOverlay
Background overlay with fade animation.
```css
fixed inset-0 z-50 bg-black/80
data-[state=open]:animate-in data-[state=closed]:animate-out
data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
```

### DialogContent
Centered modal with animations.
```css
fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg
translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200
data-[state=open]:animate-in data-[state=closed]:animate-out
data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]
data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]
sm:rounded-lg
```

### DialogHeader
```css
flex flex-col space-y-1.5 text-center sm:text-left
```

### DialogFooter
```css
flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2
```

### DialogTitle
```css
text-lg font-semibold leading-none tracking-tight
```

### DialogDescription
```css
text-sm text-muted-foreground
```

## Dependencies

### External Libraries
- `@radix-ui/react-dialog`: Accessible dialog primitive
- `@radix-ui/react-icons`: Cross2Icon for close button

### Internal Utilities
- `@/lib/utils`: `cn` function for class merging

## Usage Examples

### Basic Dialog
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        This is a description of the dialog.
      </DialogDescription>
    </DialogHeader>
    <p>Dialog content goes here.</p>
  </DialogContent>
</Dialog>
```

### Controlled Dialog
```tsx
const [isOpen, setIsOpen] = useState(false)

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Controlled Dialog</DialogTitle>
    </DialogHeader>
    <Button onClick={() => setIsOpen(false)}>Close</Button>
  </DialogContent>
</Dialog>
```

### With Footer Actions
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Edit Profile</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogDescription>
        Make changes to your profile here.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">Name</Label>
        <Input id="name" className="col-span-3" />
      </div>
    </div>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button type="submit">Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Confirmation Dialog
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">Delete Item</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone. This will permanently delete the item.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button variant="destructive" onClick={handleDelete}>
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Scrollable Dialog
```tsx
<DialogContent className="max-h-[85vh] overflow-y-auto">
  <DialogHeader>
    <DialogTitle>Long Content</DialogTitle>
  </DialogHeader>
  <div className="space-y-4">
    {/* Long content here */}
  </div>
</DialogContent>
```

### Custom Width
```tsx
<DialogContent className="sm:max-w-[425px]">
  {/* Narrow dialog */}
</DialogContent>

<DialogContent className="sm:max-w-[800px]">
  {/* Wide dialog */}
</DialogContent>
```

## Exports

```typescript
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
```

## Styling Notes

- Centered vertically and horizontally
- Maximum width of `max-w-lg` (512px) by default
- Full width on mobile, rounded on larger screens
- Background uses `bg-background` design token
- Overlay uses 80% black opacity
- Padding of `p-6`
- Close button positioned in top-right corner
- Smooth fade and zoom animations
- Slide animation for enter/exit
- DialogHeader centers text on mobile, left-aligns on desktop
- DialogFooter stacks buttons on mobile, aligns right on desktop

## Accessibility

- Built on Radix UI's accessible Dialog primitive
- Focus is trapped within the dialog when open
- Escape key closes the dialog
- Click outside (on overlay) closes the dialog
- DialogTitle provides accessible dialog name
- DialogDescription provides accessible description
- Close button includes screen-reader only label
- Returns focus to trigger when closed
