# Not Found Page (not-found.tsx)

## Overview

**File Path:** `frontend/src/app/not-found.tsx`
**URL:** Displayed for any 404 errors
**Type:** Client Component (`'use client'`)

## Purpose

The Not Found Page handles 404 errors when users navigate to non-existent routes. It provides a search box and helpful navigation links to guide users back to valid content.

## Data Fetching

- No data fetching
- Handles navigation via client-side router

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Button` - Navigation and search buttons
- `Card`, `CardContent` - Search box container
- `Input` - Search input field

### Icons (Lucide React)
- `Home` - Home button icon
- `Search` - Search icon
- `FileQuestion` - 404 visual element
- `ArrowLeft` - Go back icon

## State Management

```typescript
const [searchQuery, setSearchQuery] = useState('')
```

## Page Sections

### 1. 404 Icon
- Large FileQuestion icon as background
- "404" text overlaid in center
- Primary color for the number

### 2. Title and Description
- Title: "Page Not Found"
- Description: Explains the page might have been moved or deleted

### 3. Search Box
- Form submission redirects to `/promises?search={query}`
- Input placeholder: "Search by politician, party, or promise..."
- Search button with icon

### 4. Action Buttons
Three navigation options:
- **Go Back** - Uses `router.back()` to return to previous page
- **Back to Home** - Links to `/`
- **Browse Promises** - Links to `/promises`

### 5. Helpful Links
Footer links to common destinations:
- Browse Promises
- Leaderboard
- Dashboard
- Transparency Log
- About Us

## User Interactions

1. **Search Form** - Submit search query
2. **Go Back Button** - Navigate to previous page
3. **Back to Home Button** - Navigate to home
4. **Browse Promises Button** - Navigate to promises list
5. **Footer Links** - Navigate to various pages

## Search Functionality

```typescript
const handleSearch = (e: React.FormEvent) => {
  e.preventDefault()
  if (searchQuery.trim()) {
    router.push(`/promises?search=${encodeURIComponent(searchQuery)}`)
  }
}
```

URL-encodes the search query for safe transmission.

## Styling

- Centered layout with max-width: `max-w-2xl`
- Large 404 display: `text-6xl font-bold`
- Responsive button layout
- Border-top separator for helpful links
- Bullet separators between link items

## Navigation Links

| Element | Destination |
|---------|-------------|
| Go Back | Previous page (router.back()) |
| Back to Home | `/` |
| Browse Promises | `/promises` |
| Search Submit | `/promises?search={query}` |
| Leaderboard | `/leaderboard` |
| Dashboard | `/dashboard` |
| Transparency Log | `/transparency` |
| About Us | `/about` |
