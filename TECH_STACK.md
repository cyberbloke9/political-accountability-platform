# Political Accountability Platform - Technology Stack

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Frontend Stack](#frontend-stack)
3. [Backend Stack](#backend-stack)
4. [Database](#database)
5. [Authentication](#authentication)
6. [Deployment & Hosting](#deployment--hosting)
7. [Development Tools](#development-tools)
8. [Third-Party Services](#third-party-services)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Vercel)                    │
│  Next.js 14 + React 18 + TypeScript + Tailwind CSS         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS/REST API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Backend (Supabase)                        │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │   PostgreSQL   │  │   Auth System  │  │   Storage    │  │
│  │   Database     │  │   (JWT)        │  │   (Files)    │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Row-Level Security (RLS) + Functions + Triggers     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Architecture Pattern:** Jamstack (JavaScript, APIs, Markup)
- **Frontend:** Server-side rendered React with Next.js
- **Backend:** Serverless Supabase (PostgreSQL + Auth + Storage)
- **State Management:** React Hooks + Context API
- **Communication:** REST API (Supabase JS Client)

---

## Frontend Stack

### Core Framework

#### **Next.js 14** (App Router)
- **Why Next.js?**
  - Server-side rendering (SSR) for SEO and performance
  - App Router for modern routing paradigm
  - Built-in image optimization
  - API routes for backend logic
  - Automatic code splitting
  - Fast refresh for development

- **Key Features Used:**
  - Dynamic routes: `/promises/[id]`, `/verifications/[id]`, `/profile/[username]`
  - Server components for static content
  - Client components for interactive features
  - Metadata API for SEO optimization
  - Loading states and error boundaries

#### **React 18**
- **Why React?**
  - Component-based architecture
  - Virtual DOM for performance
  - Large ecosystem of libraries
  - Strong TypeScript support

- **React Features Used:**
  - Hooks (useState, useEffect, useContext, custom hooks)
  - Context API for global state (auth, theme)
  - Suspense for data fetching
  - Error boundaries for error handling

#### **TypeScript 5**
- **Why TypeScript?**
  - Type safety prevents runtime errors
  - Better IDE autocomplete and intellisense
  - Self-documenting code
  - Easier refactoring

- **TypeScript Features:**
  - Interface definitions for props and data
  - Strict null checks
  - Type inference
  - Generic components

### Styling

#### **Tailwind CSS 3**
- **Why Tailwind?**
  - Utility-first CSS for rapid development
  - Consistent design system
  - Small bundle size (purges unused styles)
  - Responsive design built-in
  - Dark mode support

- **Configuration:**
  ```javascript
  // tailwind.config.js
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        destructive: '#ef4444'
      }
    }
  }
  ```

#### **shadcn/ui**
- **Why shadcn/ui?**
  - Pre-built accessible components
  - Customizable with Tailwind
  - Radix UI primitives for accessibility
  - Copy-paste components (not NPM dependency)

- **Components Used:**
  - Button, Card, Badge, Avatar
  - Dialog, Dropdown, Tabs, Select
  - Input, Textarea, Checkbox
  - Toast notifications
  - Sheet, Separator

### UI Libraries

#### **Lucide React** (Icons)
- Over 1000+ consistent icons
- Tree-shakeable (only import used icons)
- Customizable size and color
- Examples: Shield, ThumbsUp, AlertTriangle, User

#### **date-fns** (Date Formatting)
- Lightweight date utility library
- Immutable and pure functions
- Tree-shakeable
- Used for: `format(date, 'MMM d, yyyy')`

#### **Sonner** (Toast Notifications)
- Beautiful toast notifications
- Easy to use API
- Automatic stacking and queuing
- Used for: `toast.success()`, `toast.error()`

---

## Backend Stack

### **Supabase** (Backend-as-a-Service)

#### **Why Supabase?**
- Open-source Firebase alternative
- PostgreSQL database (not NoSQL)
- Real-time subscriptions
- Built-in authentication
- Row-Level Security (RLS)
- Auto-generated REST API
- File storage
- Edge functions (serverless)

#### **Supabase Features Used:**

##### 1. **PostgreSQL Database**
- Relational database with ACID compliance
- Complex joins and queries
- Foreign key constraints
- Triggers and functions
- Full-text search capability

##### 2. **Row-Level Security (RLS)**
```sql
-- Example: Users can only edit their own data
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = auth_id);

-- Example: Everyone can read approved promises
CREATE POLICY "Public read approved promises"
ON promises FOR SELECT
USING (status = 'approved');
```

##### 3. **Database Functions (RPC)**
```sql
-- Calculate trust level dynamically
CREATE OR REPLACE FUNCTION calculate_trust_level(p_user_id UUID)
RETURNS TEXT AS $$
  -- Logic to determine trust level
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

##### 4. **Triggers**
```sql
-- Auto-update timestamps
CREATE TRIGGER update_updated_at
BEFORE UPDATE ON verifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

##### 5. **Real-time Subscriptions** (Future)
```typescript
// Listen to new verifications in real-time
supabase
  .channel('verifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'verifications'
  }, payload => {
    // Update UI with new verification
  })
  .subscribe()
```

---

## Database

### **PostgreSQL 15** (via Supabase)

#### Database Schema (15 migrations)

##### **Core Tables:**
1. **users** - User profiles and authentication
2. **promises** - Political promises tracking
3. **verifications** - Evidence submissions
4. **votes** - Community voting records
5. **tags** - Promise categorization
6. **promise_tags** - Many-to-many relationship

##### **Admin Tables:**
7. **admin_roles** - Role definitions (Reviewer, Moderator, SuperAdmin)
8. **admin_role_permissions** - Permission mappings
9. **user_admin_roles** - User-role assignments
10. **audit_log** - Public transparency log

##### **Anti-Gaming Tables:**
11. **user_activity_flags** - Sybil attack and fraud flags
12. **verification_relationships** - Track self-verifications
13. **vote_patterns** - Coordinated voting detection

##### **Reputation Tables:**
14. **reputation_history** - Point change tracking
15. **notifications** - User notification system

#### Key Database Features:

##### **Indexes for Performance:**
```sql
CREATE INDEX idx_promises_politician ON promises(politician_name);
CREATE INDEX idx_verifications_promise ON verifications(promise_id);
CREATE INDEX idx_votes_verification ON votes(verification_id);
CREATE INDEX idx_users_trust_level ON users(trust_level);
```

##### **Views for Reporting:**
```sql
-- Leaderboard view
CREATE VIEW leaderboard AS
SELECT
  username,
  citizen_score,
  trust_level,
  ROW_NUMBER() OVER (ORDER BY citizen_score DESC) as rank
FROM users
WHERE citizen_score > 0
ORDER BY citizen_score DESC;
```

##### **Materialized Views** (Future for Analytics):
```sql
CREATE MATERIALIZED VIEW promise_stats AS
SELECT
  politician_name,
  COUNT(*) as total_promises,
  COUNT(*) FILTER (WHERE verdict = 'fulfilled') as fulfilled,
  COUNT(*) FILTER (WHERE verdict = 'broken') as broken
FROM promises
GROUP BY politician_name;
```

---

## Authentication

### **Supabase Auth**

#### **Features:**
- JWT-based authentication
- Email/password login
- OAuth providers (Google, GitHub - future)
- Email verification
- Password reset
- Session management

#### **Security:**
- bcrypt password hashing
- Secure JWT signing
- Automatic token refresh
- PKCE flow for OAuth

#### **Custom Auth Flow:**
```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    data: {
      username: 'johndoe'
    }
  }
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
})

// Sign out
await supabase.auth.signOut()
```

#### **Row-Level Security Integration:**
```sql
-- Get current user's ID in RLS policies
auth.uid()

-- Example: User can only vote once per verification
CREATE POLICY "One vote per user per verification"
ON votes FOR INSERT
WITH CHECK (
  user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  AND NOT EXISTS (
    SELECT 1 FROM votes v2
    WHERE v2.verification_id = votes.verification_id
    AND v2.user_id = votes.user_id
  )
);
```

---

## Deployment & Hosting

### **Vercel** (Frontend Hosting)

#### **Why Vercel?**
- Built by Next.js creators
- Zero-config deployments
- Automatic HTTPS
- Global CDN
- Serverless functions
- Preview deployments for PRs
- Environment variable management

#### **Deployment Flow:**
```
Git Push → GitHub → Vercel Webhook → Build → Deploy → Live
```

#### **Build Configuration:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

#### **Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### **Supabase** (Backend Hosting)

#### **Infrastructure:**
- AWS infrastructure
- PostgreSQL on dedicated compute
- Edge functions on Deno Deploy
- Global CDN for assets
- Automatic backups
- Point-in-time recovery

#### **Regions:**
- Database: AWS us-east-1 (or chosen region)
- Edge Functions: Cloudflare Workers (global)

---

## Development Tools

### **Version Control**
- **Git** for source control
- **GitHub** for repository hosting
- **Conventional Commits** for commit messages

### **Code Quality**
- **ESLint** for JavaScript/TypeScript linting
- **Prettier** for code formatting (future)
- **TypeScript compiler** for type checking

### **Package Manager**
- **npm** for dependency management
- **package-lock.json** for deterministic builds

### **Development Environment**
- **Node.js 18+** runtime
- **VS Code** recommended IDE
- **WSL** for Windows development

### **Build Tools**
- **Next.js compiler** (SWC) for fast builds
- **Webpack 5** (via Next.js)
- **PostCSS** for Tailwind processing

---

## Third-Party Services

### **Current:**
1. **Supabase** - Backend, database, auth, storage
2. **Vercel** - Frontend hosting and deployment
3. **GitHub** - Version control and CI/CD

### **Planned (Future Phases):**
1. **Sentry** - Error tracking and monitoring
2. **Google Analytics** - Usage analytics (privacy-focused)
3. **Cloudflare** - DDoS protection and caching
4. **SendGrid/Resend** - Email notifications
5. **NewsAPI** - Fact-checking integrations

---

## Performance Optimizations

### **Frontend:**
- Server-side rendering for initial page load
- Code splitting by route
- Image optimization with Next.js Image
- Lazy loading for below-the-fold content
- Static generation for public pages

### **Database:**
- Indexes on frequently queried columns
- Connection pooling (Supabase default)
- Query optimization with EXPLAIN ANALYZE
- Pagination for large datasets
- Materialized views for complex reports

### **Caching:**
- Vercel Edge Network caching
- Browser caching for static assets
- Stale-while-revalidate strategy

---

## Security Stack

### **Frontend Security:**
- Content Security Policy (CSP) headers
- XSS prevention (React escapes by default)
- CSRF protection (Supabase JWT)
- Input sanitization
- Rate limiting on forms

### **Backend Security:**
- Row-Level Security (RLS)
- SQL injection prevention (parameterized queries)
- JWT authentication
- HTTPS only
- Environment variable secrets
- Database backups

### **Data Security:**
- Encrypted at rest (Supabase)
- Encrypted in transit (HTTPS/TLS)
- Password hashing (bcrypt)
- Sensitive data never logged

---

## Monitoring & Observability

### **Current:**
- Vercel Analytics (basic metrics)
- Supabase Dashboard (database metrics)
- Browser console (development)

### **Planned:**
- Sentry for error tracking
- Custom logging system
- Performance monitoring
- Uptime monitoring
- API response time tracking

---

## Development Workflow

### **Local Development:**
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run type checking
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

### **Git Workflow:**
```bash
# Feature development
git checkout -b feature/new-feature
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Create PR → Review → Merge → Deploy
```

### **Database Migrations:**
```bash
# Run migration in Supabase SQL Editor
-- File: database/migrations/016_new_feature.sql

# Test in development environment
# Deploy to production via SQL Editor
```

---

## Technology Choices Rationale

### **Why Next.js over Create React App?**
- Better SEO with SSR
- Built-in routing
- Image optimization
- API routes
- Better performance

### **Why Supabase over Firebase?**
- PostgreSQL (relational) vs Firestore (NoSQL)
- Open-source and self-hostable
- SQL for complex queries
- Better pricing model
- RLS for security

### **Why Tailwind over CSS-in-JS?**
- Faster build times
- Smaller bundle size
- Utility-first approach
- Better for rapid prototyping
- Consistent design system

### **Why TypeScript over JavaScript?**
- Catch errors at compile time
- Better IDE support
- Self-documenting code
- Easier to refactor
- Industry standard

---

## Future Technology Additions

### **Planned:**
1. **React Query** - Better data fetching and caching
2. **Zod** - Runtime type validation for forms
3. **Playwright** - End-to-end testing
4. **Vitest** - Unit and integration testing
5. **Storybook** - Component documentation
6. **OpenAI API** - AI-powered features
7. **Redis** - Caching layer for high traffic

---

## Bundle Size & Performance

### **Current Metrics:**
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: 90+ (Performance)
- **Bundle Size**: ~200KB (gzipped)

### **Optimization Strategies:**
- Tree shaking unused code
- Dynamic imports for routes
- Image optimization (WebP, AVIF)
- Font optimization (variable fonts)
- CSS purging (Tailwind)

---

## Scalability

### **Current Capacity:**
- **Database**: 500GB storage, 50 concurrent connections
- **API**: 500k requests/month (Supabase free tier)
- **Bandwidth**: Unlimited (Vercel)

### **Scaling Strategy:**
- **Horizontal**: Multiple Supabase instances
- **Vertical**: Upgrade database compute
- **Caching**: Redis for hot data
- **CDN**: Cloudflare for global distribution
- **Read Replicas**: For analytics queries

---

## Developer Experience (DX)

### **Fast Feedback Loops:**
- Hot module replacement (< 1s refresh)
- TypeScript errors in IDE
- ESLint warnings on save
- Automatic formatting

### **Documentation:**
- Inline JSDoc comments
- README for setup
- This TECH_STACK.md
- Code examples in comments

### **Tooling:**
- VS Code extensions (ESLint, Tailwind Intellisense)
- GitHub Copilot support
- Supabase Studio for database management

---

## Cost Analysis

### **Monthly Costs (Free Tier):**
- **Vercel**: $0 (Hobby plan)
- **Supabase**: $0 (Free tier: 500MB database, 50k auth users)
- **GitHub**: $0 (Public repository)
- **Total**: $0/month

### **Monthly Costs (Production - Estimated):**
- **Vercel Pro**: $20/month
- **Supabase Pro**: $25/month
- **Sentry**: $26/month (errors)
- **Sendgrid**: $15/month (email)
- **Total**: ~$86/month

### **Scaling Costs (10,000 users):**
- **Vercel Pro**: $20/month (unlimited)
- **Supabase Team**: $599/month (2GB database)
- **Monitoring**: $50/month
- **CDN**: $100/month
- **Total**: ~$769/month

---

**Last Updated:** November 27, 2025
