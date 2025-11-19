<!-- anchor: iteration-1-plan -->
### Iteration 1: Foundation & Architecture Setup

**Iteration ID:** I1

**Goal:** Establish project infrastructure, database schema, API contracts, authentication system, and generate foundational architectural artifacts to guide subsequent development.

**Prerequisites:** None (first iteration)

---

<!-- anchor: task-i1-t1 -->
#### Task 1.1: Initialize Project Structure and Configuration

**Task ID:** I1.T1

**Description:** Create the monorepo directory structure as defined in Section 3 (Directory Structure). Initialize frontend (Next.js 14) and backend (Express + TypeScript) projects with appropriate package.json configurations, TypeScript configs, and linting rules. Set up shared/ directory for cross-project type definitions and validators. Configure git repository with .gitignore for node_modules, .env files, and build artifacts.

**Agent Type Hint:** SetupAgent

**Inputs:**
- Section 3: Directory Structure (from 01_Plan_Overview_and_Setup.md)
- Technology Stack requirements (Section 2: Core Architecture)

**Input Files:** []

**Target Files:**
- `package.json` (root monorepo)
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/next.config.js`
- `frontend/.eslintrc.json`
- `frontend/tailwind.config.ts`
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/.eslintrc.json`
- `shared/tsconfig.json`
- `.gitignore`
- `README.md` (basic project overview)
- `.env.example` (root, frontend, backend)

**Deliverables:**
- Complete directory structure with all folders created
- Initialized npm/yarn workspaces for monorepo
- Frontend: Next.js 14 with TypeScript, Tailwind CSS, React Query, Zustand
- Backend: Express + TypeScript with nodemon for development
- Shared: Base TypeScript configuration for shared types
- Git repository initialized with appropriate .gitignore
- README.md with project description and setup instructions placeholder

**Acceptance Criteria:**
- `npm install` (or `yarn install`) runs successfully at root and installs all dependencies
- TypeScript compilation succeeds in frontend/ and backend/ (`npm run build`)
- ESLint runs without configuration errors (`npm run lint`)
- Frontend dev server starts successfully (`npm run dev` in frontend/)
- Backend dev server starts successfully (`npm run dev` in backend/)
- All directories from Section 3 exist (use `ls -R` to verify structure)

**Dependencies:** None

**Parallelizable:** No (foundation task, must complete first)

---

<!-- anchor: task-i1-t2 -->
#### Task 1.2: Generate Component Architecture Diagram

**Task ID:** I1.T2

**Description:** Create a PlantUML component diagram visualizing the major backend services (Authentication, Promise Management, Verification Pipeline, Quality Assessment, Citizen Scoring, Fraud Detection, Storage, Notification), their primary responsibilities, and inter-service dependencies. Include database (PostgreSQL) and external services (Cloudflare R2, Google Vision API, SendGrid). Use PlantUML component notation with stereotypes for service types.

**Agent Type Hint:** DocumentationAgent / DiagrammingAgent

**Inputs:**
- Section 2: Core Architecture - Key Components/Services
- Section 2.1: Key Architectural Artifacts Planned (Component Diagram specification)

**Input Files:**
- `.puttamachine/artifacts/plan/01_Plan_Overview_and_Setup.md`

**Target Files:**
- `docs/diagrams/component_overview.puml`

**Deliverables:**
- PlantUML source file (`.puml`) with complete component diagram
- Diagram must render without syntax errors when processed by PlantUML
- Include:
  - 8 backend services as components with stereotypes
  - PostgreSQL database component
  - Redis cache component
  - External services (Cloudflare R2, Google Vision API, SendGrid) with boundary notation
  - Arrows showing dependencies and data flow directions
  - Legend explaining component types and arrow meanings

**Acceptance Criteria:**
- File exists at `docs/diagrams/component_overview.puml`
- PlantUML syntax is valid (can be validated with `plantuml -syntax component_overview.puml` or online validator)
- All 8 services from Section 2 are represented as components
- Database and external services are clearly distinguished (use boundary or different stereotypes)
- At least 10 dependency arrows connect related components
- Diagram accurately reflects the architecture described in Section 2

**Dependencies:** I1.T1 (requires docs/diagrams/ directory to exist)

**Parallelizable:** Yes (can run concurrently with I1.T3, I1.T4 after I1.T1)

---

<!-- anchor: task-i1-t3 -->
#### Task 1.3: Generate Authentication Flow Sequence Diagram

**Task ID:** I1.T3

