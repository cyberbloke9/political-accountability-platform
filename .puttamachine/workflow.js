/**
 * Political Accountability Platform - Simple Workflow
 *
 * This is a simplified workflow that builds the platform step-by-step
 * without complex dependencies.
 */

export default {
  name: 'Political Accountability Platform',
  steps: [
    // Phase 1: Architecture
    {
      type: 'step',
      agent: 'founder-architect',
      prompt: `
You are the Founder Architect. Create the system architecture for a Political Accountability Platform.

Read the specification from: .puttamachine/inputs/specifications.md

Create these files:
1. docs/architecture.md - High-level system design
2. docs/technology-stack.md - Tech choices and rationale
3. docs/system-diagram.md - Component relationships

Focus on:
- Multi-dimensional verification system
- Citizen scoring mechanism
- Evidence-based reporting
- Fraud detection
- Scalability
      `
    },

    // Phase 2: Database Design
    {
      type: 'step',
      agent: 'structural-data-architect',
      prompt: `
You are the Structural Data Architect. Design the database schema.

Read: .puttamachine/inputs/specifications.md

Create:
1. backend/database/schema.sql - PostgreSQL schema
2. backend/database/models/User.js
3. backend/database/models/Promise.js
4. backend/database/models/Verification.js
5. backend/database/migrations/001_initial.sql

Include:
- Users with citizen_score
- Promises with categories
- Multi-dimensional verification fields
- Relationships and indexes
      `
    },

    // Phase 3: Backend API
    {
      type: 'step',
      agent: 'operational-architect',
      prompt: `
You are the Operational Architect. Build the backend API.

Read: .puttamachine/inputs/specifications.md

Create:
1. backend/src/app.js - Express server setup
2. backend/src/routes/auth.routes.js
3. backend/src/routes/promises.routes.js
4. backend/src/routes/verifications.routes.js
5. backend/src/controllers/
6. backend/package.json
7. backend/.env.example

Implement JWT authentication and CRUD endpoints.
      `
    },

    // Phase 4: Business Logic
    {
      type: 'step',
      agent: 'behavior-architect',
      prompt: `
You are the Behavior Architect. Implement core business logic.

Read: .puttamachine/inputs/specifications.md

Create:
1. backend/src/services/verification.service.js - Multi-stage verification
2. backend/src/services/scoring.service.js - Citizen score calculation
3. backend/src/services/quality-assessment.service.js - Quality metrics
4. backend/src/services/fraud-detection.service.js - Anti-gaming
5. backend/src/middleware/auth.middleware.js

Focus on the verification minefield solution.
      `
    },

    // Phase 5: Frontend Pages
    {
      type: 'step',
      agent: 'ui-ux-architect',
      prompt: `
You are the UI/UX Architect. Build the frontend application.

Read: .puttamachine/inputs/specifications.md

Create:
1. frontend/src/pages/index.jsx - Landing page
2. frontend/src/pages/promises/index.jsx - Promise list
3. frontend/src/pages/promises/[id].jsx - Promise detail
4. frontend/src/pages/verify/[id].jsx - Verification form
5. frontend/src/components/PromiseCard.jsx
6. frontend/src/components/CitizenScore.jsx
7. frontend/package.json

Use React, Tailwind CSS, and modern practices.
      `
    },

    // Phase 6: Frontend Components
    {
      type: 'step',
      agent: 'ui-ux-architect',
      prompt: `
Continue building UI components.

Create:
1. frontend/src/components/VerificationForm.jsx - Multi-dimensional form
2. frontend/src/components/QualityMetrics.jsx - Star ratings display
3. frontend/src/components/EvidenceGallery.jsx - Photo/doc uploads
4. frontend/src/components/Leaderboard.jsx - Top citizens
5. frontend/src/services/api.js - API client
6. frontend/src/hooks/usePromises.js
7. frontend/src/hooks/useAuth.js
      `
    },

    // Phase 7: Testing
    {
      type: 'step',
      agent: 'file-assembler',
      prompt: `
You are the File Assembler. Create tests and documentation.

Create:
1. backend/tests/verification.test.js
2. backend/tests/scoring.test.js
3. frontend/tests/PromiseCard.test.jsx
4. tests/e2e/workflow.spec.js
5. docs/api-documentation.md
6. docs/deployment-guide.md
7. README.md - Setup instructions
      `
    },

    // Phase 8: Deployment Setup
    {
      type: 'step',
      agent: 'file-assembler',
      prompt: `
Create deployment configuration.

Create:
1. Dockerfile (backend)
2. frontend/Dockerfile
3. docker-compose.yml
4. .github/workflows/ci-cd.yml
5. backend/.dockerignore
6. frontend/.dockerignore
7. docs/production-setup.md
      `
    },

    // Done!
    {
      type: 'ui',
      message: '✨ POLITICAL ACCOUNTABILITY PLATFORM - READY ✨'
    },
    {
      type: 'ui',
      message: `
🎉 Build Complete!

📂 Generated:
  ├── backend/        (Node.js API)
  ├── frontend/       (React app)
  ├── docs/           (Documentation)
  └── tests/          (Test suite)

🚀 Next Steps:
1. cd backend && npm install
2. cd frontend && npm install
3. Set up databases
4. npm run dev

📖 See docs/deployment-guide.md for details
      `
    }
  ]
};
