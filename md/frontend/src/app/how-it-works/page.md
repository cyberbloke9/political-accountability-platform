# How It Works Page (how-it-works/page.tsx)

## Overview

**File Path:** `frontend/src/app/how-it-works/page.tsx`
**URL:** `/how-it-works`
**Type:** Server Component

## Purpose

The How It Works Page explains the platform's workflow, trust level system, and anti-gaming protection measures. It educates users on how to effectively participate and earn reputation.

## Data Fetching

- No data fetching
- Static content page

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`
- `Badge` - Section badges

### Icons (Lucide React)
- `FileText` - Submit a Promise
- `Search` - Discover Promises
- `Upload` - Verify Progress
- `Vote` - Community Voting
- `TrendingUp` - Earn Reputation
- `CheckCircle` - Track Accountability
- `ArrowRight` - Action arrows
- `Shield` - Accountability value
- `ShieldAlert` - Untrusted/Self-verification
- `AlertTriangle` - Sybil detection
- `Users` - Community level/Vote brigade
- `Trophy` - Admin level
- `Lock` - Weighted trust

## Page Sections

### 1. Hero Section
- Gradient background
- "Platform Workflow" badge
- "How It Works" title
- Subtitle about transparency and anti-gaming

### 2. Main Workflow Steps (6 steps)

| Step | Icon | Title | Description |
|------|------|-------|-------------|
| 1 | Search | Discover Promises | Browse and search promises |
| 2 | FileText | Submit a Promise | Add new promises with sources |
| 3 | Upload | Verify Progress | Submit evidence |
| 4 | Vote | Community Voting | Review and vote on verifications |
| 5 | TrendingUp | Earn Reputation | Build citizen score |
| 6 | CheckCircle | Track Accountability | Monitor promise status |

### 3. Trust Level System

| Level | Weight | Color | Requirements |
|-------|--------|-------|--------------|
| Untrusted | 0.5x | Orange | New users (< 7 days, < 100 score) |
| Community | 1.0x | Gray | Regular contributors |
| Trusted | 2.0x | Blue | High-quality contributors |
| Admin | 3.0x | Purple | Platform moderators |

### 4. Anti-Gaming Protection

| Feature | Description | Penalty |
|---------|-------------|---------|
| Self-Verification Detection | Auto-flagging self-verifications | 0.1x multiplier (90% reduction) |
| Vote Brigade Detection | Pattern analysis for coordinated voting | Account flagging, admin review |
| Sybil Attack Prevention | Detects suspicious patterns | Automatic flagging |
| Weighted Trust System | Higher trust = more influence | New users limited (0.5x) |

### 5. Why This Matters

Three value cards:
1. **Transparency** - Public visibility, audit logs
2. **Community-Driven** - Citizen verification, anti-gaming
3. **Accountability** - Permanent record, cryptographic hashes

## User Interactions

- Informational page only
- No interactive elements

## Key Statistics Highlighted

- 0.1x - Self-verification penalty
- 80% - Correlation threshold for brigades
- Real-time - Suspicious activity monitoring

## Authentication Requirements

- **Required:** No
- Public educational page

## Styling

- Numbered step indicators with connecting lines
- Color-coded trust level cards
- Red-themed anti-gaming section
- Info boxes with icons

## Educational Content

Explains:
- How to contribute effectively
- How reputation scoring works
- What behaviors are penalized
- Why the system exists
