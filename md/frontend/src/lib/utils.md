# utils.ts

## Overview

The `utils.ts` file is a utility module that provides CSS class name merging functionality. It combines the power of `clsx` for conditional class name construction with `tailwind-merge` for intelligently merging Tailwind CSS classes without conflicts.

This is a common pattern in Next.js/React applications using Tailwind CSS, ensuring that class names are properly merged and conflicting utility classes are handled correctly.

## Dependencies

| Package | Purpose |
|---------|---------|
| `clsx` | A tiny utility for constructing `className` strings conditionally |
| `tailwind-merge` | Utility function to efficiently merge Tailwind CSS classes without style conflicts |

## Exported Functions

### `cn(...inputs: ClassValue[]): string`

A utility function that combines multiple class values and merges Tailwind CSS classes intelligently.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `...inputs` | `ClassValue[]` | Variable number of class values. `ClassValue` can be a string, array, object, or any combination thereof (as defined by `clsx`) |

#### Return Type

`string` - A merged string of CSS class names with Tailwind conflicts resolved.

#### How It Works

1. **clsx processing**: First, all input class values are processed by `clsx`, which:
   - Handles conditional classes (objects with boolean values)
   - Flattens arrays of class names
   - Filters out falsy values
   - Concatenates all valid class names

2. **tailwind-merge processing**: The result is then passed through `twMerge`, which:
   - Identifies conflicting Tailwind utility classes
   - Keeps only the last occurrence of conflicting utilities
   - Preserves non-conflicting classes

## Usage Examples

### Basic Usage

```typescript
import { cn } from '@/lib/utils';

// Simple string concatenation
const className = cn('text-red-500', 'font-bold');
// Result: "text-red-500 font-bold"
```

### Conditional Classes

```typescript
import { cn } from '@/lib/utils';

const isActive = true;
const isDisabled = false;

const className = cn(
  'px-4 py-2 rounded',
  isActive && 'bg-blue-500',
  isDisabled && 'opacity-50 cursor-not-allowed'
);
// Result: "px-4 py-2 rounded bg-blue-500"
```

### Object Syntax

```typescript
import { cn } from '@/lib/utils';

const className = cn('base-class', {
  'text-green-500': true,
  'text-red-500': false,
  'font-semibold': true
});
// Result: "base-class text-green-500 font-semibold"
```

### Merging Conflicting Tailwind Classes

```typescript
import { cn } from '@/lib/utils';

// Without tailwind-merge, both classes would be kept
// With tailwind-merge, the latter wins
const className = cn('text-sm text-lg');
// Result: "text-lg"

const buttonClass = cn(
  'px-4 py-2 bg-blue-500',  // Base styles
  'bg-red-500'              // Override styles
);
// Result: "px-4 py-2 bg-red-500"
```

### Common Component Pattern

```typescript
import { cn } from '@/lib/utils';

interface ButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary';
}

function Button({ className, variant = 'primary' }: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        'px-4 py-2 rounded-md font-medium transition-colors',
        // Variant styles
        {
          'bg-blue-500 text-white hover:bg-blue-600': variant === 'primary',
          'bg-gray-200 text-gray-800 hover:bg-gray-300': variant === 'secondary'
        },
        // Allow custom overrides
        className
      )}
    >
      Click me
    </button>
  );
}
```

## File Location

`C:\Users\Prithvi Putta\Desktop\political-accountability-platform\frontend\src\lib\utils.ts`

## Source Code

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
