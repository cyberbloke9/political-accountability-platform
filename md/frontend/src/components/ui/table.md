# Table Components

## File Location
`frontend/src/components/ui/table.tsx`

## Component Purpose

The Table component system provides a set of styled table components for displaying tabular data. The system includes:

- `Table`: Main table container with horizontal scroll support
- `TableHeader`: Table header section
- `TableBody`: Table body section
- `TableFooter`: Table footer section
- `TableHead`: Header cell (th)
- `TableRow`: Table row (tr)
- `TableCell`: Body cell (td)
- `TableCaption`: Table caption

## Props Interface

All table components extend standard HTML table element attributes and support ref forwarding.

```typescript
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => { ... })
```

### Common Props (All Components)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | - | Additional CSS classes |
| `children` | `ReactNode` | - | Child elements |

## State and Hooks Used

All table components are presentational and use `React.forwardRef` for ref forwarding. No internal state or hooks are used.

## Rendered Elements

### Table
Wrapped in a scrollable div container.
```css
/* Wrapper */
relative w-full overflow-auto

/* Table */
w-full caption-bottom text-sm
```

### TableHeader
```css
[&_tr]:border-b
```

### TableBody
```css
[&_tr:last-child]:border-0
```

### TableFooter
```css
border-t bg-muted/50 font-medium [&>tr]:last:border-b-0
```

### TableRow
```css
border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted
```

### TableHead
```css
h-10 px-2 text-left align-middle font-medium text-muted-foreground
[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]
```

### TableCell
```css
p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]
```

### TableCaption
```css
mt-4 text-sm text-muted-foreground
```

## Dependencies

### Internal Utilities
- `@/lib/utils`: `cn` function for class merging

## Usage Examples

### Basic Table
```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

<Table>
  <TableCaption>A list of your recent invoices.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Method</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-medium">INV001</TableCell>
      <TableCell>Paid</TableCell>
      <TableCell>Credit Card</TableCell>
      <TableCell className="text-right">$250.00</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### With Data Mapping
```tsx
const invoices = [
  { id: 'INV001', status: 'Paid', amount: 250 },
  { id: 'INV002', status: 'Pending', amount: 150 },
]

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {invoices.map((invoice) => (
      <TableRow key={invoice.id}>
        <TableCell>{invoice.id}</TableCell>
        <TableCell>{invoice.status}</TableCell>
        <TableCell className="text-right">${invoice.amount}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### With Selection
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-[50px]">
        <Checkbox />
      </TableHead>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow data-state={selected ? 'selected' : undefined}>
      <TableCell>
        <Checkbox checked={selected} onCheckedChange={setSelected} />
      </TableCell>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### With Footer
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Product</TableHead>
      <TableHead className="text-right">Price</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {products.map((product) => (
      <TableRow key={product.id}>
        <TableCell>{product.name}</TableCell>
        <TableCell className="text-right">${product.price}</TableCell>
      </TableRow>
    ))}
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell>Total</TableCell>
      <TableCell className="text-right">${total}</TableCell>
    </TableRow>
  </TableFooter>
</Table>
```

### Responsive Table
```tsx
<div className="rounded-md border">
  <Table>
    {/* Table content */}
  </Table>
</div>
```

### With Actions Column
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Item 1</TableCell>
      <TableCell><Badge>Active</Badge></TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm">Edit</Button>
        <Button variant="ghost" size="sm">Delete</Button>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Exports

```typescript
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
```

## Styling Notes

- Table wrapper enables horizontal scroll on overflow
- Small text size (text-sm) for compact display
- Caption positioned at bottom
- Header cells have muted foreground color
- Rows have bottom border, except last row in body
- Hover state highlights row with muted background
- Selected rows (data-state="selected") have muted background
- Footer has top border and subtle background
- Cells containing checkboxes have adjusted padding and alignment
- Cells are vertically centered (align-middle)
- Transitions on hover for smooth effect

## Accessibility

- Uses semantic HTML table elements
- Caption provides table description
- Proper thead, tbody, tfoot structure
- Works with screen readers
- Checkbox cells properly aligned
- Text alignment can be set for readability
