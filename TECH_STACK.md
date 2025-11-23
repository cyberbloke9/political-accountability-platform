# Technology Stack

Complete technical overview of the Political Accountability Platform.

## Frontend

### Core Framework
- **Next.js 14.2.33** - React framework with App Router
- **React 18** - UI library
- **TypeScript 5.x** - Type-safe JavaScript

### Styling & UI
- **Tailwind CSS 3.x** - Utility-first CSS framework
- **shadcn/ui** - Accessible component library built on Radix UI
  - Alert Dialog
  - Badge
  - Button
  - Card
  - Checkbox
  - Dialog
  - Dropdown Menu
  - Input
  - Label
  - Select
  - Separator
  - Switch
  - Textarea
  - Toast/Toaster
- **Lucide React** - Icon library
- **class-variance-authority** - Component variant management
- **clsx** - Conditional className utility
- **tailwind-merge** - Merge Tailwind classes

### Forms & Validation
- **React Hook Form 7.x** - Performant form library
- **Zod** - TypeScript-first schema validation
- **@hookform/resolvers** - Form validation resolvers

### State Management
- **React Context API** - Global state
- **React Hooks** - Local state (useState, useEffect, etc.)
- Custom hooks for:
  - Authentication (`useAuth`)
  - Admin permissions (`useAdmin`)
  - Toast notifications (`useToast`)

### Data Fetching
- **Supabase Client** - Real-time database queries
- **Server Components** - Next.js 14 server-side data fetching
- Custom API utilities in `/lib`:
  - `adminActions.ts` - Admin audit log
  - `adminAuth.ts` - Admin authentication
  - `autoApproval.ts` - Auto-approval system
  - `banManagement.ts` - Ban & appeals
  - `fraudDetection.ts` - Fraud detection
  - `reputationEngine.ts` - Reputation scoring
  - `searchPromises.ts` - Promise search
  - `votePatterns.ts` - Vote pattern analysis

## Backend

### Database
- **PostgreSQL 15+** - Relational database (via Supabase)
- **Supabase** - Backend-as-a-Service platform
  - Database hosting
  - Row Level Security (RLS)
  - Database functions
  - Triggers
  - Real-time subscriptions

### Authentication
- **Supabase Auth** - Authentication service
  - Email/password authentication
  - Email verification
  - Session management
  - JWT tokens
  - Row Level Security integration

### Storage
- **Supabase Storage** - File storage (prepared for future use)
  - Image uploads
  - Document storage
  - Public/private buckets

### Edge Functions
- **Supabase Edge Functions** (Deno runtime)
  - `calculate-citizen-score` - Reputation calculation
  - `fraud-detection` - Fraud analysis
  - Serverless function execution

## Database Schema

### Core Tables
```sql
users                    -- User accounts & profiles
politicians              -- Politicians being tracked
promises                 -- Political promises
verifications            -- Promise verifications
promise_votes            -- Votes on promises
verification_votes       -- Votes on verifications
```

### Admin & Moderation
```sql
admin_roles              -- Role definitions (Reviewer, Moderator, SuperAdmin)
admin_permissions        -- Permission mappings
user_roles               -- User role assignments
admin_actions            -- Complete audit trail
fraud_flags              -- Fraud detection flags
vote_patterns            -- Voting pattern analysis
reputation_rules         -- Reputation system config
reputation_history       -- Reputation change log
auto_approval_rules      -- Auto-approval config
auto_approval_log        -- Auto-approval decisions
bans                     -- User bans
ban_appeals              -- Ban appeal requests
```

### Supporting Tables
```sql
notifications            -- In-app notifications
```

## Database Features

### Functions
- `calculate_citizen_score()` - Reputation calculation
- `check_fraud()` - Fraud detection
- `analyze_vote_patterns()` - Vote pattern analysis
- `check_auto_approval()` - Auto-approval trigger
- `expire_temporary_bans()` - Ban expiry
- `ban_user()` - Issue ban
- `unban_user()` - Remove ban
- `is_user_banned()` - Check ban status

### Triggers
- `trigger_calculate_score` - Auto-calculate reputation
- `trigger_fraud_detection` - Auto-detect fraud
- `trigger_vote_patterns` - Auto-analyze votes
- `trigger_check_auto_approval` - Auto-approve verifications
- `trigger_update_reputation_history` - Log reputation changes

### Row Level Security (RLS)
All tables have RLS policies for:
- Public read access (where appropriate)
- Authenticated write access
- Admin-only access for moderation
- User-specific data access

## Infrastructure

### Hosting
- **Vercel** - Frontend hosting & deployment
  - Automatic deployments from GitHub
  - Edge network (CDN)
  - Serverless functions
  - Environment variables
  - Preview deployments

### Version Control
- **Git** - Version control
- **GitHub** - Code hosting
  - GitHub Actions for CI/CD
  - Pull request workflows
  - Issue tracking

### Monitoring & Analytics
- **Vercel Analytics** - Web vitals tracking
- **Supabase Dashboard** - Database monitoring
- **Error Logging** - Console errors in development

