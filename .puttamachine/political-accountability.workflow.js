/**
 * Political Accountability Platform - Development Workflow
 *
 * This workflow builds a citizen-driven platform to hold political leaders accountable
 * by tracking and verifying their public promises.
 */

import {
  resolveUI,
  resolveModule,
  resolveStep,
  resolveFolder,
  skip,
} from '../config/modules.js';

/**
 * PROJECT SPECIFICATION
 */
const PROJECT_SPEC = `
# Political Accountability Platform

## Overview
A citizen-driven platform to hold political leaders accountable by tracking their public promises
made during campaigns, not just what's in manifestos.

## Core Features

### 1. Promise Tracking
- Leaders can post promises with categories (Infrastructure, Education, Healthcare, etc.)
- Citizens can submit promises they heard during campaigns
- Each promise has: Title, Description, Category, Timeline, Location (if applicable)

### 2. Verification System
- Multi-level verification process to combat the "verification minefield"
- Citizen reports with evidence (photos, documents, news articles)
- Community voting on verification status
- Expert panel review for complex promises
- Quality metrics (not just completion status)

### 3. Gamification - Citizen Score
- Users earn points for verified contributions
- Titles: "Active Citizen" (0-100), "Responsible Citizen" (100-500), "Guardian" (500-1000), etc.
- Leaderboards by region
- Special privileges for high-scoring citizens

### 4. Quality Assessment Framework
For the "verification minefield" problem:
- Binary completion isn't enough (e.g., road built but poor quality)
- Multi-dimensional scoring:
  * Completion Status: Not Started, In Progress, Completed, Abandoned
  * Quality Rating: 1-5 stars (citizen ratings)
  * Timeline Adherence: On Time, Delayed, Completed Late
  * Budget Utilization: Under Budget, On Budget, Over Budget
  * Impact Assessment: Citizen feedback on actual benefit

### 5. Evidence-Based Reporting
- Photo uploads with geo-tagging
- Document attachments
- News article links
- Video evidence
- Expert testimony

### 6. Transparency Dashboard
- Public view of all promises and their status
- Analytics: Fulfillment rate, timeline performance, budget accuracy
- Regional comparisons
- Leader performance scores

## Tech Stack
- Frontend: React/Next.js (progressive web app)
- Backend: Node.js/Express
- Database: PostgreSQL (promises, users) + MongoDB (evidence files)
- Authentication: JWT with email verification
- Storage: Cloud storage for media (AWS S3/Cloudflare R3)
- Maps: Google Maps API for geo-tagging

## Key Challenges to Solve

### The Verification Minefield
1. **Subjective Quality**: How do we measure "quality" objectively?
   - Solution: Combination of citizen ratings + expert reviews + documented standards

2. **Partial Fulfillment**: Promise kept but not as intended
   - Solution: Progress tracking with milestones, not just binary complete/incomplete

3. **False Reports**: Malicious users posting fake evidence
   - Solution: Multi-level verification, reputation system, expert panel

4. **Political Bias**: Users rating based on party affiliation, not facts
   - Solution: Anonymous voting, require evidence, weight votes by citizen score

## Minimum Viable Product (MVP)
1. User registration and authentication
2. Promise submission and listing
3. Basic verification with photo upload
4. Simple citizen scoring system
5. Public dashboard with promise status
`;

