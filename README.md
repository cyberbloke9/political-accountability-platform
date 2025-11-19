# Political Accountability Platform

A citizen-driven platform to track political promises with multi-dimensional community verification and gamification for transparent political accountability across India.

## Overview

This platform enables citizens to:
- Track political promises made by elected officials
- Submit verifications with evidence (images, videos)
- Vote on verification accuracy with weighted community consensus
- Earn citizen scores and titles through quality contributions
- Discover promises via search, filtering, and categorization
- View leaderboards showcasing top contributors

## Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with Shadcn/ui components
- **State Management:** Zustand + React Query
- **Validation:** Zod

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js 4.x
- **Language:** TypeScript
- **Database:** PostgreSQL 15+ with Prisma ORM
- **Authentication:** JWT with optional TOTP MFA
- **Storage:** Cloudflare R2
- **Email:** SendGrid
- **Fraud Detection:** Google Cloud Vision API

## Project Structure

```
political-accountability-platform/
├── frontend/          # Next.js application
├── backend/           # Express.js API server
├── docs/             # Documentation and diagrams
├── api/              # OpenAPI specifications
├── config/           # Shared configuration
└── scripts/          # Utility scripts
```

## Getting Started

### Prerequisites

- Node.js 20+ and npm 10+
- PostgreSQL 15+
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd political-accountability-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy example files
cp .env.example .env
cp frontend/.env.local.example frontend/.env.local
cp backend/.env.example backend/.env
```

4. Configure your database connection in `backend/.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/political_accountability_db
```

5. Run database migrations:
```bash
cd backend
npm run db:migrate
```

### Development

Run both frontend and backend concurrently:
```bash
npm run dev
```

Or run them separately:
```bash
# Terminal 1 - Frontend (http://localhost:3000)
npm run dev:frontend

# Terminal 2 - Backend (http://localhost:3001)
npm run dev:backend
```

### Building for Production

```bash
npm run build
```

## Key Features

### Promise Tracking
- Submit political promises with metadata (politician, party, date, location)
- Categorize promises (infrastructure, healthcare, education, etc.)
- Track promise status (pending, in-progress, fulfilled, broken)

### Verification System
- Three-stage verification: submission → community review → expert panel (post-MVP)
- Multi-dimensional ratings: completion, quality, timeline, budget, impact
- Evidence upload with automatic compression and fraud detection

### Citizen Scoring
- Earn points for quality contributions
- Progress through titles: Citizen → Watchdog → Guardian → Champion → Sentinel
- Weighted voting power based on reputation
- Anti-gaming mechanisms and fraud detection

### Security
- Argon2 password hashing
- JWT tokens (15-min access, 7-day refresh)
- Email verification required
- Optional TOTP MFA for high-reputation users
- Rate limiting and IP-based abuse prevention

## Architecture

See `docs/diagrams/` for:
- Component architecture diagram
- Database ERD
- Authentication flow sequence
- Verification workflow

## API Documentation

OpenAPI specification: `api/openapi.yaml`

View with Swagger UI or import into Postman.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](./LICENSE)

## Cost Projections

**10K Active Users:** ~$100-200/month
- PostgreSQL: $25
- Cloudflare R2: $15
- SendGrid: $15
- Google Vision API: $50
- Domain: $2

## Roadmap

- **Phase 1 (Months 1-3):** MVP with core features
- **Phase 2 (Months 4-6):** Hindi UI, mobile optimization
- **Phase 3 (Months 7-12):** Expert panel, advanced analytics
- **Phase 4 (Year 2+):** International expansion

## Support

For issues and questions, please use the GitHub issue tracker.

---

**Built with the mission to bring transparency and accountability to political promises across India.**
