# Root Layout (layout.tsx)

## Overview

**File Path:** `frontend/src/app/layout.tsx`
**Type:** Server Component (Root Layout)

## Purpose

The Root Layout component wraps all pages in the application, providing global styles, fonts, metadata, and toast notifications. It establishes the base HTML structure for the entire application.

## Data Fetching

- No data fetching
- Static configuration only

## Components Used

### External Libraries
- `next/font/google` - Inter font loading
- `sonner` - Toaster component for notifications

### Styles
- `./globals.css` - Global stylesheet import

## Metadata Configuration

```typescript
export const metadata: Metadata = {
  title: 'Political Accountability Platform',
  description: 'Track political promises with community verification and transparent accountability',
  keywords: ['politics', 'accountability', 'promises', 'verification', 'transparency'],
  authors: [{ name: 'Political Accountability Platform' }],
  openGraph: {
    title: 'Political Accountability Platform',
    description: 'Track political promises with community verification and transparent accountability',
    type: 'website',
  },
};
```

## Font Configuration

```typescript
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
```

- Font: Inter (Google Fonts)
- Subset: Latin characters
- CSS Variable: `--font-inter`
- Display: Swap (shows fallback while loading)

## HTML Structure

```html
<html lang="en" className={inter.variable} suppressHydrationWarning>
  <body className="min-h-screen bg-background font-sans antialiased">
    {children}
    <Toaster position="top-center" richColors closeButton />
  </body>
</html>
```

## Body Styling

- `min-h-screen` - Minimum full viewport height
- `bg-background` - Uses CSS variable for background
- `font-sans` - Sans-serif font family
- `antialiased` - Smooth font rendering

## Toast Notifications

Configured via Sonner's Toaster component:
- Position: `top-center`
- Rich colors enabled
- Close button enabled

## Usage

All page components are rendered as `{children}` within this layout. The layout:
1. Applies global fonts
2. Sets up metadata for SEO
3. Provides toast notification system
4. Establishes base styling

## Hydration Warning

`suppressHydrationWarning` is set on the html element to prevent hydration mismatch warnings that can occur with certain browser extensions or theme switches.

## SEO Features

- Page title set globally
- Meta description for search engines
- Keywords for discoverability
- OpenGraph tags for social sharing
