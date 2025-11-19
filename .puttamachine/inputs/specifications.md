# Political Accountability Platform - Project Specification

## Executive Summary
A citizen-driven platform to hold political leaders accountable by tracking their public promises and allowing community-based verification with gamification.

## The Problem

Politicians make numerous promises during campaigns - not just in manifestos but in speeches, interviews, and rallies. Citizens have no systematic way to:
1. Track all these promises
2. Verify if they were fulfilled
3. Assess the quality of fulfillment
4. Hold leaders accountable collectively

## Our Solution

### Core Value Proposition
**"Every promise tracked. Every citizen empowered."**

A transparent platform where:
- **Leaders** post or have their promises tracked
- **Citizens** submit evidence of fulfillment (or lack thereof)
- **Community** verifies through multi-dimensional assessment
- **Everyone** sees real-time accountability metrics

## Key Innovation: Solving the "Verification Minefield"

### The Challenge
A road can be built, but:
- Quality might be poor (potholes within months)
- Timeline might be missed (promised 6 months, took 2 years)
- Budget might be overrun (promised ₹10 crore, spent ₹25 crore)
- Wrong location (promised Highway A, built Highway B)

**Simple "complete/incomplete" doesn't tell the full story.**

### Our Solution: Multi-Dimensional Verification

#### 1. Completion Status (Binary)
- ❌ Not Started
- 🟡 In Progress (with % completion)
- ✅ Completed
- 🚫 Abandoned

#### 2. Quality Rating (Stars)
- ⭐⭐⭐⭐⭐ Excellent (exceeds expectations)
- ⭐⭐⭐⭐ Good (meets expectations)
- ⭐⭐⭐ Acceptable (basic fulfillment)
- ⭐⭐ Poor (substandard quality)
- ⭐ Very Poor (unusable/needs rework)

#### 3. Timeline Performance
- ✅ On Time
- ⏰ Delayed (but completed)
- 🚫 Severely Delayed (>100% over timeline)

#### 4. Budget Adherence
- 💰 Under Budget
- ✅ On Budget
- 📈 Moderately Over (10-50% over)
- 🚨 Severely Over (>50% over)

#### 5. Impact Assessment
Citizen feedback: "Did this promise actually benefit you?"
- 🎯 Highly Beneficial
- 👍 Somewhat Beneficial
- 😐 Neutral
- 👎 Not Beneficial
- 🚫 Actually Harmful

### Verification Process (3-Stage)

#### Stage 1: Initial Submission
- Citizen submits verification with evidence
- Required: Photos/videos, description, location
- Optional: Documents, news links, expert opinions
- Automatic checks: Valid media, geo-tags, timestamps

#### Stage 2: Community Review (48 hours)
- Citizens vote on submission validity
- Minimum 10 votes required for simple promises
- Complex promises need 50+ votes
- Votes weighted by citizen score
- Quality metrics scored separately

#### Stage 3: Expert Panel (if disputed)
- Flagged by community OR citizen score holders
- Panel of domain experts reviews
- Final decision on verification status
- Becomes case study for future verifications

## Gamification: The Citizen Score System

### How Points Are Earned

| Action | Points | Notes |
|--------|--------|-------|
| Submit verified promise | 10 | Must be approved by community |
| Submit verification (approved) | 25 | With evidence |
| Quality verification (5-star) | 50 | Exceptional evidence & analysis |
| Spot fake verification | 30 | Report leads to removal |
| Expert panel review | 100 | Selected for complex cases |
| Regular activity (daily login) | 1 | Max 30/month |

### Citizen Titles & Privileges

| Title | Score Range | Privileges |
|-------|-------------|-----------|
| 🌱 New Citizen | 0-50 | Basic voting (weight: 1x) |
| 👤 Active Citizen | 50-200 | Can submit verifications |
| 🎖️ Responsible Citizen | 200-500 | Vote weight: 1.5x |
| 🏛️ Guardian | 500-1000 | Can flag for expert review |
| 👑 Sentinel | 1000-2500 | Vote weight: 2x, Mentor new users |
| 🏆 Champion | 2500+ | Expert panel nominee, Vote weight: 3x |

### Anti-Gaming Mechanisms

1. **Verification Required**: Can't earn points without community approval
2. **Rate Limiting**: Max 5 verifications per day
3. **Cool-down Period**: 24 hours between verifications of same promise
4. **Penalty System**: Fake submissions = -100 points + temporary ban
5. **Audit Trail**: All actions logged, suspicious patterns flagged

## Technical Architecture

