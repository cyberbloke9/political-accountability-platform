# Technology Stack

Last Updated: February 1, 2026

## Architecture Overview

```
Frontend (Vercel)                    Backend (Supabase)
┌─────────────────────┐              ┌──────────────────┐
│ Next.js 14          │◄────────────►│ PostgreSQL       │
│ React 18            │   REST API   │ Auth (JWT)       │
│ TypeScript 5        │   Realtime   │ Storage          │
│ Tailwind CSS 3.4    │              │ RLS Policies     │
└─────────────────────┘              └──────────────────┘
        │                                    │
        ▼                                    ▼
┌─────────────────────┐              ┌──────────────────┐
│ 58 Pages            │              │ 43 Migrations    │
│ 60+ Components      │              │ 34+ Tables       │
│ 27 Library Files    │              │ 100+ Functions   │
│ 6 Custom Hooks      │              │ 200+ Indexes     │
└─────────────────────┘              └──────────────────┘
```

Architecture Pattern: Jamstack (JavaScript, APIs, Markup)

## Frontend

### Core
| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | 14.2.0 | React framework with App Router |
| React | 18.3.0 | UI library |
| React DOM | 18.3.0 | DOM rendering |
| TypeScript | 5.3.3 | Type safety |
| Tailwind CSS | 3.4.1 | Utility-first CSS |