## Development Tools

### Package Manager
- **npm 9+** - Package management

### Code Quality
- **ESLint** - JavaScript linting
  - Next.js recommended rules
  - TypeScript ESLint
  - React hooks rules
- **Prettier** (via ESLint) - Code formatting
- **TypeScript** - Type checking

### Build Tools
- **Next.js Compiler** - Fast builds with SWC
- **Turbopack** (optional) - Next-gen bundler
- **PostCSS** - CSS processing
- **Autoprefixer** - Browser compatibility

## Security

### Authentication Security
- **Bcrypt** - Password hashing (via Supabase)
- **JWT** - Session tokens
- **Email Verification** - Required for new accounts
- **Secure Cookies** - HttpOnly, Secure, SameSite

### Database Security
- **Row Level Security** - Table-level access control
- **Prepared Statements** - SQL injection prevention
- **Connection Pooling** - PgBouncer (via Supabase)
- **SSL/TLS** - Encrypted connections

### Application Security
- **HTTPS/SSL** - Encrypted data transmission
- **CSRF Protection** - Cross-site request forgery prevention
- **XSS Prevention** - Content Security Policy
- **Rate Limiting** - API abuse prevention (via Supabase)
- **Input Validation** - Zod schema validation

## Performance

### Frontend Optimization
- **Server Components** - Reduce client JavaScript
- **Static Generation** - Pre-render pages where possible
- **Image Optimization** - Next.js Image component
- **Code Splitting** - Automatic by Next.js
- **Tree Shaking** - Remove unused code
- **Minification** - Compress JavaScript/CSS

### Database Optimization
- **Indexes** - All foreign keys and commonly queried columns
- **Connection Pooling** - PgBouncer
- **Query Optimization** - Efficient SQL queries
- **Materialized Views** (future) - Pre-computed aggregates

### Caching
- **Next.js Cache** - ISR (Incremental Static Regeneration)
- **Browser Cache** - Static assets
- **Supabase Cache** - Database query cache

## API Integrations

### Current
- **Supabase API** - Database & auth operations
- **Vercel API** - Deployment automation

### Future
- **Email Service** (SendGrid/Resend) - Transactional emails
- **SMS Service** (Twilio) - OTP verification
- **Cloud Storage** (S3/R2) - Media hosting
- **CDN** (Cloudflare) - Asset delivery

## Development Workflow

### Local Development
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # TypeScript validation
```

### Git Workflow
1. Feature branch from `main`
2. Develop & test locally
3. Commit with descriptive messages
4. Push to GitHub
5. Create pull request
6. Review & merge
7. Auto-deploy to Vercel

### Deployment
- **Staging**: Preview deployments on Vercel (per PR)
- **Production**: Automatic deployment from `main` branch
- **Database**: Manual migrations via Supabase SQL Editor

## Environment Variables

### Required
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional (future)
SENDGRID_API_KEY=your_sendgrid_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

## Dependencies Overview

### Production Dependencies
```json
{
  "@hookform/resolvers": "Form validation",
  "@radix-ui/*": "Accessible UI primitives",
  "@supabase/ssr": "Server-side Supabase",
  "@supabase/supabase-js": "Supabase client",
  "class-variance-authority": "Component variants",
  "clsx": "Conditional classes",
  "lucide-react": "Icons",
  "next": "React framework",
  "react": "UI library",
  "react-dom": "React renderer",
  "react-hook-form": "Forms",
  "tailwind-merge": "Tailwind utilities",
  "tailwindcss-animate": "Animations",
  "zod": "Schema validation"
}
```

### Development Dependencies
```json
{
  "@types/node": "Node.js types",
  "@types/react": "React types",
  "@types/react-dom": "React DOM types",
  "eslint": "Linting",
  "eslint-config-next": "Next.js ESLint",
  "postcss": "CSS processing",
  "tailwindcss": "CSS framework",
  "typescript": "Type checking"
}
```

## Browser Support

- **Chrome/Edge**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Mobile**: iOS Safari 14+, Chrome Android 90+

## Accessibility

- **WCAG 2.1 Level AA** compliance target
- **Semantic HTML** - Proper heading hierarchy
- **ARIA Labels** - Screen reader support
- **Keyboard Navigation** - Full keyboard accessibility
- **Focus Management** - Clear focus indicators
- **Color Contrast** - Meets WCAG standards

## Performance Targets

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Lighthouse Score**: > 90
- **Core Web Vitals**: All green

## Future Considerations

### Planned Additions
- **Redis** - Session storage & caching
- **Elasticsearch** - Advanced search
- **WebSockets** - Real-time notifications
- **GraphQL** - Flexible API layer
- **Docker** - Containerization
- **Kubernetes** - Orchestration (if needed)

### Scaling Strategy
- **Horizontal Scaling**: Add more Vercel instances
- **Database Scaling**: Supabase Pro plan with read replicas
- **CDN**: Cloudflare for static assets
- **Load Balancing**: Vercel automatic load balancing

---

**Last Updated**: November 2025
**Version**: 1.0.0 (Phase 8 Complete)