export default [
  /**
   * PHASE 1: ARCHITECTURE & PLANNING
   */
  resolveStep('founder-architect', `
    You are the Founder Architect. Analyze this project specification and create:

    ${PROJECT_SPEC}

    1. High-level system architecture
    2. Database schema design (PostgreSQL + MongoDB)
    3. API endpoint structure
    4. Authentication & authorization strategy
    5. File storage architecture
    6. Scalability considerations

    Create these files:
    - docs/architecture.md (system overview)
    - docs/database-schema.md (detailed schema)
    - docs/api-design.md (REST API endpoints)
    - docs/security-strategy.md (auth, data protection)
  `),

  resolveStep('structural-data-architect', `
    Based on the project specification, design the data structures:

    ${PROJECT_SPEC}

    1. PostgreSQL schema for:
       - Users table (with citizen_score, reputation)
       - Promises table (with categories, timelines, locations)
       - Verifications table (multi-dimensional scoring)
       - Comments and discussions

    2. MongoDB collections for:
       - Evidence files metadata
       - Activity logs
       - Analytics data

    3. Define relationships and indexes
    4. Design the verification scoring algorithm

    Create:
    - backend/database/schema.sql
    - backend/database/models/
    - backend/database/migrations/
  `),

  /**
   * PHASE 2: BACKEND DEVELOPMENT
   */
  resolveStep('behavior-architect', `
    Implement the backend business logic:

    ${PROJECT_SPEC}

    Key focus areas:
    1. Verification algorithm (multi-dimensional scoring)
    2. Citizen score calculation system
    3. Evidence validation logic
    4. Quality assessment framework
    5. Anti-gaming mechanisms (prevent fraud)

    Create:
    - backend/src/services/verification.service.js
    - backend/src/services/scoring.service.js
    - backend/src/services/quality-assessment.service.js
    - backend/src/middleware/auth.middleware.js
    - backend/src/utils/validation.js
  `),

  resolveStep('operational-architect', `
    Build the API and infrastructure:

    ${PROJECT_SPEC}

    1. Set up Express server with routes
    2. Implement authentication (JWT)
    3. Create API endpoints for:
       - User management
       - Promise CRUD operations
       - Verification submissions
       - Scoring and leaderboards
    4. File upload handling (images, documents)
    5. Error handling and logging

    Create:
    - backend/src/app.js
    - backend/src/routes/
    - backend/src/controllers/
    - backend/.env.example
  `),

  /**
   * PHASE 3: FRONTEND DEVELOPMENT
   */
  resolveStep('ui-ux-architect', `
    Design and implement the user interface:

    ${PROJECT_SPEC}

    Key pages:
    1. Landing page (public, explain platform)
    2. Promise Dashboard (list all promises, filters)
    3. Promise Detail page (full info, verification history)
    4. Submit Promise page (form with validation)
    5. Verification submission (upload evidence)
    6. User Profile (citizen score, contribution history)
    7. Leaderboard (top citizens)
    8. Analytics Dashboard (charts, statistics)

    Use modern React practices:
    - React Query for data fetching
    - Zustand for state management
    - Tailwind CSS for styling
    - React Hook Form for forms

    Create:
    - frontend/src/pages/
    - frontend/src/components/
    - frontend/src/hooks/
    - frontend/src/services/api.js
  `),

  /**
   * PHASE 4: VERIFICATION SYSTEM (Critical Component)
   */
  resolveStep('behavior-architect', `
    Implement the sophisticated verification system to solve the "verification minefield":

    ${PROJECT_SPEC}

    Create a multi-stage verification pipeline:

    1. **Initial Submission**
       - User submits verification with evidence
       - Automatic checks (valid images, geo-location, timestamp)

    2. **Community Review**
       - Other citizens vote on validity (require min citizen score)
       - Evidence quality assessment
       - Weighted voting (higher scores = more weight)

    3. **Quality Metrics**
       - Multi-dimensional scoring system
       - Not just "done" but "how well done"
       - Structured evaluation forms

    4. **Expert Panel (for disputes)**
       - Flag controversial verifications
       - Expert review process
       - Final decision mechanism

    5. **Anti-Fraud Measures**
       - Rate limiting on submissions
       - Pattern detection (coordinated fake reviews)
       - Reputation-based filtering

    Create:
    - backend/src/services/verification-pipeline.service.js
    - backend/src/services/fraud-detection.service.js
    - backend/src/services/expert-review.service.js
    - frontend/src/components/VerificationForm.jsx
    - frontend/src/components/QualityMetrics.jsx
  `),

  /**
   * PHASE 5: GAMIFICATION & ENGAGEMENT
   */
  resolveStep('ui-ux-architect', `
    Build the citizen scoring and gamification features:

    ${PROJECT_SPEC}

    1. Citizen Score System
       - Point allocation algorithm
       - Achievement badges
       - Level progression
       - Title system

    2. Leaderboard
       - Regional rankings
       - Category-specific rankings
       - All-time and monthly leaders

    3. User Engagement
       - Notifications (promise updates)
       - Social features (comments, discussions)
       - Share functionality

    Create:
    - frontend/src/components/CitizenScore.jsx
    - frontend/src/components/Leaderboard.jsx
    - frontend/src/components/AchievementBadges.jsx
    - backend/src/services/gamification.service.js
  `),

  /**
   * PHASE 6: TESTING & QUALITY ASSURANCE
   */
  resolveStep('file-assembler', `
    Set up comprehensive testing:

    1. Backend tests:
       - Unit tests for verification algorithm
       - Integration tests for API endpoints
       - Test the fraud detection system

    2. Frontend tests:
       - Component tests (React Testing Library)
       - E2E tests (Playwright)
       - Accessibility tests

    3. Load testing:
       - Simulate concurrent users
       - Test database performance
       - File upload stress tests

    Create:
    - backend/tests/
    - frontend/tests/
    - tests/e2e/
    - docs/testing-strategy.md
  `),

  /**
   * PHASE 7: DEPLOYMENT & DOCUMENTATION
   */
  resolveStep('file-assembler', `
    Prepare for deployment:

    1. Docker setup:
       - Backend Dockerfile
       - Frontend Dockerfile
       - Docker Compose for local dev

    2. CI/CD:
       - GitHub Actions workflow
       - Automated testing
       - Deploy to production

    3. Documentation:
       - API documentation (Swagger/OpenAPI)
       - User guide
       - Admin manual
       - Developer setup guide

    4. Deployment:
       - Environment configurations
       - Database migrations
       - Cloud deployment scripts

    Create:
    - Dockerfile (backend + frontend)
    - docker-compose.yml
    - .github/workflows/ci-cd.yml
    - README.md
    - docs/deployment.md
    - docs/user-guide.md
  `),

  /**
   * FINAL STEP: COMPLETION
   */
  resolveUI("✨ PUTTAMACHINE - READY ✨"),
  resolveUI(`
    🎉 Political Accountability Platform - Complete!

    📂 Project Structure:
    ├── backend/           (Node.js/Express API)
    ├── frontend/          (React/Next.js)
    ├── database/          (Schema & migrations)
    ├── docs/              (Architecture & guides)
    └── tests/             (Comprehensive tests)

    🔑 Key Features Implemented:
    ✅ Promise tracking system
    ✅ Multi-dimensional verification
    ✅ Citizen scoring & gamification
    ✅ Quality assessment framework
    ✅ Evidence-based reporting
    ✅ Fraud detection
    ✅ Public transparency dashboard

    🚀 Next Steps:
    1. cd political-accountability-platform
    2. npm install (in both backend/ and frontend/)
    3. Set up database (PostgreSQL + MongoDB)
    4. Configure environment variables
    5. npm run dev (start development servers)

    📖 Read docs/deployment.md for production setup
  `),
];