**Description:** Create a Mermaid sequence diagram documenting the JWT-based authentication flows: (1) User Registration, (2) Login with JWT token generation, (3) Token Refresh workflow, (4) TOTP MFA enrollment, and (5) MFA-protected login. Show interactions between Client, Backend API, Database, and Redis (for session storage). Include error paths (invalid credentials, expired tokens).

**Agent Type Hint:** DocumentationAgent / DiagrammingAgent

**Inputs:**
- Section 2: Core Architecture - Authentication Service description
- Section 2.1: Key Architectural Artifacts Planned (Auth Flow Sequence Diagram specification)
- Clarification Doc: Section 7 (Authentication: Security Tier 2)

**Input Files:**
- `.puttamachine/artifacts/plan/01_Plan_Overview_and_Setup.md`

**Target Files:**
- `docs/diagrams/auth_flow_sequence.mmd`

**Deliverables:**
- Mermaid sequence diagram source file (`.mmd`)
- Diagram must include 5 distinct flows:
  1. Registration (email validation, password hashing, JWT issuance)
  2. Login (credential validation, JWT access + refresh token generation)
  3. Token Refresh (refresh token validation, new access token issuance)
  4. MFA Enrollment (TOTP secret generation, QR code delivery)
  5. MFA Login (TOTP code validation after password verification)
- Show actors: Client, Backend API, PostgreSQL, Redis
- Include alt/opt blocks for error handling

**Acceptance Criteria:**
- File exists at `docs/diagrams/auth_flow_sequence.mmd`
- Mermaid syntax is valid (can be validated with Mermaid CLI or online editor)
- All 5 authentication flows are documented with clear sequence steps
- Error paths are included (e.g., invalid password → 401 response)
- JWT token structure is implied (access token 15 min expiry, refresh token 7 day expiry)
- MFA flows show TOTP validation logic
- Diagram is comprehensive enough for backend developers to implement auth service

**Dependencies:** I1.T1 (requires docs/diagrams/ directory)

**Parallelizable:** Yes (can run concurrently with I1.T2, I1.T4 after I1.T1)

---

<!-- anchor: task-i1-t4 -->
#### Task 1.4: Generate Database ERD Diagram

**Task ID:** I1.T4

**Description:** Create a Mermaid entity-relationship diagram (ERD) showing all database tables (Users, Promises, Verifications, Votes, EvidenceFiles, ActivityLogs), their columns with data types, primary keys, foreign keys, and cardinality relationships. Include critical indexes (e.g., GIN index on promise full-text search, composite index on verifications for status queries). Document JSONB columns for flexible metadata storage.

**Agent Type Hint:** DatabaseAgent / DiagrammingAgent

**Inputs:**
- Section 2: Core Architecture - Data Model Overview
- Specification Doc: Database Schema (Users, Promises, Verifications tables)
- Section 2.1: Key Architectural Artifacts Planned (Database ERD specification)

**Input Files:**
- `.puttamachine/artifacts/plan/01_Plan_Overview_and_Setup.md`

**Target Files:**
- `docs/diagrams/database_erd.mmd`

**Deliverables:**
- Mermaid ER diagram source file (`.mmd`)
- Entities:
  - Users (id, email, username, password_hash, citizen_score, title, reputation, is_verified, created_at)
  - Promises (id, title, description, category, leader_name, leader_party, promised_date, target_completion_date, location, status, created_by FK, metadata JSONB, created_at)
  - Verifications (id, promise_id FK, submitted_by FK, completion_status, quality_rating, timeline_status, budget_status, impact_rating, evidence_metadata JSONB, description, verification_status, community_votes_for, community_votes_against, expert_reviewed, created_at)
  - Votes (id, verification_id FK, user_id FK, vote_type ENUM, weight DECIMAL, created_at)
  - EvidenceFiles (id, verification_id FK, file_type ENUM, storage_url, file_size_bytes, thumbnail_url, uploaded_at)
  - ActivityLogs (id, user_id FK, action_type, metadata JSONB, ip_address, created_at)
- Relationships with cardinality (1-to-many, many-to-many)
- Include comments for JSONB column usage

