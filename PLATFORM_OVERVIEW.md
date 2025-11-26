# Political Accountability Platform - How It Works

## Table of Contents
1. [Overview](#overview)
2. [User Journey](#user-journey)
3. [Core Features](#core-features)
4. [Trust & Reputation System](#trust--reputation-system)
5. [Anti-Gaming Mechanisms](#anti-gaming-mechanisms)
6. [Admin Moderation](#admin-moderation)
7. [Data Flow](#data-flow)

---

## Overview

The Political Accountability Platform is a citizen-driven system designed to track and verify political promises across India. It combines community verification, reputation scoring, and automated anti-gaming mechanisms to ensure transparency and accuracy.

### Core Philosophy
- **Community-Driven**: All verifications come from citizens, not a central authority
- **Transparent**: All votes, evidence, and admin actions are publicly visible
- **Merit-Based**: Trust levels earned through quality contributions
- **Anti-Gaming**: Advanced systems prevent manipulation and fraud

---

## User Journey

### 1. **Discovery Phase**
```
User visits platform → Browses promises → Filters by politician/party/category
```

**Features:**
- Search by politician name, party, category, or keywords
- Filter by status (Pending/Fulfilled/Broken/In Progress/Stalled)
- Sort by date, popularity, or verification count
- View promise details with sources and context

### 2. **Contribution Phase**

#### A. **Promise Submission**
```
User sees unfulfilled promise → Creates account → Submits promise with sources
```

**Requirements:**
- Valid source URL (news article, official statement, etc.)
- Clear promise description
- Politician name and party
- Category tag (Education, Healthcare, Infrastructure, etc.)

**Review Process:**
- Automatic fraud detection checks for spam/duplicates
- Admin reviews for accuracy
- Approved promises appear on platform

#### B. **Verification Submission**
```
User finds evidence → Submits verification with verdict → Community votes
```

**Verification Types:**
- **Fulfilled**: Promise completed with evidence
- **Broken**: Promise explicitly broken or reversed
- **In Progress**: Work has started but not completed
- **Stalled**: No progress despite promises

**Evidence Requirements:**
- Written explanation (minimum 50 characters)
- Supporting URLs (news articles, official documents, images)
- Verdict selection with reasoning

**Trust Level Impact:**
Points earned vary by submitter's trust level:
- Admin verification: Base points × 3.0
- Trusted Community: Base points × 2.0
- Community: Base points × 1.0
- Untrusted: Base points × 0.5
- Self-verification: Base points × 0.1 (heavily penalized)

### 3. **Voting Phase**
```
Users review verifications → Vote up/down based on accuracy → Reputation changes
```

**Voting Rules:**
- Each user can vote once per verification
- Upvotes indicate "evidence is accurate"
- Downvotes indicate "evidence is inaccurate or misleading"
- Vote changes are allowed (update previous vote)

**Vote Impact:**
- Verification upvote: +10 points to verification author
- Verification downvote: -5 points to verification author
- Affects verification credibility score

### 4. **Progression Phase**
```
User earns points → Advances trust level → Unlocks privileges
```

**Trust Level Progression:**

| Trust Level | Requirements | Weight | Privileges |
|------------|--------------|--------|------------|
| **Untrusted** | New account (< 7 days, < 100 score) | 0.5x | Can submit, limited impact |
| **Community** | 100+ score, 7+ days, < 50% rejection rate | 1.0x | Standard voting power |
| **Trusted Community** | 500+ score, 10+ approved, 30+ days, < 20% rejection | 2.0x | Higher weight, auto-approve eligible |
| **Admin** | Manually assigned | 3.0x | Full moderation powers |

---

## Core Features

### Promise Tracking System

**Promise Lifecycle:**
```
Created → Verification Submitted → Community Votes → Admin Reviews → Status Updated
```

**Promise Statuses:**
- **Pending**: No verifications yet
- **Fulfilled**: Evidence shows promise was kept
- **Broken**: Evidence shows promise was not kept
- **In Progress**: Work has begun
- **Stalled**: No recent progress

**Consensus Mechanism:**
- Multiple verifications create weighted consensus
- Higher trust level verifications have more impact
- Admin-approved verifications carry most weight
- Self-verifications have minimal weight (anti-gaming)

### Reputation System

**Citizen Score Calculation:**
```
Base Points + Trust Multiplier - Penalties = Final Score
```

**Earning Points:**
- Approved verification: +10 points (× trust multiplier)
- Receiving upvote on verification: +10 points
- Creating quality promise: +5 points

**Losing Points:**
- Rejected verification: -15 points
- Receiving downvote: -5 points
- Flagged for spam/fraud: -50 to -200 points
- Self-verification: 90% point reduction

**Score Adjustments:**
- All scores recalculated when trust level changes
- Historical points retroactively adjusted
- Ensures fair weighting across time

---

## Trust & Reputation System

### Trust Level Determination

**Automatic Calculation (RPC Function):**
```sql
calculate_trust_level(user_id) → returns trust_level
```

**Factors Considered:**
1. **Citizen Score**: Total reputation points
2. **Account Age**: Days since registration
3. **Approval Rate**: Approved vs. rejected verifications
4. **Activity Quality**: Consistency and accuracy
5. **Flags**: Sybil attack or fraud detection flags

**Progression Requirements:**

**Untrusted → Community:**
- Citizen Score: 100+
- Account Age: 7+ days
- Rejection Rate: < 50%

**Community → Trusted Community:**
- Citizen Score: 500+
- Approved Verifications: 10+
- Account Age: 30+ days
- Rejection Rate: < 20%

### Trust Progression Display

Users see their progress on their profile:
```
Current Level: Community (1.0x)

Next Level: Trusted Community
━━━━━━━━━━░░░░░░ 65%

Requirements:
✓ Citizen Score: 520/500
✓ Approved Verifications: 12/10
✗ Account Age: 22/30 days
✓ Rejection Rate: 15% (< 20%)
```

---

## Anti-Gaming Mechanisms

### 1. **Self-Verification Detection**

**Problem:** Users might verify their own promises to game the system

**Solution:**
```sql
-- Automatic detection
IF verification.submitted_by = promise.created_by THEN
  SET is_self_verification = TRUE
  SET verification_weight = 0.1
END IF
```

**Penalties:**
- 90% point reduction (0.1x multiplier)
- Yellow warning badge shown to all users
- Requires admin review for approval
- Repeated self-verification triggers Sybil flag

### 2. **Sybil Attack Detection**

**Problem:** Coordinated accounts voting/submitting together

**Detection Patterns:**
```sql
-- Coordinated Voting Pattern
- Multiple accounts voting identically on same verifications
- Short time windows between votes
- Similar IP addresses or device fingerprints

-- Rapid Submission Pattern
- High frequency of submissions in short time
- Exceeds normal user behavior (> 5 per hour)

-- Coordinated Activity Pattern
- Accounts created around same time
- Similar naming patterns
- Mutual voting patterns
```

**Actions:**
- Automatic flagging with severity (low/medium/high/critical)
- Penalty points applied (-50 to -200)
- Admin review queue entry
- Potential account suspension

### 3. **Weighted Trust System**

**Problem:** All votes/verifications shouldn't have equal weight

**Solution:**
- Trust level multipliers on all actions
- Higher trust = more impact
- New/untrusted users have limited influence
- Prevents spam account attacks

**Example:**
```
Untrusted user submits verification: +5 points (10 × 0.5)
Trusted user submits verification: +20 points (10 × 2.0)
Admin submits verification: +30 points (10 × 3.0)
```

### 4. **Vote Brigade Detection**

**Problem:** Coordinated groups mass-voting to manipulate

**Detection** (Planned for Phase 2):
- Pattern analysis of voting groups
- Time-based correlation analysis
- Geographic clustering detection
- Voting velocity anomalies

### 5. **Reputation Decay** (Planned for Phase 2)

**Problem:** Inactive users retain high scores indefinitely

**Solution:**
- Points gradually decay after 90 days of inactivity
- Encourages ongoing participation
- Prevents score squatting

---

## Admin Moderation

### Role-Based Access Control

**Three-Tier System:**

#### 1. **Reviewer (L1)**
- Review verification queue
- Approve/reject verifications
- View flagged content
- Cannot ban users

#### 2. **Moderator (L2)**
- All Reviewer permissions
- Issue temporary bans (up to 30 days)
- Manage user reports
- View fraud detection flags

#### 3. **Super Admin (L3)**
- All Moderator permissions
- Issue permanent bans
- Manage admin users
- Configure system settings
- Override all decisions

### Verification Review Queue

**Admin Workflow:**
```
1. View pending verifications (sorted by newest/oldest/most controversial)
2. Read evidence, check sources, assess quality
3. Make decision:
   - Approve → Verification goes live, user earns points
   - Reject → Verification hidden, user loses points, reason recorded
```

**Review Criteria:**
- Evidence quality and credibility
- Source reliability (verified news outlets vs. blogs)
- Verdict accuracy based on evidence
- Grammar and clarity
- No spam or malicious content

### Flagged Accounts Dashboard

**Admin Features:**
- View all flagged accounts by status (active/resolved/dismissed)
- Filter by severity (critical/high/medium/low)
- Sort by newest, penalty amount, severity
- See flag reason and detected patterns
- Review user history and activity
- Take action:
  - **Resolve**: Flag addressed, user can continue
  - **Dismiss**: False positive, remove flag
  - **Ban**: Suspend account (temporary or permanent)

### Transparency Log

**Public Audit Trail (`/transparency`):**
- All admin actions visible to everyone
- No login required
- Searchable and filterable
- Includes:
  - Verification approvals/rejections
  - Ban actions (with reasons)
  - Point adjustments
  - Admin notes
  - Timestamps and admin usernames

**Why Public?**
- Prevents admin abuse
- Builds community trust
- Allows appeal with evidence
- Demonstrates platform integrity

---

## Data Flow

### Promise Creation Flow
```
User → Frontend → Supabase Auth → Database (promises table)
                        ↓
                Fraud Detection (automatic)
                        ↓
                Admin Review Queue
                        ↓
                Approve/Reject
                        ↓
                Public Promise Page
```

### Verification Flow
```
User → Submit Verification → Database (verifications table)
                                      ↓
                        Self-Verification Check
                                      ↓
                        Sybil Attack Detection
                                      ↓
                        Calculate Trust Weight
                                      ↓
                        Admin Review Queue
                                      ↓
                            Approve/Reject
                                      ↓
                        Update Citizen Score
                                      ↓
                        Recalculate Trust Level
                                      ↓
                        Community Voting Enabled
```

### Voting Flow
```
User → Vote (Upvote/Downvote) → Check if already voted
                                         ↓
                                 Update/Insert vote
                                         ↓
                        Update verification vote counts
                                         ↓
                        Adjust author's citizen score
                                         ↓
                        Trigger reputation recalculation
                                         ↓
                        Update trust level if thresholds met
```

### Trust Level Update Flow
```
User Action → Points Change → Trigger calculate_trust_level()
                                            ↓
                        Check all requirements
                                            ↓
                        Determine new trust level
                                            ↓
                        If level changed:
                        - Update user.trust_level
                        - Recalculate all user's verification weights
                        - Adjust historical scores
                                            ↓
                        Notify user (future: notification system)
```

---

## Security Measures

### 1. **Row-Level Security (RLS)**
- Database-level access control
- Users can only modify their own data
- Admins have elevated permissions
- Public read access for transparency

### 2. **Fraud Detection**
- Duplicate content detection
- Spam pattern recognition
- Vote manipulation detection
- Fake source URL detection

### 3. **Rate Limiting** (Planned Phase 2)
- Prevent spam submissions
- API endpoint throttling
- Per-user action limits

### 4. **Data Validation**
- Client-side form validation
- Server-side data sanitization
- SQL injection prevention (Supabase handled)
- XSS protection

### 5. **Cryptographic Integrity**
- Verification hash for tamper detection
- Immutable audit trail
- Timestamp verification

---

## Future Enhancements

### In-App Notifications
- Real-time updates on votes, approvals, rejections
- Trust level advancement notifications
- Promise status change alerts

### Comments & Discussions
- Community discussion on promises
- Evidence quality debates
- Peer review system

### Analytics Dashboard
- Platform statistics
- Politician scorecards
- Party comparison tools
- Geographic insights

### Mobile App & PWA
- Native mobile experience
- Offline support
- Push notifications
- Faster performance

### AI/ML Features
- Automated fact-checking
- Duplicate promise detection
- Evidence quality scoring
- Sentiment analysis

---

## Conclusion

The Political Accountability Platform uses a multi-layered approach to ensure accuracy and prevent manipulation:

1. **Community Verification**: Distributed evidence gathering
2. **Weighted Trust**: Merit-based influence system
3. **Anti-Gaming**: Advanced fraud detection
4. **Admin Oversight**: Human review for quality control
5. **Public Transparency**: All actions visible to everyone

This creates a self-regulating ecosystem where quality contributions are rewarded, manipulation is detected and penalized, and political accountability is transparently tracked.

---

**Last Updated:** November 27, 2025
