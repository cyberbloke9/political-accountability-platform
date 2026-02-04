# Architecture Reference

## Directory Structure

```
political-accountability-platform/
├── frontend/                    # Next.js 14 application
│   ├── src/
│   │   ├── app/                # App Router pages (58 total)
│   │   │   ├── admin/          # Admin dashboard (13 pages)
│   │   │   │   ├── page.tsx           # Admin home
│   │   │   │   ├── users/             # User management
│   │   │   │   ├── verifications/     # Verification review
│   │   │   │   ├── flags/             # Suspicious accounts
│   │   │   │   ├── fraud/             # Fraud detection
│   │   │   │   ├── vote-patterns/     # Brigade analysis
│   │   │   │   ├── reputation/        # Score management
│   │   │   │   ├── bans/              # Ban management
│   │   │   │   ├── auto-approval/     # Auto-verification
│   │   │   │   ├── elections/         # Election management (NEW)
│   │   │   │   ├── reports/           # Analytics
│   │   │   │   └── audit/             # Action audit
│   │   │   ├── elections/       # Election pages (6 pages)
│   │   │   │   ├── page.tsx           # Elections hub
│   │   │   │   ├── [id]/              # Election detail
│   │   │   │   ├── national/          # National elections (NEW)
│   │   │   │   ├── state/             # State elections (NEW)
│   │   │   │   ├── municipal/         # Municipal elections (NEW)
│   │   │   │   ├── local/             # Local elections (NEW)
│   │   │   │   └── upcoming/          # Calendar view (NEW)
│   │   │   ├── candidates/      # Candidate pages (3 pages) (NEW)
│   │   │   │   ├── page.tsx           # Candidates hub
│   │   │   │   ├── potential/         # Potential candidates
│   │   │   │   └── by-state/[code]/   # Filter by state
│   │   │   ├── promises/        # Promise pages
│   │   │   │   ├── page.tsx           # Browse promises
│   │   │   │   ├── [id]/              # Promise detail
│   │   │   │   └── new/               # Submit promise
│   │   │   ├── politicians/     # Politician pages
│   │   │   │   ├── page.tsx           # Browse politicians
│   │   │   │   └── [slug]/            # Politician profile
│   │   │   ├── verifications/   # Verification pages
│   │   │   │   ├── [id]/              # Verification detail
│   │   │   │   └── new/               # Submit verification
│   │   │   ├── compare/         # Comparison tool
│   │   │   │   └── [[...slugs]]/      # Compare politicians
│   │   │   ├── dashboard/       # User dashboard
│   │   │   ├── profile/         # User profiles
│   │   │   ├── leaderboard/     # Top contributors
│   │   │   ├── notifications/   # User notifications
│   │   │   ├── settings/        # User settings
│   │   │   ├── about/           # About page
│   │   │   ├── how-it-works/    # Feature explanations
│   │   │   ├── guidelines/      # Community guidelines
│   │   │   ├── contact/         # Contact form
│   │   │   ├── transparency/    # Public audit log
│   │   │   ├── terms/           # Terms of service
│   │   │   ├── privacy/         # Privacy policy
│   │   │   ├── api/             # API routes
│   │   │   │   ├── feedback/          # Feedback endpoint
│   │   │   │   └── og/                # OG image generation
│   │   │   └── auth/            # Auth callbacks
│   │   │
│   │   ├── components/          # React components (60+)
│   │   │   ├── ui/              # shadcn/ui (20+ components)
│   │   │   ├── layout/          # Header, Footer
│   │   │   ├── admin/           # Admin components
│   │   │   ├── promises/        # Promise display
│   │   │   ├── elections/       # Election widgets
│   │   │   │   ├── ElectionCard.tsx
│   │   │   │   ├── ElectionLevelTabs.tsx (NEW)
│   │   │   │   └── ElectionCalendar.tsx (NEW)
│   │   │   ├── candidates/      # Candidate components (NEW)
│   │   │   │   ├── PotentialCandidateCard.tsx
│   │   │   │   ├── CandidatesByStateFilter.tsx
│   │   │   │   └── index.ts
│   │   │   ├── comparison/      # Comparison tool
│   │   │   ├── notifications/   # Notification system
│   │   │   ├── sharing/         # Social sharing
│   │   │   ├── timeline/        # Timeline visualization
│   │   │   ├── quality/         # Quality badges
│   │   │   ├── search/          # Search components
│   │   │   └── seo/             # SEO components
│   │   │
│   │   ├── hooks/               # Custom hooks (6)
│   │   │   ├── useAuth.ts
│   │   │   ├── useAdmin.ts
│   │   │   ├── useNotifications.ts
│   │   │   ├── useRealtimeLeaderboard.ts
│   │   │   └── useRealtimeVoting.ts
│   │   │
│   │   ├── lib/                 # Utilities (27 files)
│   │   │   ├── supabase.ts           # Supabase client
│   │   │   ├── supabase-server.ts    # Server-side client
│   │   │   ├── elections.ts          # Election queries (34KB)
│   │   │   ├── candidates.ts         # Candidate operations (NEW)
│   │   │   ├── data-sources.ts       # Data provenance (NEW)
│   │   │   ├── adminActions.ts       # Admin operations
│   │   │   ├── fraudDetection.ts     # Fraud algorithms
│   │   │   ├── search.ts             # Full-text search
│   │   │   ├── seo.ts                # SEO utilities
│   │   │   └── ...
│   │   │
│   │   ├── store/               # State management (empty)
│   │   └── types/               # TypeScript types (empty)
│   │
│   ├── public/                  # Static assets
│   └── package.json
│
├── database/
│   └── migrations/              # SQL migrations (001-043)
│       ├── 001_initial_schema.sql
│       ├── ...
│       ├── 035_countries_table.sql      (NEW)
│       ├── 036_states_provinces_table.sql (NEW)
│       ├── 037_election_levels.sql      (NEW)
│       ├── 038_potential_candidates.sql (NEW)
│       ├── 039_election_calendar.sql    (NEW)
│       ├── 040_seed_countries.sql       (NEW)
│       ├── 041_seed_indian_states.sql   (NEW)
│       ├── 042_election_data_sources.sql (NEW)
│       └── 043_seed_historical_elections.sql (NEW)
│
├── scripts/                     # Utility scripts (NEW)
│   ├── fetch-datagov-elections.ts
│   └── import-datameet-elections.ts
│
├── .planning/                   # GYWD planning files
│   ├── STATE.md
│   ├── PROJECT.md
│   ├── ROADMAP.md
│   └── phases/
│       └── elections-expansion-plan.md
│
├── .claude-context/             # Claude memory (NEW)
│   ├── SESSION.md               # Quick resume context
│   └── ARCHITECTURE.md          # This file
│
├── .github/
│   └── workflows/
│       └── ci.yml               # CI/CD pipeline
│
├── README.md
├── NEXT_PHASES.md               # Development roadmap
├── TECH_STACK.md                # Technology details
├── CONTRIBUTING.md              # Contribution guidelines
├── LAUNCH_CHECKLIST.md          # Launch tasks
├── LICENSE                      # MIT License
└── vercel.json                  # Vercel config
```