### UI Components
| Package | Version | Purpose |
|---------|---------|---------|
| shadcn/ui | Latest | Component library |
| @radix-ui/* | 1.x | UI primitives |
| Lucide React | 0.338.0 | Icon library |
| Framer Motion | 12.23.24 | Animations |
| Sonner | 2.0.7 | Toast notifications |

### State & Data
| Package | Version | Purpose |
|---------|---------|---------|
| @tanstack/react-query | 5.28.0 | Data fetching/caching |
| Zustand | 4.5.2 | State management |
| Axios | 1.6.7 | HTTP client |

### Forms and Validation
| Package | Version | Purpose |
|---------|---------|---------|
| React Hook Form | 7.51.0 | Form management |
| Zod | 3.22.4 | Schema validation |
| @hookform/resolvers | Latest | Validation resolvers |

### Utilities
| Package | Version | Purpose |
|---------|---------|---------|
| date-fns | 3.6.0 | Date manipulation |
| clsx | 2.1.1 | Classname utility |
| tailwind-merge | 2.6.0 | Tailwind class merging |
| class-variance-authority | 0.7.1 | Component variants |
| @vercel/og | 0.8.6 | OG image generation |

### Development Tools
| Package | Version | Purpose |
|---------|---------|---------|
| ESLint | 8.57.0 | Code linting |
| Prettier | 3.1.1 | Code formatting |
| TypeScript ESLint | 7.1.0 | TS linting |
| PostCSS | 8.4.35 | CSS processing |
| Autoprefixer | 10.4.17 | CSS vendor prefixes |

## Backend

### Database
- PostgreSQL (via Supabase)
- Row-Level Security (RLS) policies on all tables
- Triggers and functions (100+)
- Full-text search with GIN indexes
- JSON/JSONB support
- 200+ indexes for performance

### Authentication
- Supabase Auth
- JWT tokens with expiration
- Email/password authentication
- OAuth support (Google, GitHub)
- Session management
- Protected API routes

### Storage
- Supabase Storage
- Image upload for promises and verifications
- Presigned URLs for secure access
- File validation and limits
- CDN delivery

### API
- REST API via Supabase JS client
- Server-side API routes (Next.js)
- Real-time subscriptions (Supabase Realtime)
- Automatic API generation from database schema

## Database Schema

### 43 Migrations (001-043)

#### Core Tables
| Table | Purpose |
|-------|---------|
| users | User profiles, reputation, trust levels |
| promises | Political commitments tracking |
| promise_tags | Categorization (infrastructure, healthcare, etc.) |
| verifications | Evidence submissions |
| evidence_files | Attached images/documents |
| votes | Community voting records |
| discussion_threads | Comments on promises |

#### Election Tables (New in v2.5.0)
| Table | Purpose |
|-------|---------|
| countries | 50+ democracies with ISO codes |
| states_provinces | Regional subdivisions |
| elections | Election records with levels |
| election_calendar | Event milestones (polling, results) |
| constituencies | Electoral districts |
| candidates | Filed candidates |
| potential_candidates | Who could run |
| election_data_sources | Auditable data imports |

#### User & Engagement Tables
| Table | Purpose |
|-------|---------|
| follows | Follow politicians/promises |
| followers_cache | Denormalized counts |
| notifications | User notifications |
| user_notification_settings | Preferences |
| email_digest_log | Digest tracking |
| promise_reminders | User reminders |
| citizen_scores | Gamification points |
| reputation_history | Score changes |

#### Admin & Moderation Tables
| Table | Purpose |
|-------|---------|
| admin_roles | Role definitions |
| user_admin_roles | User-role assignments |
| moderation_actions | Admin action audit |
| activity_logs | User action tracking |
| feedback | User feedback |

#### Security & Anti-Gaming Tables
| Table | Purpose |
|-------|---------|
| user_trust_levels | Trust categorization |
| user_flags | Suspicious account flags |
| fraud_reports | Detected fraud patterns |
| vote_brigade_patterns | Coordinated voting detection |
| sybil_attack_patterns | Multi-account detection |
| vote_patterns | Vote analysis |
| evidence_quality_scores | Quality metrics |

## Deployment

### Frontend Hosting
- Platform: Vercel
- Automatic deployments from GitHub
- Preview deployments for pull requests
- Global CDN distribution
- Edge functions support

### Backend Hosting
- Platform: Supabase Cloud
- Managed PostgreSQL database
- Automatic backups (daily)
- Connection pooling (PgBouncer)
- Multiple regions available

### Domain and SSL
- Custom domain: political-accountability.in
- Automatic SSL certificates (Let's Encrypt)
- HTTPS enforcement
- HSTS enabled

## Security

### Authentication
- Supabase Auth with bcrypt
- JWT tokens with 1-hour expiration
- Refresh token rotation
- Secure session management
- Password reset flow with email

### Authorization
- Row-Level Security policies on ALL tables
- Role-based access control (Admin/Moderator/Reviewer)
- Admin permission system with granular access
- Protected API routes with middleware

### Data Protection
- HTTPS/SSL encryption in transit
- Encrypted database connections
- Secure environment variables
- No sensitive data in client code
- Audit logging for compliance

### Anti-Gaming System
| Feature | Description |
|---------|-------------|
| Trust Levels | 4-tier: Admin (3.0x), Trusted (2.0x), Community (1.0x), New (0.5x) |
| Self-verification | Automatic detection with 0.1x penalty |
| Vote Brigades | Correlation analysis (>80% similarity) |
| Sybil Attacks | Pattern recognition for multi-accounts |
| Fraud Detection | Automated similarity analysis |
| Velocity Checks | Rate limiting for rapid actions |

## Performance

### Frontend Optimization
- Server-side rendering (SSR)
- Static page generation (SSG) where possible
- Image optimization with Next.js Image
- Code splitting per route
- Lazy loading components
- Dynamic imports

### Backend Optimization
- Database indexes (200+)
- Query optimization with EXPLAIN
- Connection pooling (PgBouncer)
- Materialized views for complex queries
- Efficient RLS policies

### Monitoring
- Vercel Analytics (Core Web Vitals)
- Supabase Dashboard metrics
- Error logging (console + Supabase)
- Performance monitoring

## Development Workflow

### Local Development
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # TypeScript validation
```

### Environment Variables
```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Server-side only
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Database Migrations
- Sequential SQL migrations (001-043)
- Execute in Supabase SQL Editor
- Version controlled in repository
- Each migration is idempotent

## File Structure

```
frontend/src/
├── app/                    # 58 pages (App Router)
│   ├── admin/              # 13 admin pages
│   ├── elections/          # 6 election pages
│   ├── candidates/         # 3 candidate pages
│   ├── promises/           # Promise pages
│   ├── politicians/        # Politician pages
│   ├── compare/            # Comparison tool
│   └── api/                # API routes
├── components/             # 60+ components
│   ├── ui/                 # shadcn/ui (20+)
│   ├── admin/              # Admin components
│   ├── elections/          # Election components
│   ├── candidates/         # Candidate components
│   ├── comparison/         # Comparison tool
│   ├── notifications/      # Notification system
│   ├── sharing/            # Social sharing
│   └── timeline/           # Timeline components
├── hooks/                  # 6 custom hooks
├── lib/                    # 27 utility files
├── store/                  # State management
└── types/                  # TypeScript types
```

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## System Requirements

### Development
- Node.js 18 or higher
- npm 9 or higher
- 4GB RAM recommended
- VS Code with ESLint/Prettier extensions

### Production
- Vercel account (free tier available)
- Supabase account (free tier: 500MB database)
- Custom domain (optional)

## Scalability

### Current Capacity
- Database: Unlimited rows (Supabase managed)
- Storage: 1GB free, scales with plan
- API requests: 2M/month free tier
- Concurrent users: Auto-scales

### Future Considerations
- Database read replicas for high traffic
- Redis for caching (response times)
- CDN for static assets (already via Vercel)
- Queue system for async tasks (email, notifications)

## Future Technology Additions

### Planned
- Redis for caching
- Bull/BullMQ for job queues
- ElasticSearch for advanced search
- Machine learning for fraud detection

### Under Consideration
- React Native for mobile app
- Progressive Web App (PWA)
- GraphQL API layer
- WebSocket for real-time features

## License

This technology stack documentation is part of the Political Accountability Platform project, licensed under the MIT License.
