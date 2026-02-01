# Roadmap

Last Updated: 2026-02-01

## Milestone Overview

| Milestone | Version | Status | Description |
|-----------|---------|--------|-------------|
| M1: Core Platform | v1.0.0 | ✓ Complete | Promise tracking, verification, voting |
| M2: Engagement | v2.0.0 | ✓ Complete | Follow system, notifications, discussions |
| M3: Social & Comparison | v2.4.0 | ✓ Complete | Sharing, comparison, timeline |
| M4: Global Elections | v2.5.0 | In Progress | Multi-country, election levels |
| M5: Anti-Gaming+ | v2.6.0 | Planned | Trust automation, rate limiting |
| M6: Analytics | v2.7.0 | Planned | Platform statistics dashboard |
| M7: Mobile | v3.0.0 | Planned | PWA, offline, push notifications |
| M8: AI/ML | v3.1.0 | Planned | Fact-checking, fraud prediction |

---

## Milestone 1: Core Platform (v1.0.0) ✓

**Goal:** Build foundational promise tracking system

### Phases Complete
- [x] Phase 1: Authentication & Users
- [x] Phase 2: Promise CRUD
- [x] Phase 3: Verification System
- [x] Phase 4: Community Voting
- [x] Phase 5: User Profiles & Reputation
- [x] Phase 6: Search & Filtering
- [x] Phase 7: Admin Dashboard
- [x] Phase 8: Anti-Gaming Foundation

**Migrations:** 001-017

---

## Milestone 2: Engagement (v2.0.0-v2.1.0) ✓

**Goal:** Increase user engagement and retention

### Phases Complete
- [x] Phase 9: Follow System
- [x] Phase 10: Notifications
- [x] Phase 11: Discussion Threads
- [x] Phase 12: Personalized Dashboard

**Migrations:** 018-021

---

## Milestone 3: Social & Comparison (v2.2.0-v2.4.0) ✓

**Goal:** Enable sharing and comparative analysis

### Phases Complete
- [x] Phase 13: Election Integration
- [x] Phase 14: Evidence Quality System
- [x] Phase 15: Social Sharing
- [x] Phase 16: Comparison Tool
- [x] Phase 17: Timeline Visualization
- [x] Phase 18: Dynamic OG Images

**Migrations:** 022-034

---

## Milestone 4: Global Elections (v2.5.0) ← CURRENT

**Goal:** Expand beyond India to track elections globally

### Phases
- [x] Phase 19: Countries & States Schema (Migration 035-036)
- [x] Phase 20: Election Levels (Migration 037)
- [x] Phase 21: Potential Candidates (Migration 038)
- [x] Phase 22: Election Calendar (Migration 039)
- [x] Phase 23: Data Seeding (Migrations 040-043)
- [x] Phase 24: Frontend Pages
- [ ] Phase 25: Commit & Deploy

**Status:** Code complete, awaiting commit

**Migrations:** 035-043

---

## Milestone 5: Anti-Gaming+ (v2.6.0)

**Goal:** Strengthen anti-gaming with automation

### Phases Planned
- [ ] Phase 26: Trust Level Automation
- [ ] Phase 27: Reputation Decay
- [ ] Phase 28: Advanced Fraud Detection
- [ ] Phase 29: Rate Limiting

**Estimated Migrations:** 044-048

---

## Milestone 6: Analytics (v2.7.0)

**Goal:** Platform-wide statistics and insights

### Phases Planned
- [ ] Phase 30: Statistics Dashboard
- [ ] Phase 31: Promise Fulfillment Analytics
- [ ] Phase 32: User Engagement Metrics
- [ ] Phase 33: Geographic Distribution

**Estimated Migrations:** 049-052

---

## Milestone 7: Mobile (v3.0.0)

**Goal:** Mobile-first experience with PWA

### Phases Planned
- [ ] Phase 34: PWA Configuration
- [ ] Phase 35: Offline Support
- [ ] Phase 36: Push Notifications
- [ ] Phase 37: Mobile UI Polish

---

## Milestone 8: AI/ML (v3.1.0)

**Goal:** AI-assisted fact-checking and fraud detection

### Phases Planned
- [ ] Phase 38: Duplicate Promise Detection
- [ ] Phase 39: Smart Categorization
- [ ] Phase 40: ML Fraud Detection
- [ ] Phase 41: Fact-Check Assistance

---

## Future Milestones (Backlog)

### Internationalization (v3.2.0)
- Hindi language support
- Regional languages (Tamil, Telugu, Marathi)
- RTL support

### Advanced Search (v3.3.0)
- ElasticSearch integration
- Faceted search
- Search suggestions

### Public API (v3.4.0)
- REST API for researchers
- GraphQL API
- Data export tools

### Performance (v3.5.0)
- Redis caching
- Database optimization
- CDN enhancements

---

## Statistics

### Completed
- **Milestones:** 3 complete, 1 in progress
- **Phases:** 24 complete
- **Migrations:** 43 complete
- **Features:** 40+ implemented

### Codebase
- **Pages:** 58
- **Components:** 60+
- **Library files:** 27
- **Hooks:** 6
- **Database tables:** 34+

---

## Release Cadence

- **Major versions (vX.0.0):** New capabilities
- **Minor versions (vX.Y.0):** New features
- **Patch versions (vX.Y.Z):** Bug fixes

Each release:
1. Develop on feature branch
2. Test thoroughly
3. Code review
4. Merge to main
5. Auto-deploy via Vercel
6. Run migrations in Supabase
7. Monitor for issues
