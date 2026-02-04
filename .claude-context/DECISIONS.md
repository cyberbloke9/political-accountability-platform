# Key Decisions Log

## Architecture Decisions

### AD-001: Supabase over Firebase
**Date:** Nov 2025
**Context:** Needed backend with auth, database, and storage
**Decision:** Use Supabase
**Rationale:** PostgreSQL (not NoSQL), Row-Level Security, open source, generous free tier
**Status:** Implemented, working well

### AD-002: Next.js 14 App Router
**Date:** Nov 2025
**Context:** React framework selection
**Decision:** Use Next.js 14 with App Router
**Rationale:** Server components, streaming, file-based routing, Vercel integration
**Status:** Implemented

### AD-003: shadcn/ui Components
**Date:** Nov 2025
**Context:** UI component library
**Decision:** Use shadcn/ui over Material UI, Chakra, etc.
**Rationale:** Customizable, accessible, Tailwind-native, copy-paste model
**Status:** Implemented, 20+ components

### AD-004: 4-Tier Trust System
**Date:** Nov 2025
**Context:** Anti-gaming mechanism
**Decision:** Admin (3.0x), Trusted (2.0x), Community (1.0x), New (0.5x)
**Rationale:** Weighted voting without friction, gradual trust building
**Status:** Implemented, effective

### AD-005: No CAPTCHA
**Date:** Nov 2025
**Context:** Bot prevention
**Decision:** Trust-based approach instead of CAPTCHA
**Rationale:** Frictionless UX, trust system handles abuse
**Status:** Implemented, monitoring

---

## Technical Decisions

### TD-001: Global Elections Expansion Schema
**Date:** Feb 2026
**Context:** Support multiple countries beyond India
**Decision:** Separate countries/states_provinces tables, election_level enum
**Rationale:** Scalable, ISO-standard codes, clean separation
**Status:** Implemented (v2.5.0)

### TD-002: Election Data Source Tracking
**Date:** Feb 2026
**Context:** Auditable data imports
**Decision:** election_data_sources and election_data_imports tables
**Rationale:** Transparency, track provenance, reliability scores
**Status:** Implemented (v2.5.0)

### TD-003: Potential Candidates Tracking
**Date:** Feb 2026
**Context:** Track candidates before nomination filing
**Decision:** Separate potential_candidates table with status workflow
**Rationale:** Pre-election tracking, announcement tracking
**Status:** Implemented (v2.5.0)

### TD-004: Suspense Wrapper Pattern
**Date:** Feb 2026
**Context:** Next.js 14 useSearchParams error
**Decision:** Wrap useSearchParams components in Suspense with loading fallback
**Rationale:** Required for static generation, consistent pattern
**Status:** Implemented, matches /promises page pattern

### TD-005: ElectionType Expansion
**Date:** Feb 2026
**Context:** Support global election types
**Decision:** 27-value union type covering all election types
**Rationale:** Comprehensive coverage, type-safe, extensible
**Status:** Implemented

---

## Process Decisions

### PD-001: CI/CD Pipeline
**Date:** Nov 2025
**Context:** Automated testing and deployment
**Decision:** GitHub Actions with test, typecheck, build, deploy stages
**Rationale:** Free for public repos, Vercel integration, parallel jobs
**Status:** Implemented

### PD-002: GYWD Planning System
**Date:** Feb 2026
**Context:** Project state management
**Decision:** Use .planning/ directory with STATE.md, PROJECT.md, ROADMAP.md
**Rationale:** Persistent context, session resumption, clear roadmap
**Status:** Implemented

### PD-003: Claude Context Folder
**Date:** Feb 2026
**Context:** AI assistant memory across sessions
**Decision:** .claude-context/ with SESSION.md, ARCHITECTURE.md, DECISIONS.md
**Rationale:** Quick resume, persistent memory, architecture reference
**Status:** Implemented

---

## Versioning

| Version | Date | Key Decision |
|---------|------|--------------|
| v1.0.0 | Nov 2025 | Core platform launch |
| v2.0.0 | Dec 2025 | Follow system |
| v2.4.0 | Jan 2026 | Social sharing, comparison |
| v2.5.0 | Feb 2026 | Global elections expansion |
