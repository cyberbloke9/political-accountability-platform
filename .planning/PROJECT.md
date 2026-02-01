# Political Accountability Platform

## What This Is

A citizen-driven platform to track political promises with community verification and transparent accountability. Starting with India, expanding globally. Think "Glassdoor for politicians" — citizens submit promises, provide evidence, vote on accuracy, and build transparent records of political accountability.

**Live:** https://www.political-accountability.in

## Core Value

Empower citizens to hold political leaders accountable through transparent, evidence-based tracking of political commitments. Break the cycle of broken promises.

## Requirements

### Validated (In Production)

**Core Platform**
- [x] Promise tracking with CRUD operations
- [x] Community verification with evidence uploads
- [x] Voting system for verification accuracy
- [x] Politician profiles with grades (A-F)
- [x] User authentication (email/password)
- [x] Reputation/citizen score system
- [x] Leaderboard for top contributors

**Engagement**
- [x] Follow system (politicians/promises)
- [x] Real-time notifications
- [x] Discussion threads
- [x] Social sharing (Twitter, Facebook, WhatsApp, LinkedIn)
- [x] Comparison tool (up to 4 politicians)
- [x] Timeline visualization
- [x] Dynamic OG images

**Admin & Moderation**
- [x] Admin dashboard with 13 sub-pages
- [x] Verification approval/rejection workflow
- [x] User flagging and ban management
- [x] Auto-approval for trusted users
- [x] Public transparency log (/transparency)

**Anti-Gaming**
- [x] Trust levels (4-tier weighted system)
- [x] Self-verification detection
- [x] Vote brigade detection
- [x] Sybil attack detection
- [x] Fraud pattern analysis

**Elections**
- [x] Election tracking with constituencies
- [x] Candidate profiles

### Active (In Development)

**Global Elections Expansion (v2.5.0)**
- [x] Countries table (50+ democracies)
- [x] States/provinces table
- [x] Election levels (national, state, municipal, local)
- [x] Potential candidates tracking
- [x] Election calendar with milestones
- [x] Data source tracking
- [x] Historical election seeding
- [ ] Commit and deploy changes

### Planned

**Anti-Gaming Enhancements (v2.6.0)**
- [ ] Trust level automation (nightly recalculation)
- [ ] Reputation decay system
- [ ] Advanced fraud detection
- [ ] Rate limiting system

**Analytics Dashboard (v2.7.0)**
- [ ] Platform statistics
- [ ] Promise fulfillment analytics
- [ ] User engagement metrics
- [ ] Geographic distribution

**Mobile & PWA (v3.0.0)**
- [ ] Progressive Web App
- [ ] Offline functionality
- [ ] Push notifications

**AI/ML Features (v3.1.0)**
- [ ] Automated fact-checking assistance
- [ ] Duplicate promise detection
- [ ] ML-enhanced fraud detection

### Out of Scope

- Native mobile apps (PWA instead)
- Real-time chat (discussions are async)
- Paid premium features (platform stays free)
- Data selling or advertising

## Context

**Problem:**
Political promises are made and forgotten. No central, citizen-driven system exists to track accountability across India (and eventually globally).

**Solution:**
Crowdsourced promise tracking with community verification, weighted trust systems to prevent gaming, and transparent audit logs.

**Target Users:**
- Citizens wanting to track local/national politicians
- Journalists researching political accountability
- Researchers studying promise fulfillment
- Civil society organizations

**Competitive Context:**
- PolitiFact (US-focused, journalist-driven, not crowdsourced)
- FactCheck.org (fact-checking, not promise tracking)
- No direct competitor in India

## Constraints

- **Solo developer** with limited time
- **Free tier hosting** (Vercel + Supabase)
- **Open source** — code must be auditable
- **No ads, no data selling** — trust is paramount
- **Mobile-first** — India is mobile-dominant

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase over Firebase | PostgreSQL, RLS, open source | ✓ Working well |
| Next.js App Router | Server components, streaming | ✓ Good DX |
| shadcn/ui components | Customizable, accessible | ✓ Clean UI |
| 4-tier trust system | Prevent gaming without friction | ✓ Effective |
| No CAPTCHA | Friction-free, trust-based approach | ✓ Works with anti-gaming |
| ISO country codes | Standard for global expansion | ✓ Implemented |
| Election levels enum | Clean categorization | ✓ Implemented |

---

*Last updated: 2026-02-01 — v2.5.0 Global Elections Expansion*
