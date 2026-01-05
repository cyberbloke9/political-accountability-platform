# Calendar Components

## File Location
`frontend/src/components/ui/calendar.tsx`

## Component Purpose

The Calendar component provides a date picker calendar built on react-day-picker. It includes:

- Month/year navigation
- Day selection (single, multiple, range)
- Customizable styling via Tailwind CSS
- Support for dropdown month/year selection
- Responsive design

## Props Interface

```typescript
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'single' \| 'multiple' \| 'range'` | - | Selection mode |
| `selected` | `Date \| Date[] \| DateRange` | - | Selected date(s) |
| `onSelect` | `(date) => void` | - | Selection callback |
| `showOutsideDays` | `boolean` | `true` | Show days from adjacent months |
| `captionLayout` | `'label' \| 'dropdown' \| 'dropdown-months' \| 'dropdown-years'` | `'label'` | Caption display mode |
| `buttonVariant` | Button variant | `'ghost'` | Variant for navigation buttons |
| `className` | `string` | - | Additional CSS classes |
| `classNames` | `object` | - | Custom class names for elements |
| `formatters` | `object` | - | Custom date formatters |
| `components` | `object` | - | Custom component overrides |

## State and Hooks Used

### CalendarDayButton Component
```typescript
function CalendarDayButton({ className, day, modifiers, ...props }) {
  const ref = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  // ...
}
```

Uses:
- `useRef`: For button focus management
- `useEffect`: To handle focus when day becomes focused

## Rendered Elements

### Main Calendar Structure
- Root container with padding
- Month navigation buttons (prev/next)
- Month caption (label or dropdown)
- Weekday headers
- Day grid with selectable days

### Styling Classes

Key classNames applied:
```css
/* Root */
bg-background group/calendar p-3 [--cell-size:2rem]

/* Navigation buttons */
h-[--cell-size] w-[--cell-size] select-none p-0

/* Day cells */
group/day relative aspect-square h-full w-full select-none p-0 text-center

/* Selected states */
data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground
data-[range-start=true]:bg-primary data-[range-end=true]:bg-primary
data-[range-middle=true]:bg-accent

/* Today */
bg-accent text-accent-foreground rounded-md

/* Outside days */
text-muted-foreground
```

## Dependencies

### External Libraries
- `react-day-picker`: Date picker functionality
- `lucide-react`: Chevron icons

### Internal Components
- `@/components/ui/button`: Button and buttonVariants

### Internal Utilities
- `@/lib/utils`: `cn` function for class merging

## Usage Examples

### Single Date Selection
```tsx
import { Calendar } from '@/components/ui/calendar'
import { useState } from 'react'

const [date, setDate] = useState<Date | undefined>(new Date())

<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
/>
```

### Date Range Selection
```tsx
import { DateRange } from 'react-day-picker'

const [range, setRange] = useState<DateRange | undefined>()

<Calendar
  mode="range"
  selected={range}
  onSelect={setRange}
  numberOfMonths={2}
/>
```

### Multiple Date Selection
```tsx
const [dates, setDates] = useState<Date[]>([])

<Calendar
  mode="multiple"
  selected={dates}
  onSelect={setDates}
/>
```

### With Dropdown Navigation
```tsx
<Calendar
  mode="single"
  captionLayout="dropdown-months"
  fromYear={2020}
  toYear={2030}
/>
```

### In Popover (Date Picker)
```tsx
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'

const [date, setDate] = useState<Date>()

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">
      {date ? format(date, 'PPP') : 'Pick a date'}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0">
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      initialFocus
    />
  </PopoverContent>
</Popover>
```

### With Disabled Dates
```tsx
<Calendar
  mode="single"
  disabled={(date) => date < new Date()}
/>
```

### Custom Styling
```tsx
<Calendar
  mode="single"
  classNames={{
    day: 'my-custom-day-class',
    today: 'my-today-class',
  }}
/>
```

## Exports

```typescript
export { Calendar, CalendarDayButton }
```

## Styling Notes

- Uses CSS custom property `--cell-size` (2rem) for consistent sizing
- RTL support with rotated chevrons
- Smooth transitions on selection states
- Range selection highlights middle dates with accent color
- Selected days use primary color
- Today's date highlighted with accent background
- Outside days have muted text color
- Disabled days have reduced opacity
- Focus ring on keyboard navigation
- Responsive cell sizing

## Accessibility

- Full keyboard navigation support
- Arrow keys for day navigation
- Home/End for first/last day of week
- PageUp/PageDown for month navigation
- Focus is properly managed within the calendar
- Screen reader announcements for selected dates
- Disabled dates are properly announced
