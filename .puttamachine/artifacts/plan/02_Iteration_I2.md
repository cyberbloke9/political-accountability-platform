<!-- anchor: iteration-2-plan -->
### Iteration 2: Promise Management & Verification Pipeline

**Iteration ID:** I2

**Goal:** Implement core backend services for political promise management (CRUD operations with search/filter) and the three-stage verification pipeline (submission → community review → resolution) with multi-dimensional quality assessment.

**Prerequisites:** I1 (requires database schema, Prisma client, OpenAPI spec, auth middleware)

---

<!-- anchor: task-i2-t1 -->
#### Task 2.1: Implement Authentication Service and Middleware

**Task ID:** I2.T1

**Description:** Build the authentication service (backend/src/services/auth.service.ts) implementing user registration with email validation, login with JWT token generation (15-min access token + 7-day refresh token), token refresh workflow, password reset via email, and TOTP MFA enrollment/verification for Champions. Implement auth middleware (backend/src/middleware/auth.middleware.ts) to validate JWT tokens and attach user context to request object. Use Argon2id for password hashing. Integrate Passport.js with JWT strategy.

**Agent Type Hint:** BackendAgent

**Inputs:**
- docs/diagrams/auth_flow_sequence.mmd (generated in I1.T3)
- api/openapi.yaml (auth endpoints specification from I1.T5)
- Section 2: Core Architecture - Authentication Service description
- Clarification Doc: Section 7 (Authentication: Security Tier 2)
- backend/prisma/schema.prisma (User model from I1.T7)

**Input Files:**
- `docs/diagrams/auth_flow_sequence.mmd`
- `api/openapi.yaml`
- `backend/prisma/schema.prisma`
- `.puttamachine/artifacts/plan/01_Plan_Overview_and_Setup.md`

**Target Files:**
- `backend/src/services/auth.service.ts`
- `backend/src/middleware/auth.middleware.ts`
- `backend/src/controllers/auth.controller.ts`
- `backend/src/routes/auth.routes.ts`
- `backend/src/utils/password.utils.ts` (Argon2id hashing)
- `backend/src/utils/jwt.utils.ts` (token generation/verification)
- `backend/src/validators/auth.validators.ts` (Zod schemas)
- `backend/src/config/passport.ts` (Passport.js configuration)

**Deliverables:**
- **auth.service.ts**: Methods for `register()`, `login()`, `refreshToken()`, `resetPassword()`, `enrollMFA()`, `verifyMFA()`
- **auth.middleware.ts**: `authenticateJWT()` middleware that validates Bearer token, decodes payload, fetches user from database, attaches to `req.user`
- **auth.controller.ts**: Route handlers calling auth.service methods, returning JSON responses
- **auth.routes.ts**: Express router defining POST /auth/register, /auth/login, /auth/refresh, /auth/reset-password, /auth/mfa/enroll, /auth/mfa/verify
- **password.utils.ts**: `hashPassword()`, `verifyPassword()` using Argon2id
- **jwt.utils.ts**: `generateAccessToken()`, `generateRefreshToken()`, `verifyToken()` using jsonwebtoken library
- **auth.validators.ts**: Zod schemas for request validation (email format, password complexity, TOTP code format)
- **passport.ts**: Passport JWT strategy configuration with secret from env vars

