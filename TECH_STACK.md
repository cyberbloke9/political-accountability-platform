# Technology Stack

## Architecture Overview

```
Frontend (Vercel)                    Backend (Supabase)
┌─────────────────────┐              ┌──────────────────┐
│ Next.js 14          │◄────────────►│ PostgreSQL       │
│ React 18            │   REST API   │ Auth (JWT)       │
│ TypeScript          │              │ Storage          │
│ Tailwind CSS        │              │ RLS Policies     │
└─────────────────────┘              └──────────────────┘
```

Architecture Pattern: Jamstack (JavaScript, APIs, Markup)

## Frontend

### Core
- Next.js 14 with App Router
- React 18 with Server Components
- TypeScript 5
- Tailwind CSS 3

### UI Components
- shadcn/ui component library
- Radix UI primitives
- Lucide React icons
- Custom components

### State Management
- React Hooks (useState, useEffect, useContext)
- Context API for global state
- No external state management library

### Forms and Validation
- React Hook Form
- Zod schema validation
- Client-side and server-side validation

### Routing
- Next.js App Router (file-based routing)
- Dynamic routes
- Protected routes with middleware
- Server and client components

## Backend

### Database
- PostgreSQL (via Supabase)
- Row-Level Security (RLS) policies
- Triggers and functions
- Full-text search
- JSON support

### Authentication
- Supabase Auth
- JWT tokens
- Email/password authentication
- Session management
- Protected API routes

### Storage
- Supabase Storage
- Image upload for promises and verifications
- Presigned URLs for secure access
- File validation and limits

### API
- REST API via Supabase JS client
- Server-side API routes (Next.js)
- Real-time subscriptions
- Automatic API generation from database schema

## Database Schema

### Core Tables
- users: User profiles and authentication
- promises: Political promises tracking
- verifications: Evidence submissions
- votes: Community voting records
- evidence_files: File attachments
- activity_logs: User activity tracking

### Admin Tables
- admin_roles: Admin role definitions
- user_admin_roles: User-to-role assignments
- moderation_actions: Admin action log
- fraud_reports: Fraud detection results
- vote_patterns: Voting pattern analysis
- reputation_history: Reputation score changes

### Security Tables
- user_flags: Suspicious account flags
- vote_brigade_patterns: Coordinated voting detection
- user_trust_levels: Trust level assignments

## Deployment

### Frontend Hosting
- Platform: Vercel
- Automatic deployments from GitHub
- Preview deployments for pull requests
- Global CDN distribution
- Custom domain support

### Backend Hosting
- Platform: Supabase Cloud
- Managed PostgreSQL database
- Automatic backups
- Connection pooling
- Geographic regions

### Domain and SSL
- Custom domain: political-accountability.in
- Automatic SSL certificates
- HTTPS enforcement

## Development Tools

### Code Quality
- ESLint for linting
- Prettier for formatting
- TypeScript for type safety
- Husky for git hooks (optional)

### Version Control
- Git for source control
- GitHub for repository hosting
- Branch protection rules
- Pull request reviews

### Package Management
- npm for dependency management
- package.json for dependencies
- package-lock.json for version locking

## Security

### Authentication
- Supabase Auth with bcrypt
- JWT tokens with expiration
- Secure session management
- Password reset flow

### Authorization
- Row-Level Security policies
- Role-based access control
- Admin permission system
- Protected API routes

### Data Protection
- HTTPS/SSL encryption
- Encrypted database connections
- Secure environment variables
- No sensitive data in client code

### Anti-Gaming
- Self-verification detection
- Vote brigade detection
- Sybil attack prevention
- Fraud pattern analysis
- Trust level system
- Weighted scoring

## Performance

### Frontend Optimization
- Server-side rendering
- Static page generation where possible
- Image optimization with Next.js Image
- Code splitting
- Lazy loading

### Backend Optimization
- Database indexes
- Query optimization
- Connection pooling
- Caching strategies

### Monitoring
- Vercel Analytics
- Supabase Dashboard metrics
- Error logging
- Performance monitoring

## Development Workflow

### Local Development
```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run linter
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Database Migrations
- Sequential SQL migrations
- Manual execution in Supabase SQL Editor
- Version controlled in repository
- Migration documentation in README

## Dependencies

### Core Dependencies
- next: 14.x
- react: 18.x
- typescript: 5.x
- @supabase/supabase-js: Latest
- tailwindcss: 3.x

### UI Dependencies
- @radix-ui/react-*: Various components
- lucide-react: Icons
- class-variance-authority: Component variants
- tailwind-merge: Tailwind utility merging

### Form Dependencies
- react-hook-form: Form management
- @hookform/resolvers: Validation resolvers
- zod: Schema validation

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
- 2GB RAM minimum
- Modern code editor (VS Code recommended)

### Production
- Vercel account (free tier available)
- Supabase account (free tier available)
- Custom domain (optional)

## Scalability

### Current Capacity
- Database: Unlimited (Supabase managed)
- Storage: Configurable per plan
- API requests: Rate-limited per plan
- Concurrent users: Scales automatically

### Future Considerations
- Database read replicas
- CDN for static assets
- Redis for caching
- Queue system for async tasks
- Microservices architecture (if needed)

## Future Technology Additions

### Planned
- Redis for caching
- Bull for job queues
- Socket.io for real-time features
- ElasticSearch for advanced search
- Machine learning for fraud detection

### Under Consideration
- React Native for mobile app
- Progressive Web App (PWA)
- GraphQL API
- Serverless functions
- Message queue system

## License

This technology stack documentation is part of the Political Accountability Platform project, licensed under the MIT License.