**Acceptance Criteria:**
- File exists at `docs/diagrams/database_erd.mmd`
- Mermaid erDiagram syntax is valid
- All 6 core entities are defined with accurate column lists
- Foreign key relationships are shown with correct cardinality (e.g., Users ||--o{ Promises : creates)
- JSONB columns are documented with comments explaining stored structure
- Primary keys are identified (typically UUID columns)
- Diagram aligns with SQL schema that will be generated in I1.T6

**Dependencies:** I1.T1 (requires docs/diagrams/ directory)

**Parallelizable:** Yes (can run concurrently with I1.T2, I1.T3 after I1.T1)

---

<!-- anchor: task-i1-t5 -->
#### Task 1.5: Generate Initial OpenAPI Specification

**Task ID:** I1.T5

**Description:** Create OpenAPI 3.1 YAML specification defining all REST API endpoints for authentication, promises, verifications, users, and leaderboard. Include request/response schemas, authentication requirements (Bearer JWT), error response formats (RFC 7807), and example payloads. Document query parameters for filtering/pagination. This initial spec will be refined in subsequent iterations as features are implemented.

**Agent Type Hint:** BackendAgent / DocumentationAgent

**Inputs:**
- Section 2: Core Architecture - API Contract Style
- Section 2: Core Architecture - Primary Endpoints list
- Section 2.1: Key Architectural Artifacts Planned (OpenAPI Specification)

**Input Files:**
- `.puttamachine/artifacts/plan/01_Plan_Overview_and_Setup.md`

**Target Files:**
- `api/openapi.yaml`

**Deliverables:**
- OpenAPI 3.1 YAML file with complete API definition
- Endpoints to define (minimum):
  - POST /api/v1/auth/register
  - POST /api/v1/auth/login
  - POST /api/v1/auth/refresh
  - POST /api/v1/auth/mfa/enroll
  - GET /api/v1/promises (with query params: category, location, leader, status, page, limit)
  - POST /api/v1/promises
  - GET /api/v1/promises/{id}
  - POST /api/v1/verifications
  - POST /api/v1/verifications/{id}/vote
  - GET /api/v1/users/{id}
  - GET /api/v1/users/{id}/score
  - GET /api/v1/leaderboard
- Schemas for: User, Promise, Verification, Vote, CitizenScore, ErrorResponse
- Security schemes: BearerAuth (JWT)
- Example request/response bodies for each endpoint

**Acceptance Criteria:**
- File exists at `api/openapi.yaml`
- YAML is valid and conforms to OpenAPI 3.1 specification (validate with Swagger Editor or CLI)
- All 12+ endpoints are documented with method, path, parameters, request body (if applicable), responses (200, 400, 401, 404, 500)
- Request/response schemas reference reusable component schemas
- Authentication is documented with `security: [BearerAuth]` where required
- Error responses follow RFC 7807 Problem Details format
- At least one example payload per endpoint

**Dependencies:** I1.T1 (requires api/ directory)

**Parallelizable:** Yes (can run concurrently with diagram generation tasks after I1.T1)

---

<!-- anchor: task-i1-t6 -->
#### Task 1.6: Create PostgreSQL Database Schema (DDL)

**Task ID:** I1.T6

**Description:** Write production-ready PostgreSQL DDL script defining all tables (Users, Promises, Verifications, Votes, EvidenceFiles, ActivityLogs), columns with appropriate data types (UUID for IDs, JSONB for flexible metadata, ENUM types for status fields), primary keys, foreign keys with ON DELETE constraints, indexes (GIN for full-text search, B-tree for foreign keys and timestamp columns), and constraints (CHECK constraints for rating ranges, NOT NULL constraints). Include comments for complex columns.

**Agent Type Hint:** DatabaseAgent

**Inputs:**
- Section 2: Core Architecture - Data Model Overview
- docs/diagrams/database_erd.mmd (generated in I1.T4)
- Specification Doc: Database Schema section (Users, Promises, Verifications table definitions)

**Input Files:**
- `.puttamachine/artifacts/plan/01_Plan_Overview_and_Setup.md`
- `docs/diagrams/database_erd.mmd`

**Target Files:**
- `database/schema.sql`

**Deliverables:**
- Complete PostgreSQL DDL script
- Table definitions:
  - Users (with unique constraints on email/username, index on citizen_score for leaderboard queries)
  - Promises (with GIN index on to_tsvector for full-text search, composite index on status + created_at)
  - Verifications (with composite index on promise_id + verification_status for filtering)
  - Votes (with unique constraint on verification_id + user_id to prevent duplicate votes)
  - EvidenceFiles (with foreign key to verifications)
  - ActivityLogs (with index on user_id + created_at for audit queries)
- ENUM types: verification_status_enum, promise_status_enum, vote_type_enum, citizen_title_enum
- Materialized view: citizen_scores_mv (aggregates scores from user activities)
- Refresh function for materialized view (to be called by cron job)

**Acceptance Criteria:**
- File exists at `database/schema.sql`
- SQL script executes without errors on PostgreSQL 15+ (`psql -f schema.sql`)
- All 6 tables are created with correct columns and data types
- Foreign key constraints are defined with appropriate ON DELETE actions (CASCADE for child records, RESTRICT for referenced records)
- Indexes are created for all foreign keys and frequently queried columns
- GIN index exists on Promises table for full-text search (e.g., `CREATE INDEX idx_promises_fts ON promises USING GIN(to_tsvector('english', title || ' ' || description))`)
- Materialized view citizen_scores_mv is created with query aggregating points from verifications, votes, activity logs
- CHECK constraints enforce data integrity (e.g., quality_rating between 1 and 5)
- Script is idempotent (can be run multiple times with DROP TABLE IF EXISTS or CREATE TABLE IF NOT EXISTS)

**Dependencies:** I1.T4 (ERD diagram should inform schema design)

**Parallelizable:** Partially (can start after I1.T4 completes, can run concurrently with I1.T5, I1.T7)

---

<!-- anchor: task-i1-t7 -->
#### Task 1.7: Create Prisma Schema and Generate Client

**Task ID:** I1.T7

**Description:** Define Prisma schema (backend/prisma/schema.prisma) mirroring the PostgreSQL schema from I1.T6. Configure datasource for PostgreSQL, define models for Users, Promises, Verifications, Votes, EvidenceFiles, ActivityLogs with appropriate field types, relations, indexes (@@index), and unique constraints (@@unique). Generate Prisma Client using `prisma generate`. Create initial migration with `prisma migrate dev`.

**Agent Type Hint:** BackendAgent / DatabaseAgent

**Inputs:**
- database/schema.sql (generated in I1.T6)
- docs/diagrams/database_erd.mmd (generated in I1.T4)
- Section 2: Technology Stack (Prisma 5.x as ORM)

**Input Files:**
- `database/schema.sql`
- `docs/diagrams/database_erd.mmd`

**Target Files:**
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/` (auto-generated migration files)
- `backend/node_modules/.prisma/client/` (auto-generated Prisma Client)

**Deliverables:**
- Prisma schema file with:
  - datasource db { provider = "postgresql", url = env("DATABASE_URL") }
  - generator client { provider = "prisma-client-js" }
  - 6 models: User, Promise, Verification, Vote, EvidenceFile, ActivityLog
  - Relationships defined with @relation decorator
  - Field-level attributes: @id, @unique, @default, @db.Uuid, @db.Text, @db.Jsonb
  - Model-level attributes: @@index, @@unique for composite constraints
- Prisma Client generated (visible as importable module in backend code)
- Initial migration created (migration SQL files in backend/prisma/migrations/)

**Acceptance Criteria:**
- File exists at `backend/prisma/schema.prisma`
- Prisma schema is syntactically valid (`prisma validate` succeeds)
- All 6 models are defined with fields matching database/schema.sql columns
- Relationships are correctly defined (e.g., User has many Promises, Verification belongs to Promise and User)
- Indexes are declared using @@index (e.g., `@@index([status, createdAt])` on Promise model)
- `prisma generate` command completes successfully, generating client in node_modules/.prisma/client/
- `prisma migrate dev --name init` creates initial migration files
- Migration can be applied to empty PostgreSQL database (`prisma migrate deploy`)
- Prisma Client can be imported in TypeScript: `import { PrismaClient } from '@prisma/client'`

**Dependencies:** I1.T6 (SQL schema defines the structure to replicate in Prisma)

**Parallelizable:** No (must wait for I1.T6 to complete, schema must be finalized first)

---

**Iteration 1 Summary:**

This iteration establishes the foundational infrastructure for the Political Accountability Platform. By the end of I1, the project will have:

- Complete directory structure with initialized frontend and backend codebases
- Architectural clarity through component, ERD, and auth flow diagrams
- Database schema defined in both raw SQL and Prisma ORM format
- API contract documented via OpenAPI specification
- Development environment ready for feature implementation in Iteration 2

**Key Outputs:**
- 13+ configuration files (package.json, tsconfig.json, etc.)
- 4 architectural diagrams (PlantUML + Mermaid)
- 1 OpenAPI specification (12+ endpoints)
- 1 PostgreSQL schema (6 tables + materialized view)
- 1 Prisma schema (6 models)

**Next Iteration:** I2 will build upon this foundation to implement core features (Promise CRUD, Verification Pipeline).
