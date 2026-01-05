# Community Guidelines Page (guidelines/page.tsx)

## Overview

**File Path:** `frontend/src/app/guidelines/page.tsx`
**URL:** `/guidelines`
**Type:** Server Component

## Purpose

The Community Guidelines Page establishes rules for fair, transparent, and non-partisan participation on the platform. It covers zero-tolerance violations, vote brigading policies, trust levels, quality standards, and prohibited conduct.

## Data Fetching

- No data fetching
- Static policy content

## Components Used

### Layout Components
- `Header` - Main navigation header
- `Footer` - Site footer

### UI Components
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Badge` - Version badge

### Icons (Lucide React)
- `AlertTriangle` - Zero tolerance / warnings
- `Shield` - Core principles
- `Ban` - Prohibited conduct
- `Users` - Vote brigading / community
- `Target` - Quality standards
- `CheckCircle2` - Reputation
- `Scale` - Trust system

## Page Sections

### 1. Hero Section
- Version badge: "Version 1.0 - November 2025"
- "Community Guidelines" title
- Subtitle: "Fair, transparent, non-partisan rules"

### 2. Core Principles Card
- Platform tracks promises objectively
- Not aligned with any party, ideology, or candidate
- Guidelines prevent manipulation and ensure equal service

### 3. Zero Tolerance Violations

#### AI-Generated Content (IMMEDIATE BAN)
- Using AI to generate promises, verifications, or evidence
- Consequences:
  - Immediate permanent ban (no warnings)
  - All content deleted
  - IP and device ban

#### Fake Accounts & Sock Puppets
- Creating multiple accounts to manipulate
- Consequences:
  - Permanent ban on all accounts
  - IP ban
  - Reputation reset

### 4. Vote Brigading & Coordinated Manipulation

**What is Vote Brigading:**
- Organizing groups to systematically vote based on affiliation
- Coordinating via WhatsApp, Telegram, Discord
- Downvoting all content critical of preferred party
- Following external voting instructions

**Detection Methods:**
- Correlation analysis (80%+ voting similarity)
- Velocity detection (10+ votes in 5 minutes)
- Brigade pattern recognition
- Real-time monitoring

**Consequences:**
- 1st Offense: 30-day voting ban, reputation penalty
- 2nd Offense: 90-day suspension, votes removed
- 3rd Offense: Permanent ban, IP ban, content deleted

### 5. Trust Level System & Self-Verification

**Trust Levels:**
| Level | Weight | Description |
|-------|--------|-------------|
| Untrusted | 0.5x | New users < 7 days, < 100 score |
| Community | 1.0x | 100+ score, 7+ days |
| Trusted | 2.0x | 500+ score, proven track record |
| Admin | 3.0x | Manually assigned moderators |

**Self-Verification Penalty:**
- 0.1x weight penalty (90% reduction)
- Automatically detected and applied

### 6. Quality Standards

**Submitting Promises:**
- Provide exact quotes
- Include credible sources
- Add context (when, where, to whom)
- Choose accurate categories
- Avoid editorializing

**Submitting Verifications:**
- Provide concrete evidence
- Use multiple sources when possible
- Mark status accurately
- Upload supporting documents
- Minimum 100 characters

**Voting on Verifications:**
- Vote based on evidence quality
- Upvote well-sourced content
- Downvote misleading claims
- Don't vote on unverifiable content
- Review sources before voting

### 7. Reputation & Gamification

- Starting Points: 100 base points
- Earning: Quality contributions with trust level multiplier
- Losing: Rejections, violations, downvotes
- Leaderboard: Top contributors showcased

### 8. Prohibited Conduct (Grid layout)

**Content Violations:**
- Misinformation/fake news
- Manipulated images/documents
- Unsourced/fabricated claims
- Offensive/abusive language
- Personal attacks/doxxing

**Behavioral Violations:**
- Harassment/bullying
- Spam/repeated submissions
- Impersonation
- Circumventing bans
- Exploiting vulnerabilities

### 9. Closing Card
- "We Are All on the Same Side"
- Message of unity across political views
- Platform serves all citizens equally

### 10. Contact Footer
- Email link
- Submit Feedback link
- Transparency Log link

## User Interactions

- Informational page only
- Links to contact and transparency pages

## Authentication Requirements

- **Required:** No
- Public policy document

## Styling

- Red/destructive theme for violations
- Orange theme for warnings
- Blue theme for trust levels
- Color-coded severity indicators
- Two-column grid for prohibited conduct