**Acceptance Criteria:**
- All auth routes are accessible and return correct HTTP status codes (200/201 for success, 400 for validation errors, 401 for invalid credentials)
- User registration creates record in database with hashed password (Argon2id)
- Login returns access token (15-min expiry) and refresh token (7-day expiry) in response body
- Auth middleware successfully validates JWT tokens and rejects expired/invalid tokens with 401
- Password reset generates time-limited token (1 hour expiry) sent via email (stub email sending for now)
- MFA enrollment generates TOTP secret, stores in user record, returns QR code data
- MFA verification validates TOTP code using speakeasy library
- Passwords are checked against haveibeenpwned API (warn user if compromised, don't block registration)
- Unit tests cover: password hashing/verification, JWT generation/verification, MFA TOTP validation
- Integration tests cover: full registration flow, login flow, token refresh flow

**Dependencies:** I1.T7 (requires Prisma User model and generated client)

**Parallelizable:** No (foundational service for all subsequent features)

---

<!-- anchor: task-i2-t2 -->
#### Task 2.2: Implement Promise Management Service

**Task ID:** I2.T2

**Description:** Build the promise management service (backend/src/services/promises.service.ts) with CRUD operations: create new promise, retrieve promise by ID, list promises with filtering (category, location, leader, party, status) and full-text search (PostgreSQL GIN index on title + description), update promise status, delete promise (soft delete). Implement pagination using cursor-based approach. Add controllers and routes for promise endpoints.

**Agent Type Hint:** BackendAgent

**Inputs:**
- api/openapi.yaml (promises endpoints specification from I1.T5)
- backend/prisma/schema.prisma (Promise model from I1.T7)
- database/schema.sql (Promise table with GIN index from I1.T6)
- Section 2: Core Architecture - Promise Management Service description

**Input Files:**
- `api/openapi.yaml`
- `backend/prisma/schema.prisma`
- `database/schema.sql`
- `.puttamachine/artifacts/plan/01_Plan_Overview_and_Setup.md`

**Target Files:**
- `backend/src/services/promises.service.ts`
- `backend/src/controllers/promises.controller.ts`
- `backend/src/routes/promises.routes.ts`
- `backend/src/validators/promise.validators.ts`

**Deliverables:**
- **promises.service.ts**: Methods for `createPromise()`, `getPromiseById()`, `listPromises()`, `updatePromiseStatus()`, `deletePromise()`, `searchPromises()`
- **promises.controller.ts**: Route handlers for promise CRUD operations
- **promises.routes.ts**: Express router defining:
  - GET /promises (with query params: category, location, leader, party, status, search, cursor, limit)
  - POST /promises (requires authentication)
  - GET /promises/:id
  - PATCH /promises/:id/status (admin/creator only)
  - DELETE /promises/:id (admin/creator only)
- **promise.validators.ts**: Zod schemas validating promise creation (required: title, description, leader_name, promised_date; optional: target_completion_date, location, party)
- **Full-text search implementation**: Use PostgreSQL `to_tsvector` and `to_tsquery` with GIN index for search query parameter
- **Pagination**: Cursor-based pagination using `createdAt` timestamp + `id` (more scalable than offset-based)

**Acceptance Criteria:**
- POST /promises creates promise record in database, returns 201 with promise object
- GET /promises/:id returns promise with verification history (joined query)
- GET /promises returns paginated list with filters applied (test with category filter, search query)
- Search query matches promises by title/description using full-text search (test with "road construction" matching relevant promises)
- Pagination returns `nextCursor` in response for fetching next page
- PATCH /promises/:id/status updates promise status (e.g., "not_started" → "in_progress" → "completed")
- DELETE /promises/:id soft-deletes promise (sets `deleted_at` timestamp, excludes from queries)
- Authentication middleware protects POST/PATCH/DELETE routes (401 if no valid JWT)
- Authorization checks ensure only creator or admin can update/delete promise
- Unit tests cover: promise creation, search logic, filter combinations
- Integration tests cover: full CRUD flow, pagination edge cases

**Dependencies:** I2.T1 (requires auth middleware for protected routes)

**Parallelizable:** Partially (can start implementation after I2.T1, can run concurrently with I2.T3 verification pipeline planning)

---

<!-- anchor: task-i2-t3 -->
#### Task 2.3: Generate Verification Pipeline State Diagram

**Task ID:** I2.T3

**Description:** Create a Mermaid state diagram documenting the three-stage verification workflow state machine. States: `pending` (initial submission), `reviewing` (community voting in progress), `approved` (60%+ votes for), `rejected` (60%+ votes against), `disputed` (contentious 45-55% vote split). Show transitions triggered by events (vote submission, vote threshold reached, 48-hour timeout). Include notes on vote weighting based on citizen scores.

**Agent Type Hint:** DocumentationAgent / DiagrammingAgent

**Inputs:**
- Section 2: Core Architecture - Verification Pipeline Service description
- Specification Doc: Multi-Dimensional Verification section (3-Stage Verification Process)
- Section 2.1: Key Architectural Artifacts (Verification Pipeline State Diagram)

**Input Files:**
- `.puttamachine/artifacts/plan/01_Plan_Overview_and_Setup.md`

**Target Files:**
- `docs/diagrams/verification_state_machine.mmd`

**Deliverables:**
- Mermaid state diagram (stateDiagram-v2) showing:
  - 5 states: pending, reviewing, approved, rejected, disputed
  - Transitions:
    - pending → reviewing (automatic after submission validation)
    - reviewing → approved (60%+ weighted votes for, min 10 votes)
    - reviewing → rejected (60%+ weighted votes against, min 10 votes)
    - reviewing → disputed (45-55% split after 48 hours OR 50+ votes without consensus)
    - disputed → [end state] (flagged for future expert review)
  - Notes on each state explaining wait conditions and triggers
  - Annotations showing vote weighting: New Citizen (1x), Responsible Citizen (1.5x), Guardian (2x), Sentinel (2x), Champion (3x)

**Acceptance Criteria:**
- File exists at `docs/diagrams/verification_state_machine.mmd`
- Mermaid stateDiagram-v2 syntax is valid
- All 5 states are defined with clear labels
- Transitions cover all possible paths from pending to terminal states (approved, rejected, disputed)
- Notes explain vote thresholds (60% for approval/rejection, 45-55% for disputed)
- Diagram includes vote count minimums (10 votes for simple promises, 50+ for complex)
- Diagram is clear enough for backend developers to implement state machine logic in verification service

**Dependencies:** I1.T1 (requires docs/diagrams/ directory)

**Parallelizable:** Yes (can run concurrently with I2.T1, I2.T2)

---

<!-- anchor: task-i2-t4 -->
#### Task 2.4: Implement Verification Pipeline Service

**Task ID:** I2.T4

**Description:** Build the verification pipeline service (backend/src/services/verification-pipeline.service.ts) implementing the three-stage workflow: Stage 1 (submission with evidence metadata), Stage 2 (community voting with weighted vote aggregation), Stage 3 (automatic resolution based on vote thresholds or disputed flagging). Implement state machine logic based on the state diagram from I2.T3. Create controllers and routes for verification submission and voting endpoints.

**Agent Type Hint:** BackendAgent

**Inputs:**
- docs/diagrams/verification_state_machine.mmd (generated in I2.T3)
- api/openapi.yaml (verification endpoints from I1.T5)
- backend/prisma/schema.prisma (Verification, Vote models from I1.T7)
- Section 2: Core Architecture - Verification Pipeline Service description

**Input Files:**
- `docs/diagrams/verification_state_machine.mmd`
- `api/openapi.yaml`
- `backend/prisma/schema.prisma`
- `.puttamachine/artifacts/plan/01_Plan_Overview_and_Setup.md`

**Target Files:**
- `backend/src/services/verification-pipeline.service.ts`
- `backend/src/services/vote.service.ts`
- `backend/src/controllers/verifications.controller.ts`
- `backend/src/routes/verifications.routes.ts`
- `backend/src/validators/verification.validators.ts`

**Deliverables:**
- **verification-pipeline.service.ts**: Methods for:
  - `submitVerification()`: Create verification record in `pending` state, validate evidence metadata (max 5 images, 1 video per spec), transition to `reviewing`
  - `resolveVerification()`: Called by background job or vote service, calculates weighted vote totals, transitions state based on thresholds
  - `flagAsDisputed()`: Transition to `disputed` state if votes are 45-55% split after 48 hours
  - `getVerificationById()`: Fetch verification with evidence, votes, submitter info
  - `listVerificationsByPromise()`: Get all verifications for a promise
- **vote.service.ts**: Methods for:
  - `submitVote()`: Record user vote (approve/reject), calculate vote weight based on citizen title, trigger verification resolution check
  - `getUserVote()`: Check if user already voted on verification (prevent duplicates)
  - `getWeightedVoteTotals()`: Aggregate votes with weighting (New Citizen 1x, Champion 3x)
- **verifications.controller.ts**: Route handlers for verification and voting operations
- **verifications.routes.ts**: Express router defining:
  - POST /verifications (requires auth, submits verification with evidence_metadata JSON)
  - GET /verifications/:id
  - POST /verifications/:id/vote (requires auth, body: { vote_type: "approve" | "reject" })
  - GET /promises/:id/verifications (list all verifications for promise)
- **verification.validators.ts**: Zod schemas for verification submission (validate multi-dimensional ratings: completion_status, quality_rating 1-5, timeline_status, budget_status, impact_rating)

**Acceptance Criteria:**
- POST /verifications creates verification in database with `pending` → `reviewing` state transition
- POST /verifications/:id/vote records vote, calculates weighted total, triggers resolution if thresholds met
- Weighted vote calculation: user with title "Champion" (3x weight) vote counts as 3 votes
- Verification resolves to `approved` if weighted votes ≥60% for, min 10 votes
- Verification resolves to `rejected` if weighted votes ≥60% against, min 10 votes
- Verification resolves to `disputed` if vote split is 45-55% after 48 hours (simulate with timestamp check)
- Users cannot vote twice on same verification (unique constraint enforced)
- GET /verifications/:id returns verification with aggregated vote totals and current state
- State transitions are logged in activity_logs table for audit trail
- Unit tests cover: vote weighting calculation, state transition logic, threshold detection
- Integration tests cover: full verification submission and voting flow, disputed flag scenario

**Dependencies:** I2.T3 (state diagram informs implementation logic), I2.T1 (requires auth middleware)

**Parallelizable:** No (depends on I2.T3 for state machine design)

---

<!-- anchor: task-i2-t5 -->
#### Task 2.5: Generate Quality Metrics Component Diagram

**Task ID:** I2.T5

**Description:** Create a PlantUML component diagram showing how multi-dimensional quality metrics (completion status, quality rating, timeline performance, budget adherence, impact assessment) are collected during verification submission, stored in the database, aggregated per promise, and displayed on promise detail pages. Show interactions between VerificationForm component (frontend), verification-pipeline service (backend), quality-assessment service (backend), and database.

**Agent Type Hint:** DocumentationAgent / DiagrammingAgent

**Inputs:**
- Section 2: Core Architecture - Quality Assessment Service description
- Specification Doc: Multi-Dimensional Verification section (5 metrics)
- Section 2.1: Key Architectural Artifacts (Quality Metrics Component Diagram)

**Input Files:**
- `.puttamachine/artifacts/plan/01_Plan_Overview_and_Setup.md`

**Target Files:**
- `docs/diagrams/quality_metrics_flow.puml`

**Deliverables:**
- PlantUML component diagram showing:
  - Frontend: VerificationForm component (collects 5-dimensional ratings from user)
  - Backend: verification-pipeline.service (validates and stores ratings)
  - Backend: quality-assessment.service (aggregates ratings across all verifications for a promise)
  - Database: Verifications table (stores individual ratings)
  - Database: Promises table (may cache aggregated metrics in JSONB column)
- Data flow arrows:
  - User input → VerificationForm → POST /verifications (with ratings JSON)
  - Backend validates ratings → stores in Verifications table
  - quality-assessment.service queries Verifications → calculates aggregate metrics → returns to API
  - Promise detail page fetches aggregated metrics → displays star rating, timeline badge, budget badge
- Include notes explaining each metric calculation (e.g., quality_rating average, timeline_status mode)

**Acceptance Criteria:**
- File exists at `docs/diagrams/quality_metrics_flow.puml`
- PlantUML syntax is valid
- Diagram shows 4 main components: VerificationForm, verification-pipeline service, quality-assessment service, database
- Data flow arrows clearly indicate direction and data type (e.g., "5-dimensional ratings JSON")
- Includes annotation showing 5 metrics: completion_status, quality_rating, timeline_status, budget_status, impact_rating
- Diagram is clear enough for frontend/backend developers to implement quality metrics collection and aggregation

**Dependencies:** I1.T1 (requires docs/diagrams/ directory)

**Parallelizable:** Yes (can run concurrently with I2.T4)

---

<!-- anchor: task-i2-t6 -->
#### Task 2.6: Implement Quality Assessment Service

**Task ID:** I2.T6

**Description:** Build the quality assessment service (backend/src/services/quality-assessment.service.ts) that aggregates multi-dimensional ratings from all approved verifications for a given promise. Calculate metrics: average quality rating (stars), most common completion status, timeline performance summary (% on time vs delayed), budget adherence summary, impact distribution. Expose this data via API endpoint for promise detail pages.

**Agent Type Hint:** BackendAgent

**Inputs:**
- docs/diagrams/quality_metrics_flow.puml (generated in I2.T5)
- backend/prisma/schema.prisma (Verification model with rating fields)
- Specification Doc: Multi-Dimensional Verification section

**Input Files:**
- `docs/diagrams/quality_metrics_flow.puml`
- `backend/prisma/schema.prisma`
- `.puttamachine/artifacts/plan/01_Plan_Overview_and_Setup.md`

**Target Files:**
- `backend/src/services/quality-assessment.service.ts`
- `backend/src/controllers/promises.controller.ts` (extend with quality metrics endpoint)
- `backend/src/routes/promises.routes.ts` (add GET /promises/:id/quality-metrics)

**Deliverables:**
- **quality-assessment.service.ts**: Methods for:
  - `getAggregatedMetrics(promiseId)`: Query all approved verifications for promise, calculate:
    - Average quality_rating (1-5 stars)
    - Mode of completion_status (most common: completed, in_progress, not_started, abandoned)
    - Timeline performance: % on time, % delayed, % severely delayed
    - Budget adherence: % under budget, % on budget, % over budget, % severely over
    - Impact distribution: % highly beneficial, % somewhat beneficial, % neutral, % not beneficial, % harmful
  - `getHistoricalTrends(promiseId)`: Return time-series data of quality ratings over time (for charts)
- **promises.controller.ts**: Add handler for GET /promises/:id/quality-metrics calling quality-assessment.service
- **promises.routes.ts**: Add route GET /promises/:id/quality-metrics (public, no auth required)

**Acceptance Criteria:**
- GET /promises/:id/quality-metrics returns JSON with aggregated metrics:
  ```json
  {
    "promiseId": "uuid",
    "avgQualityRating": 4.2,
    "completionStatus": "completed",
    "timelinePerformance": { "onTime": 60, "delayed": 30, "severelyDelayed": 10 },
    "budgetAdherence": { "underBudget": 10, "onBudget": 70, "moderatelyOver": 15, "severelyOver": 5 },
    "impactDistribution": { "highlyBeneficial": 50, "somewhatBeneficial": 30, "neutral": 15, "notBeneficial": 5, "harmful": 0 },
    "totalVerifications": 25
  }
  ```
- Calculation logic handles edge cases: no verifications (return null/empty), single verification (return as-is), large dataset (efficient aggregation query)
- Quality rating average is rounded to 1 decimal place
- Percentages sum to 100% (handle rounding appropriately)
- Unit tests cover: aggregation logic with various verification datasets, edge cases (0 verifications, all same rating)
- Integration tests cover: API response structure, correct calculations for test promise with known verifications

**Dependencies:** I2.T4 (requires Verification records with quality ratings), I2.T5 (diagram informs implementation)

**Parallelizable:** No (depends on I2.T4 for verification data structure)

---

**Iteration 2 Summary:**

This iteration delivers the core backend functionality for promise tracking and community-driven verification. By the end of I2, the platform will support:

- Full authentication system with JWT tokens and optional MFA
- Promise CRUD operations with full-text search and filtering
- Three-stage verification pipeline with weighted community voting
- Multi-dimensional quality assessment with aggregated metrics

**Key Outputs:**
- 8 backend service files (auth, promises, verification pipeline, vote, quality assessment)
- 4 route files (auth, promises, verifications)
- 3 validator files (auth, promises, verifications)
- 2 architectural diagrams (verification state machine, quality metrics flow)
- Complete API implementation for 15+ endpoints

**Next Iteration:** I3 will add gamification (citizen scoring system) and security features (fraud detection, evidence storage).
