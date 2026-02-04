# Political Accountability Platform - Claude Context

**Last Updated:** 2026-02-04
**Session:** CI/CD fixes completed, Global Elections v2.5.0 deployed

## Quick Resume

To resume work on this project, read this file first, then check:
1. `git status` - See uncommitted changes
2. `NEXT_PHASES.md` - Current roadmap position
3. GitHub Actions - CI/CD status

## Project Overview

**Name:** Political Accountability Platform
**URL:** https://www.political-accountability.in
**Repo:** https://github.com/cyberbloke9/political-accountability-platform
**Version:** 2.5.0 (Global Elections Expansion)

**Mission:** Break the cycle of broken promises. Empower citizens to hold political leaders accountable through transparent, evidence-based tracking of political commitments.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14.2.0, React 18.3.0, TypeScript 5.3.3 |
| Styling | Tailwind CSS 3.4.1, shadcn/ui, Radix UI |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Deployment | Vercel (Frontend), Supabase Cloud (Backend) |
| State | React Hooks, TanStack Query 5.28.0 |

## Current State (2026-02-04)

### Just Completed
- **v2.5.0 Global Elections Expansion** pushed and deployed
- CI/CD fixes for TypeScript errors and Suspense boundary
- All 43 database migrations ready

### Commits Today
1. `6c10fad` - feat(elections): add global elections expansion v2.5.0
2. `06c5096` - fix(types): resolve TypeScript errors in elections module
3. `5793939` - fix(build): wrap useSearchParams in Suspense boundary

### Files Modified This Session
- `README.md` - Updated to v2.5.0
- `NEXT_PHASES.md` - Updated roadmap
- `TECH_STACK.md` - Added new tables
- `.planning/` - Created GYWD state files
- `frontend/src/lib/data-sources.ts` - Fixed supabase import
- `frontend/src/lib/elections.ts` - Added all ElectionType labels
- `frontend/src/app/admin/elections/page.tsx` - Fixed supabase import
- `frontend/src/app/candidates/potential/page.tsx` - Added Suspense wrapper

## Codebase Metrics

| Metric | Count |
|--------|-------|
| Pages | 58 |
| Components | 60+ |
| Migrations | 43 |
| Library files | 27 |
| Custom hooks | 6 |
| Database tables | 34+ |

## Key Patterns

### Supabase Import
```typescript
// Correct pattern for lib files:
import { supabase } from './supabase'

// Correct pattern for app files:
import { supabase } from '@/lib/supabase'
```

### useSearchParams Pattern
```typescript
// Must wrap in Suspense for Next.js 14 static generation
function MyContent() {
  const searchParams = useSearchParams()
  // ...
}

export default function MyPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MyContent />
    </Suspense>
  )
}
```

### ElectionType (27 values)
```typescript
export type ElectionType =
  | 'lok_sabha' | 'rajya_sabha' | 'state_assembly' | 'municipal' | 'panchayat' | 'by_election'
  | 'presidential' | 'parliamentary' | 'senate' | 'house_of_representatives'
  | 'gubernatorial' | 'state_senate' | 'state_legislative'
  | 'regional_council' | 'district_council' | 'zilla_parishad'
  | 'mayoral' | 'municipal_corporation' | 'municipal_council' | 'town_council'
  | 'gram_sabha' | 'ward_council' | 'block_council'
  | 'referendum' | 'recall' | 'primary' | 'runoff'
```

## Roadmap Position

### In Progress
- **v2.5.0** - Global Elections (DEPLOYED)

### Next Up
- **v2.6.0** - Anti-Gaming Enhancements (trust automation, reputation decay)
- **v2.7.0** - Analytics Dashboard
- **v3.0.0** - Mobile & PWA

## Database Migrations

### Latest (v2.5.0 - Elections Expansion)
| Migration | Purpose |
|-----------|---------|
| 035 | Countries table (50+ democracies) |
| 036 | States/provinces table |
| 037 | Election levels expansion |
| 038 | Potential candidates |
| 039 | Election calendar |
| 040 | Seed countries |
| 041 | Seed Indian states |
| 042 | Election data sources |
| 043 | Seed historical elections |

**Note:** Run migrations 035-043 in Supabase SQL Editor if not already done.

## CI/CD Pipeline

**File:** `.github/workflows/ci.yml`

**Jobs:**
1. `test` - Run Jest tests (`npm test -- --coverage --passWithNoTests`)
2. `typecheck` - TypeScript validation (`npm run type-check`)
3. `build` - Production build (`npm run build`)
4. `deploy` - Vercel deployment (on main branch push)

## Known Issues / Gotchas

1. **Coverage thresholds** - Tests pass but coverage warnings appear (not blocking)
2. **useSearchParams** - Always wrap in Suspense for static generation
3. **Supabase imports** - Use correct path based on file location
4. **ElectionType** - Must include ALL 27 types in Record<ElectionType, string>

## Commands

```bash
# Development
cd frontend && npm run dev

# Type check
npm run type-check

# Tests
npm test -- --coverage --passWithNoTests

# Build
npm run build

# Deploy (automatic via Vercel on push to main)
git push origin main
```

## Contact

- **Website:** political-accountability.in
- **Email:** support@political-accountability.in
- **GitHub:** github.com/cyberbloke9/political-accountability-platform
