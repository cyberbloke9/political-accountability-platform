# Political Accountability Platform - Technical Clarifications

**Date:** November 11, 2025
**Author:** Prithvi Putta
**Purpose:** Definitive answers to architectural questions. No ambiguity.

---

## Philosophy: Ship Fast, Iterate Faster

This isn't a NASA mission. We're building software that can be updated daily. Optimize for:
1. Speed to first user
2. Real-world validation
3. Rapid iteration based on actual usage data

Perfect is the enemy of good. Let's make decisions and move.

---

## 1. Database Architecture: PostgreSQL Only

**Decision:** PostgreSQL + Cloudflare R2 (Path C)

**Reasoning:**
- MongoDB was a premature optimization. We don't have the scale problems it solves.
- PostgreSQL with JSONB handles 99% of "NoSQL flexibility" needs
- One database = one connection pool, one backup strategy, one query language to optimize
- Cloudflare R2 for evidence storage: $0.015/GB vs S3's $0.023/GB, zero egress fees

**Implementation:**
- **Politicians table:** Standard relational (name, party, constituency, term dates)
- **Promises table:** Relational with JSONB for flexible metadata
- **Verifications table:** Relational with status tracking
- **Evidence metadata:** PostgreSQL with URLs pointing to R2 buckets
- **Citizen scores:** Materialized views refreshed every 10 minutes

**Cost projection:** $25-50/month for 10K active users. Scales linearly.

**Migration path if wrong:** If we hit 100K+ verifications/day and PostgreSQL becomes bottleneck, we'll know exactly what data to move to a specialized store. Premature optimization = wasted time.

---

## 2. Expert Panel: Not For MVP

**Decision:** Model D - Deferred to Post-MVP

**Reasoning:**
- Expert panels sound nice but create operational hell:
  - Who vets the experts?
  - How do we prevent bias claims?
  - What's the liability if an "expert" gets it wrong?
- Community consensus is sufficient for 90% of promises (clear yes/no outcomes)

**MVP Implementation:**
- Verification resolved by community vote (60% threshold)
- If vote is contentious (45-55% split), flag it as "Disputed"
- Disputed verifications go into a queue for future expert review
- We learn which types of promises need experts by analyzing disputed queue

**Post-MVP Path:**
- After 6 months, analyze disputed verifications
- Identify categories that consistently cause disputes
- Recruit domain experts for ONLY those categories
- Experts are verified professionals (doctors for healthcare promises, engineers for infrastructure, etc.)
- Community can challenge expert credentials with counter-evidence

**Why this works:** Real data beats theoretical models. Let users tell us what needs expert review.

---

## 3. Evidence Storage: Constrained MVP with Growth Path

**Decision:** Tier 1 with automatic upgrade path

**Hard Limits (MVP):**
- **Images:** Max 5 per verification, 5MB each, auto-compress to 1920px width
- **Videos:** 1 per verification, 50MB max, 720p, 2-minute limit
- **Retention:** Permanent for approved verifications, 90 days for rejected (vs 30 - gives time for appeals)
- **Total per user:** 100MB storage quota initially

**Storage Implementation:**
- Cloudflare R2 bucket per verification
- Images served via Cloudflare CDN (cache everything)
- Automatic WebP conversion (30-40% size reduction)
- Lazy loading thumbnails (generate 400px, 800px versions on upload)

