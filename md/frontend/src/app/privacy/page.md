# Privacy Policy Page (privacy/page.tsx)

## Overview

**File Path:** `frontend/src/app/privacy/page.tsx`
**URL:** `/privacy`
**Type:** Server Component

## Purpose

The Privacy Policy Page details the platform's data collection practices, privacy commitments, security measures, and user rights. It emphasizes the platform's commitment to not selling data or showing ads.

## Data Fetching

- No data fetching
- Static legal content

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Card`, `CardContent`

### Icons (Lucide React)
- `Shield` - Privacy commitment / rights
- `Lock` - How data is used
- `Database` - Data we collect
- `Ban` - What we don't do
- `Eye` - Public vs private data
- `Server` - Data storage
- `GitBranch` - Open source

## Page Sections

### 1. Privacy Commitment Card
- Open-source, citizen-driven initiative
- Transparency and privacy priorities

### 2. What We DO NOT Do (Red-themed cards)

| Practice | Statement |
|----------|-----------|
| Sell Data | Never sell, rent, trade, or share personal info |
| Show Ads | Completely ad-free, no tracking pixels |
| Track Across Sites | No cross-site cookies, no fingerprinting |
| Build Profiles | No psychological profiling or preference manipulation |

### 3. Data We Collect

**Account Information:**
- Email (authentication and password reset only)
- Username (publicly visible)
- Password (bcrypt encrypted)
- Account creation date

**User-Generated Content (Public):**
- Political promises submitted
- Verifications and evidence
- Votes (upvotes/downvotes)
- Images and documents
- Citizen reputation score and trust level

**Technical Data (Security Only):**
- IP address (fraud detection and rate limiting)
- Browser type and version
- Device type
- Access timestamps

### 4. How We Use Your Data
- Core platform functionality
- Anti-gaming protection
- Trust level assignment
- Fraud prevention
- Security
- Essential notifications
- Legal compliance

### 5. Data Storage & Security
- Database: PostgreSQL on Supabase (SSL/TLS)
- Authentication: Supabase Auth with bcrypt + JWT
- File Storage: Supabase Storage with virus scanning
- Hosting: Vercel with HTTPS/SSL
- Backups: Daily with 30-day retention
- Access Control: Row-Level Security (RLS)

### 6. Public vs Private Data

**Publicly Visible:**
- Username, promises, verifications, votes
- Reputation score, trust level
- Activity timestamps, uploaded evidence

**Private (Never Shared):**
- Email address
- Password (encrypted)
- IP address
- Browser details
- Internal fraud detection scores

### 7. Open Source & Transparency
- Fully open-source on GitHub
- Code publicly auditable
- Public Transparency Log

### 8. Your Privacy Rights
- Access: Request data copy
- Correction: Update email/username
- Deletion: Request account deletion
- Data Export: Download as JSON
- Opt-Out: Disable email notifications

### 9. Third-Party Services
- Supabase (database, auth, storage)
- Vercel (hosting)
- No other third parties

### 10. Changes to Policy
- Notice of significant changes
- Continued use = acceptance

### 11. Contact Information
- Email: support@political-accountability.in
- Feedback Form link
- GitHub issues for privacy concerns

## User Interactions

- Informational/legal page only
- External links to Supabase/Vercel privacy policies
- Link to transparency log

## Authentication Requirements

- **Required:** No
- Public legal document

## Last Updated

- November 2025

## Styling

- Red-themed "DO NOT" section
- Green and blue boxes for public/private data distinction
- Clear iconography for each section
