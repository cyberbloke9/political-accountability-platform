# Terms of Use Page (terms/page.tsx)

## Overview

**File Path:** `frontend/src/app/terms/page.tsx`
**URL:** `/terms`
**Type:** Server Component

## Purpose

The Terms of Use Page outlines the legal terms governing platform usage, including user responsibilities, prohibited conduct, trust levels, enforcement policies, and content licensing.

## Data Fetching

- No data fetching
- Static legal content

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Card`, `CardContent`, `CardHeader`, `CardTitle`

### Icons (Lucide React)
- `ShieldCheck` - Platform purpose
- `UserCheck` - User responsibilities
- `Ban` - Prohibited conduct
- `Scale` - Trust level system
- `AlertTriangle` - Enforcement
- `Lock` - Content & IP

## Page Sections

### 1. Platform Purpose Card
- Description of the platform as non-partisan, open-source
- Commitment to factual, evidence-based tracking

### 2. User Responsibilities
- Submit only factual, verifiable information
- Provide evidence-based verifications
- Engage respectfully
- Vote based on evidence quality
- Accept 100 base reputation points starting
- Comply with anti-gaming measures

### 3. Trust Level System
Four levels with color-coded cards:

| Level | Weight | Styling | Description |
|-------|--------|---------|-------------|
| Untrusted | 0.5x | Orange | New users < 7 days or < 100 score |
| Community | 1.0x | Gray | Regular contributors 100+ score, 7+ days |
| Trusted | 2.0x | Blue | High-quality contributors 500+ score |
| Admin | 3.0x | Purple | Manually assigned moderators |

### 4. Prohibited Conduct (with red border styling)

| Violation | Consequence |
|-----------|-------------|
| AI-Generated Content | Immediate permanent ban, content deletion, IP ban |
| Self-Verification | 0.1x weight penalty (90% reduction) |
| Vote Brigading | Account flagging and suspension |
| Partisan Voting | Based on political preference not evidence |
| Misinformation | False information, fake sources |
| Abuse & Harassment | Personal attacks, doxxing, threats |

### 5. Enforcement & Penalties
Four severity levels:
- Minor: Content removal, reputation penalty, warning
- Moderate: 30-day voting ban, reputation reset
- Severe: 90-day suspension, content flagged
- Critical: Permanent ban, IP ban, content deleted

Includes appeal process information.

### 6. Content & Intellectual Property
- Creative Commons Attribution 4.0 license
- Perpetual license grant to platform
- Proper sourcing requirements

### 7. Limitation of Liability
- Platform provided "as is"
- No guarantees on content accuracy
- Users responsible for independent verification

### 8. Changes to Terms
- Notice of updates
- Continued use = acceptance

### 9. Contact Information
- Email: support@political-accountability.in
- Feedback Form link
- Transparency Log link

## User Interactions

- Informational/legal page only
- Links to contact page and transparency log

## Authentication Requirements

- **Required:** No
- Public legal document

## Last Updated

- November 2025

## Styling

- Red border and background for prohibited conduct
- Color-coded trust level cards
- Important sections highlighted with icons
- Appeal process highlighted in blue info box
