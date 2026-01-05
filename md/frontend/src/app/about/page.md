# About Page (about/page.tsx)

## Overview

**File Path:** `frontend/src/app/about/page.tsx`
**URL:** `/about`
**Type:** Server Component (no `'use client'` directive)

## Purpose

The About Page explains the platform's mission and the problems it aims to solve. It provides context about why political accountability tracking is needed in India and how the platform addresses common issues with political promises.

## Data Fetching

- No data fetching required
- Static content page

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Card`, `CardHeader`, `CardTitle` - Problem cards
- `Badge` - Tagline badge

### Icons (Lucide React)
- `ShieldCheck` - Corporate influence section
- `FileText` - No single source of truth section
- `AlertCircle` - Vanishing promises section
- `XCircle` - Blame game politics section

## Page Sections

### 1. Hero Section
- Gradient background: `from-primary/5 to-background`
- Badge: "Built for the People, By the People"
- Main headline: "Breaking the Cycle of Broken Promises"
- Descriptive subtitle about the platform

### 2. Problem Section
- Header: "The Problem We're Solving"
- Subheader about challenges faced by Indian citizens
- Grid layout (2 columns on medium+ screens)

#### Problem Cards:

1. **Vanishing Promises**
   - Icon: AlertCircle (destructive color)
   - Describes how election promises disappear after taking office
   - Examples: "24-hour electricity," "jobs for youth," "clean water"

2. **Blame Game Politics**
   - Icon: XCircle (destructive color)
   - Describes how leaders deflect accountability
   - Common excuses about previous governments and opposition

3. **No Single Source of Truth**
   - Icon: FileText (destructive color)
   - Explains lack of unified tracking platform
   - Issues with departmental silos

4. **Corporate Influence & Corruption**
   - Icon: ShieldCheck (destructive color)
   - Addresses bribes, political donations, and policy manipulation
   - Environmental clearances and worker rights concerns

## User Interactions

- No interactive elements beyond navigation
- Purely informational/educational page

## Authentication Requirements

- **Required:** No
- Public page accessible to all visitors

## Styling

- Uses destructive color theme (`border-destructive/20`) for problem cards
- Consistent iconography with color coding
- Responsive grid: 1 column mobile, 2 columns medium+
- Maximum width: `max-w-5xl`

## Content Purpose

This page serves to:
1. Establish credibility and mission
2. Connect with users' frustrations about political accountability
3. Set up the value proposition for the platform
4. Create emotional resonance with the target audience (Indian citizens)