### Frontend (React/Next.js)
```
frontend/
├── pages/
│   ├── index.jsx                 (Landing page)
│   ├── promises/
│   │   ├── index.jsx            (Browse all promises)
│   │   ├── [id].jsx             (Promise detail)
│   │   └── submit.jsx           (Submit new promise)
│   ├── verify/
│   │   └── [promiseId].jsx      (Submit verification)
│   ├── leaderboard.jsx          (Top citizens)
│   └── profile/[userId].jsx     (User profile)
├── components/
│   ├── PromiseCard.jsx
│   ├── VerificationForm.jsx
│   ├── QualityMetrics.jsx
│   ├── CitizenScore.jsx
│   └── EvidenceGallery.jsx
└── hooks/
    ├── usePromises.js
    ├── useVerification.js
    └── useCitizenScore.js
```

### Backend (Node.js/Express)
```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── promises.routes.js
│   │   ├── verifications.routes.js
│   │   └── users.routes.js
│   ├── controllers/
│   ├── services/
│   │   ├── verification-pipeline.service.js
│   │   ├── scoring.service.js
│   │   ├── quality-assessment.service.js
│   │   └── fraud-detection.service.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── validation.middleware.js
│   └── models/
├── database/
│   ├── schema.sql
│   └── migrations/
└── tests/
```

### Database Schema (PostgreSQL)

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  citizen_score INT DEFAULT 0,
  title VARCHAR(50) DEFAULT 'New Citizen',
  reputation DECIMAL(3,2) DEFAULT 5.0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Promises Table
```sql
CREATE TABLE promises (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  leader_name VARCHAR(100) NOT NULL,
  leader_party VARCHAR(100),
  promised_date DATE NOT NULL,
  target_completion_date DATE,
  location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'not_started',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Verifications Table
```sql
CREATE TABLE verifications (
  id UUID PRIMARY KEY,
  promise_id UUID REFERENCES promises(id),
  submitted_by UUID REFERENCES users(id),
  completion_status VARCHAR(20) NOT NULL,
  quality_rating INT CHECK (quality_rating BETWEEN 1 AND 5),
  timeline_status VARCHAR(20),
  budget_status VARCHAR(20),
  impact_rating VARCHAR(20),
  evidence_photos TEXT[],
  evidence_documents TEXT[],
  description TEXT NOT NULL,
  verification_status VARCHAR(20) DEFAULT 'pending',
  community_votes_for INT DEFAULT 0,
  community_votes_against INT DEFAULT 0,
  expert_reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## MVP Scope (First Release)

### Phase 1: Core Features (Weeks 1-4)
✅ User registration & authentication
✅ Promise submission and listing
✅ Basic search and filters
✅ Promise detail pages

### Phase 2: Verification System (Weeks 5-8)
✅ Verification submission with photos
✅ Community voting
✅ Multi-dimensional quality metrics
✅ Evidence gallery

### Phase 3: Gamification (Weeks 9-10)
✅ Citizen score system
✅ Title progression
✅ Leaderboard
✅ Achievement badges

### Phase 4: Polish & Launch (Weeks 11-12)
✅ Mobile responsiveness
✅ Performance optimization
✅ Security hardening
✅ Documentation
✅ Beta testing

## Success Metrics

### Launch Targets (First 3 Months)
- 🎯 10,000+ registered citizens
- 🎯 500+ promises tracked
- 🎯 2,000+ verifications submitted
- 🎯 80%+ community verification approval rate
- 🎯 <5% false report rate

### Long-term Goals (Year 1)
- 🌟 100,000+ active citizens
- 🌟 Coverage of major electoral constituencies
- 🌟 Partnership with at least 1 civic organization
- 🌟 Media coverage in national outlets
- 🌟 Influence at least 1 policy change

## Deployment Strategy

### Hosting
- **Frontend**: Vercel/Netlify (Edge deployment)
- **Backend**: Railway/Render (Container-based)
- **Database**: Supabase (PostgreSQL) + MongoDB Atlas
- **Storage**: Cloudflare R2 (cheaper than S3)
- **CDN**: Cloudflare

### Costs (Estimated Monthly)
- Hosting: $50-100
- Database: $25-50
- Storage: $10-20
- Domain: $1
- **Total**: ~$100-200/month

### Monetization (Future)
- Premium features for organizations
- API access for researchers
- Sponsored verification by NGOs
- Data analytics reports

## Open Source Strategy

- **License**: MIT (full open source)
- **Repository**: GitHub (public)
- **Community**: Discord server for contributors
- **Documentation**: Comprehensive wiki
- **Contributions**: Welcoming PRs, issues, discussions

## Risk Mitigation

### Risk: Political Targeting
**Mitigation**: Platform is non-partisan, tracks all leaders equally

### Risk: Fake Verifications
**Mitigation**: Multi-stage verification, reputation system, fraud detection

### Risk: Low Adoption
**Mitigation**: Gamification, social features, media partnerships

### Risk: Legal Challenges
**Mitigation**: Terms of service, disclaimer, evidence-based reporting only

## Get Started

1. Clone the repository
2. Set up databases (PostgreSQL + MongoDB)
3. Configure environment variables
4. Run migrations
5. Start development servers
6. Build the future of accountability!

---

**Let's make democracy more transparent, one promise at a time.** 🎯