**Cost Control:**
- R2: ~$15/month for 1,000 verifications (1GB storage)
- CDN bandwidth: Free (Cloudflare's egress is $0)
- At 10K verifications: ~$150/month (still reasonable)

**Upgrade Triggers:**
- If 60%+ of users hit storage quota → increase to 250MB
- If video quality complaints spike → add 1080p option for Champions
- If storage costs exceed $500/month → add user-pays option ($1/month for 1GB extra)

**Anti-Abuse:**
- Image EXIF validation (reject edited metadata)
- Duplicate hash detection (block identical files)
- Rate limiting: 10 uploads per hour per user

---

## 4. Citizen Score: Near-Real-Time (10-Minute Batch)

**Decision:** Approach B - Background jobs every 10 minutes

**Reasoning:**
- Real-time scoring requires database triggers on every action → performance nightmare
- Users don't need instant feedback. Gamification works fine with 10-minute lag.
- Batch processing allows us to optimize queries and cache results

**Implementation:**
- PostgreSQL materialized view: `citizen_scores_mv`
- Refresh via cron: `REFRESH MATERIALIZED VIEW CONCURRENTLY citizen_scores_mv`
- Runs every 10 minutes, takes ~2 seconds for 10K users
- Users see score update within 10 minutes of action

**Score Calculation:**
```sql
SELECT
  user_id,
  (verification_count * 10) +           -- Base points
  (approved_verifications * 20) +       -- Quality bonus
  (consecutive_days_active * 5) +       -- Streak bonus
  (referral_count * 15) -               -- Growth bonus
  (rejected_verifications * 30)         -- Quality penalty
AS total_score
FROM user_activity_summary;
```

**Why 10 minutes?**
- Frequent enough for engagement
- Infrequent enough to batch efficiently
- Allows score display caching at CDN layer

**Upgrade Path:** If users demand real-time (doubtful), we can add Redis cache with instant updates for top 1% of users (Champions). 99% won't notice 10-minute delay.

---

## 5. Geographic Scope: India First, i18n-Ready Data Models

**Decision:** Scope C - India MVP + i18n Foundation

**MVP Implementation:**
- **UI:** English only (Hindi support in Phase 2)
- **Currency:** INR (₹) hardcoded in UI, stored as integer cents in DB
- **Political Structure:** Abstracted models that work for parliamentary systems
- **Location:** India states/constituencies, but schema supports any hierarchy

**Data Schema (Future-Proof):**
```typescript
interface PoliticalEntity {
  id: string;
  name: string;
  type: 'country' | 'state' | 'constituency' | 'municipality';
  parent_id?: string;  // Allows nested hierarchies
  metadata: {
    population?: number;
    coordinates?: [lat, lon];
    // Country-specific fields in JSONB
  };
}
```

**Internationalization Strategy:**
- Text stored in `translations` JSONB column: `{"en": "text", "hi": "पाठ"}`
- Primary language always English (fallback)
- User's `preferred_language` column selects display language
- Translation service (DeepL API) for user-generated content in Phase 3

**Expansion Timeline:**
- **Month 0-6:** India only, prove concept
- **Month 7-12:** Add Hindi UI, 5 major Indian languages for promises
- **Month 13+:** International expansion (start with parliamentary democracies: UK, Canada, Australia)

**Why India First:**
- 1.4 billion people
- Active social media culture
- English proficiency in urban areas (early adopters)
- Parliamentary system (easier to model than US federal system)
- Personal motivation (you're here, you understand the pain points)

---

## 6. Fraud Detection: Rule-Based Heuristics (Level 1)

**Decision:** Start simple, evolve based on actual fraud attempts

**MVP Rules (Application Logic):**

**Image Verification:**
- Reverse image search via Google Vision API ($1.50 per 1,000 images)
- Flag if image found on web before promise date
- EXIF metadata check (flag if location/date edited)
- Perceptual hash duplicate detection (reject identical uploads)

**Behavior Patterns:**
- **Velocity limits:** Max 10 verifications per user per day
- **Coordinated voting:** Flag if 5+ users with <7 day accounts vote on same verification within 1 hour
- **Sock puppet detection:** Block users with same IP submitting multiple verifications in 10 minutes
- **Evidence recycling:** Flag if same image used for 3+ different promises

**Manual Review Triggers:**
- Verification gets 50+ votes but 49-51% split
- User receives 10+ fraud flags in 30 days
- Promise involves monetary claims >$1M USD equivalent

**Cost:** ~$50/month for Vision API at 1,000 verifications/month

**Post-MVP Evolution:**
- **Month 6:** Add basic anomaly detection (users with >3 standard deviations from mean activity)
- **Month 12:** Train lightweight ML model on manually-reviewed fraud cases
- **Month 18+:** Image manipulation detection (only if fraud rate exceeds 5%)

**Why no ML initially:**
- Training data = 0 (we have no fraud examples yet)
- Rule-based catches 80%+ of obvious fraud
- ML requires dedicated ML engineer ($150K+ salary or $10K+ for consultant)
- Premature optimization

**Fraud Monitoring Dashboard:**
- Real-time fraud flag rate
- Manual review queue with urgency scoring
- Pattern analysis (what's working, what's being exploited)

---

## 7. Authentication: Security Tier 2 (Hardened)

**Decision:** Tier 2 with optional MFA for Champions

**Implementation:**

**Password Requirements:**
- Minimum 10 characters (not the silly 8)
- Must include: uppercase, lowercase, number, special character
- Check against leaked password database (haveibeenpwned API)
- Reject common passwords ("Password123!", "Admin@1234")

**Session Management:**
- JWT tokens (15-minute access token, 7-day refresh token)
- HttpOnly cookies (no JavaScript access = no XSS)
- Secure flag enabled (HTTPS only)
- Token rotation on refresh
- IP binding (optional, can break mobile users)

**Account Security:**
- Email verification required before first verification submission
- Rate limiting: 5 failed login attempts → 30-minute lockout
- Password reset: Time-limited token (1 hour expiry), invalidate after use
- Security events log (login IPs, password changes, email changes)

**MFA (Optional for MVP, Required for Champions):**
- TOTP-based (Google Authenticator, Authy)
- Backup codes (10 one-time use codes)
- Required for:
  - Champions (top 1% by score)
  - Sentinels (moderators)
  - Anyone managing >1000 followers
- Optional for everyone else

**Account Recovery:**
- Email-based recovery link (1-hour expiry)
- Security questions as fallback (pick 3 from 10)
- If both fail: Manual verification via support (government ID + selfie)

**Compliance:**
- GDPR-ready: Data export, deletion requests
- Password hashing: Argon2id (winner of password hashing competition)
- Data encryption at rest: PostgreSQL encryption enabled
- Audit logs: All sensitive actions logged for 2 years

**Security Budget:** ~$0/month (all open source libraries, built-in PostgreSQL encryption)

**Post-Launch Security:**
- Penetration testing after 1,000 users ($2,000 one-time)
- Bug bounty program after 10,000 users ($500 minimum payout)
- SOC 2 compliance if enterprise clients emerge (Year 2+)

---

## Cost Summary

**Monthly Operating Costs (10K Active Users):**
- Database (PostgreSQL): $25 (managed hosting)
- Storage (Cloudflare R2): $15
- CDN (Cloudflare): $0 (free tier)
- Email (SendGrid): $15 (10K emails/month)
- Vision API (fraud detection): $50
- Domain + SSL: $2
- **Total: ~$107/month**

**At 100K users:** ~$500-800/month (still reasonable for a civic platform)

**Revenue Options (Post-Validation):**
- Freemium: $3/month for extra storage, ad-free experience
- API access for researchers/journalists: $50/month
- Government/NGO partnerships: $500-2000/month for analytics dashboard
- Donations: "Buy us a coffee" (target $200/month from passionate users)

---

## Development Timeline

**Week 1-2:** Database schema + Auth system
**Week 3-4:** Promise submission + Verification flow
**Week 5-6:** Citizen scoring + Gamification
**Week 7-8:** Evidence upload + Storage
**Week 9-10:** Fraud detection + Moderation tools
**Week 11-12:** Polish + Testing

**Month 4:** Private beta (100 users)
**Month 5:** Public beta (1,000 users)
**Month 6:** Official launch + press coverage

---

## Success Metrics

**MVP Validation (First 6 Months):**
- 1,000+ registered users
- 500+ verified promises
- <5% fraud rate
- 60%+ user retention after 30 days
- 1+ media mention (newspaper, blog, podcast)

**If we hit these metrics:** Double down, raise funding, hire team
**If we miss these metrics:** Pivot or shut down (don't waste time on dying ideas)

---

## What We're NOT Building (Yet)

- Mobile apps (PWA is sufficient for MVP)
- Real-time notifications (email summaries are fine)
- Social media integration (adds legal complexity)
- Comment threads (moderation nightmare)
- Live video streaming (storage cost explosion)
- Blockchain/Web3 anything (gimmick)
- AI-generated summaries (hallucination risk)

**Why:** Scope creep kills projects. Build the core, validate, then expand.

---

## Final Thought

This spec isn't perfect. It will change based on user feedback. That's the point.

**The goal:** Get a working product in front of real users in 3 months, not build the perfect system in 3 years.

Engineers love to over-architect. Resist the urge. Build, ship, learn, iterate.

---

**Status:** Specification complete. Ready for implementation.
**Next Step:** Architecture design + Technology stack finalization.

---

*"The best time to launch was yesterday. The second best time is now."*