## Database Schema

### Core Tables
| Table | Purpose |
|-------|---------|
| `users` | User profiles, reputation, trust levels |
| `promises` | Political commitments |
| `promise_tags` | Categorization |
| `verifications` | Evidence submissions |
| `evidence_files` | Attachments |
| `votes` | Community voting |
| `discussion_threads` | Comments |

### Election Tables (v2.5.0)
| Table | Purpose |
|-------|---------|
| `countries` | 50+ democracies (ISO codes, flags) |
| `states_provinces` | Regional subdivisions |
| `elections` | Election records with levels |
| `election_calendar` | Event milestones |
| `constituencies` | Electoral districts |
| `candidates` | Filed candidates |
| `potential_candidates` | Pre-nomination tracking |
| `election_data_sources` | Auditable imports |

### Security Tables
| Table | Purpose |
|-------|---------|
| `user_trust_levels` | Trust categorization |
| `user_flags` | Suspicious accounts |
| `fraud_reports` | Fraud patterns |
| `vote_brigade_patterns` | Coordinated voting |
| `sybil_attack_patterns` | Multi-account detection |

### Admin Tables
| Table | Purpose |
|-------|---------|
| `admin_roles` | Role definitions |
| `user_admin_roles` | User-role mapping |
| `moderation_actions` | Admin action audit |
| `activity_logs` | User actions |
| `feedback` | User feedback |

## Key Types

### ElectionType (27 values)
Located in `frontend/src/lib/elections.ts`

### ElectionLevel (7 values)
```typescript
'national' | 'state' | 'regional' | 'district' | 'municipal' | 'local' | 'special'
```

### ElectionStatus (7 values)
```typescript
'announced' | 'nominations_open' | 'campaigning' | 'polling' | 'counting' | 'completed' | 'cancelled'
```

### CandidacyStatus (5 values)
```typescript
'potential' | 'announced' | 'filed' | 'confirmed' | 'withdrawn'
```

## API Patterns

### Supabase Queries
```typescript
// List with filters
const { data, error } = await supabase
  .from('elections')
  .select('*')
  .eq('election_level', 'national')
  .order('start_date', { ascending: false })
  .limit(20)

// RPC function
const { data, error } = await supabase.rpc('get_election_data_sources', {
  p_active_only: true
})
```

### Component Pattern
```typescript
'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function Content() {
  const searchParams = useSearchParams()
  // Component logic
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Content />
    </Suspense>
  )
}
```
