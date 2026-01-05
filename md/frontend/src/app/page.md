# Home Page (page.tsx)

## Overview

**File Path:** `frontend/src/app/page.tsx`
**URL:** `/`
**Type:** Client Component (`'use client'`)

## Purpose

The Home Page serves as the main landing page for the Political Accountability Platform. It introduces the platform's mission, showcases key features, and provides calls-to-action for user engagement.

## Data Fetching

- **Authentication State:** Uses `useAuth()` hook to check if user is authenticated
- **Loading State:** Displays conditional content based on `loading` and `isAuthenticated` states
- No server-side data fetching - purely presentational with client-side auth checks

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Button` - Call-to-action buttons
- `Card`, `CardHeader`, `CardTitle`, `CardDescription` - Feature cards

### Icons (Lucide React)
- `ShieldCheck` - Track Promises feature
- `Users` - Community Verification feature
- `TrendingUp` - Leaderboard System feature
- `Shield` - Accountability value
- `Eye` - Transparency value
- `CheckCircle2` - Trust value

## Page Sections

### 1. Hero Section
- Main headline: "Political Accountability Through Transparency"
- Subheadline describing the platform's purpose
- CTA buttons:
  - "Get Started" (visible only to unauthenticated users)
  - "Browse Promises" (always visible)

### 2. Features Section
- Background: `bg-muted/50` with top border
- Three feature cards:
  1. **Track Promises** - Monitor political promises from announcement to completion
  2. **Community Verification** - Crowdsourced evidence collection with fraud detection
  3. **Leaderboard System** - Gamified citizen engagement with reputation tracking

### 3. Values Section
- Three core values displayed with icons:
  1. **Accountability** - Hold political leaders accountable
  2. **Transparency** - All verifications and votes publicly visible
  3. **Trust** - Built on community consensus and verified evidence

### 4. CTA Section (Conditional)
- Only visible to unauthenticated users
- Background: Primary color (`bg-primary`)
- "Ready to Make a Difference?" heading
- "Create Your Account" button

## User Interactions

1. **Get Started Button** - Links to `/auth/signup` (unauthenticated only)
2. **Browse Promises Button** - Links to `/promises`
3. **Create Your Account Button** - Links to `/auth/signup` (unauthenticated only)

## Authentication Requirements

- **Required:** No
- **Conditional Content:** CTA sections hidden for authenticated users
- Uses `useAuth()` hook to determine authentication state

## Styling

- Responsive design with mobile-first approach
- Uses Tailwind CSS utility classes
- Container max-width: `max-w-5xl` for content sections
- Font sizes scale from mobile to desktop (e.g., `text-4xl` to `text-7xl`)

## Navigation Links

| Element | Destination |
|---------|-------------|
| Get Started | `/auth/signup` |
| Browse Promises | `/promises` |
| Create Your Account | `/auth/signup` |
