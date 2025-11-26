# Political Accountability Platform - Development Roadmap
## Updated: November 27, 2025

---

## ✅ **COMPLETED PHASES**

### Phase 1-8: Core Platform Foundation ✓
- Authentication and user management
- Promise creation and browsing
- Verification submission system
- Community voting mechanism
- User profiles and reputation
- Advanced search and filtering
- Admin roles and permissions (Reviewer/Moderator/SuperAdmin)
- Fraud detection and vote pattern analysis
- Reputation engine with dynamic scoring
- Auto-approval for trusted users
- Ban management with appeals system
- Public transparency log

### Phase 9: Verification Detail Page ✓
- Detailed verification view with full evidence
- Community voting interface
- Admin moderation controls
- Cryptographic hash integrity
- Status tracking and history

### Phase 1 (Anti-Gaming): Complete Anti-Gaming System ✓
- **Self-Verification Detection**: Automatic flagging with 0.1x penalty
- **Weighted Trust System**: 4-tier trust levels (Admin 3.0x, Trusted 2.0x, Community 1.0x, Untrusted 0.5x)
- **Sybil Attack Detection**: Pattern recognition for coordinated voting, rapid submissions
- **Automated Flagging**: Real-time suspicious activity monitoring with severity levels
- **Trust Progression Display**: Clear requirements shown to users
- **Admin Flagged Accounts Dashboard**: Review and resolve suspicious activity
- **Frontend Integration**: Trust badges, self-verification warnings, progression indicators

**Database Migrations Completed:**
- Migration 012: Verification hash integrity
- Migration 013: Self-verification prevention
- Migration 014: Weighted trust system
- Migration 015: Sybil attack detection

---

## 🚀 **UPCOMING PHASES** (Priority Order)

## **PHASE 2: Additional Anti-Gaming Enhancements**
**Priority:** HIGH
**Estimated Time:** 3-4 days

### Why This Phase?
Continue strengthening the anti-gaming system with advanced automation and detection mechanisms before adding new features.

### Tasks:

#### 1. **Vote Brigade Detection** (Migration 016)
```sql
-- Detect coordinated voting groups
CREATE TABLE vote_brigade_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_ids UUID[] NOT NULL,
  verification_ids UUID[] NOT NULL,
  detection_timestamp TIMESTAMPTZ DEFAULT NOW(),
  confidence_score DECIMAL(3,2),
  pattern_type TEXT,
  flagged BOOLEAN DEFAULT TRUE
);
```

**Detection Patterns:**
- Multiple accounts voting identically on same verifications
- Time correlation analysis (votes within 1 minute window)
- IP address clustering
- Device fingerprint similarities
- Voting velocity anomalies

#### 2. **Trust Level Automation** (Migration 017)
```sql
-- Automatic trust level promotion/demotion
CREATE OR REPLACE FUNCTION auto_update_trust_levels()
RETURNS void AS $$
-- Runs nightly to update all user trust levels
-- Promotes users who meet requirements
-- Demotes users who fall below thresholds
$$ LANGUAGE plpgsql;
```

**Features:**
- Nightly cron job to recalculate all trust levels
- Automatic promotion when thresholds met
- Automatic demotion for inactive or low-quality users
- Notification system integration

#### 3. **Reputation Decay System** (Migration 018)
```sql
-- Decay points for inactive users
CREATE TABLE reputation_decay_config (
  decay_start_days INTEGER DEFAULT 90,
  decay_rate DECIMAL(3,2) DEFAULT 0.02,
  minimum_score INTEGER DEFAULT 50
);
```

**Decay Rules:**
- After 90 days of inactivity, points decay by 2% per month
- Minimum score floor of 50 points
- Encourages ongoing participation
- Prevents score squatting

#### 4. **Advanced Fraud Detection** (Migration 019)
```sql
-- ML-ready fraud scoring
CREATE TABLE fraud_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  verification_id UUID REFERENCES verifications(id),
  fraud_probability DECIMAL(3,2),
  features JSONB,
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Fraud Indicators:**
- Content similarity to known spam
- Unusual submission patterns
- Geographic anomalies
- Behavioral outliers
- Network graph analysis

#### 5. **Rate Limiting System** (Migration 020)
```sql
-- Per-user action limits
CREATE TABLE rate_limits (
  user_id UUID REFERENCES users(id),
  action_type TEXT,
  action_count INTEGER,
  window_start TIMESTAMPTZ,
  blocked_until TIMESTAMPTZ
);
```

**Rate Limits:**
- Verifications: 5 per hour, 20 per day
- Votes: 50 per hour, 200 per day
- Promises: 3 per hour, 10 per day
- Comments: 10 per hour, 50 per day (future)

#### 6. **Audit Trail Enhancement** (Migration 021)
```sql
-- Comprehensive activity logging
CREATE TABLE activity_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action_type TEXT,
  resource_type TEXT,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_user ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_ip ON activity_log(ip_address, created_at DESC);
```

**Logged Actions:**
- All submissions, votes, edits, deletions
- IP addresses and user agents
- Forensic analysis capability
- Abuse pattern detection

### Success Metrics:
- ✓ Vote brigade detection accuracy > 90%
- ✓ Trust levels update automatically within 24 hours
- ✓ Reputation decay reduces inactive high scores by 20%
- ✓ Rate limiting blocks spam attempts
- ✓ Audit trail captures 100% of actions

---

## **PHASE 3: Promise Status Updates (Automated)**
**Priority:** HIGH
**Estimated Time:** 2-3 days

### Why This Phase?
Enable automatic promise status transitions based on verification consensus, making the platform more dynamic and reducing manual work.

### Tasks:

#### 1. **Consensus Algorithm** (Migration 022)
```sql
CREATE OR REPLACE FUNCTION calculate_promise_consensus(p_promise_id UUID)
RETURNS TABLE (
  verdict TEXT,
  confidence DECIMAL(3,2),
  supporting_verifications INTEGER,
  total_weight DECIMAL(10,2)
) AS $$
-- Weighted consensus based on trust levels
-- Returns most likely verdict with confidence score
$$ LANGUAGE plpgsql;
```

**Consensus Rules:**
- Minimum 3 verifications required
- Weight by trust level (Admin 3.0x, Trusted 2.0x, etc.)
- Confidence threshold: 70% for auto-update
- Admin verifications override community consensus

#### 2. **Status Transition System**
```sql
CREATE TABLE promise_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promise_id UUID REFERENCES promises(id),
  old_status TEXT,
  new_status TEXT,
  trigger_type TEXT, -- 'manual', 'auto_consensus', 'admin_override'
  confidence_score DECIMAL(3,2),
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Transition Types:**
- `pending` → `in_progress` (verification evidence of work started)
- `in_progress` → `fulfilled` (consensus shows completion)
- `in_progress` → `stalled` (no progress for 90 days)
- `pending` → `broken` (official statement or evidence of reversal)

#### 3. **Status Update Notifications**
```sql
-- Notify promise creator and watchers
CREATE OR REPLACE FUNCTION notify_status_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, message, link)
  SELECT
    NEW.created_by,
    'promise_status_changed',
    'Promise status updated to ' || NEW.status,
    '/promises/' || NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 4. **Timeline Visualization**
- Visual timeline showing promise lifecycle
- Key milestones and verification events
- Status change history
- Evidence aggregation by verdict

### Success Metrics:
- ✓ Automatic status updates with > 70% confidence
- ✓ Manual overrides by admins always possible
- ✓ Users notified of status changes within 1 minute
- ✓ Timeline accurately reflects promise history

---

## **PHASE 4: In-App Notifications System**
**Priority:** MEDIUM-HIGH
**Estimated Time:** 2-3 days

### Why This Phase?
Users need real-time updates on their activity to stay engaged with the platform.

### Tasks:

#### 1. **Notification Bell in Header**
- Bell icon with unread count badge
- Dropdown showing recent 5 notifications
- "View All" link to notifications page
- Real-time updates using Supabase realtime

#### 2. **Notifications Page (`/notifications`)**
- List all notifications (paginated)
- Mark as read/unread
- Filter by type (all, reputation, verifications, votes, promises)
- Clear all read notifications
- Notification grouping (e.g., "3 upvotes on your verification")

#### 3. **Notification Types:**
**Existing in Database:**
- Verification approved (+10 points)
- Verification rejected (-15 points with reason)
- Reputation change (manual adjustments)
- Upvote received (+10 points)
- Downvote received (-5 points)

**New Types to Add:**
- Promise you created was verified
- Your verification reached milestones (10/25/50/100 votes)
- Trust level advancement (Community → Trusted)
- Citizen score milestones (100/250/500/1000)
- Your verification is under admin review
- Ban appeal approved/rejected
- Promise status changed

#### 4. **Real-time Subscriptions**
```typescript
// Subscribe to user's notifications
supabase
  .channel(`notifications:${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Update notification count
    // Show toast notification
  })
  .subscribe()
```

### Success Metrics:
- ✓ Notifications appear in real-time (< 1 second delay)
- ✓ Bell badge updates without page refresh
- ✓ All notification types display correctly
- ✓ Users can manage notifications effectively

---

## **PHASE 5: Comments & Discussions**
**Priority:** MEDIUM
**Estimated Time:** 2-3 days

### Why This Phase?
Enable community discussion to improve verification quality and engagement.

### Tasks:

#### 1. **Database Schema** (Migration 023)
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  target_type TEXT CHECK (target_type IN ('promise', 'verification')),
  target_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 500),
  parent_id UUID REFERENCES comments(id),
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE comment_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);
```

#### 2. **Comment Features**
- Add comments to promise pages
- Add comments to verification detail pages
- Nested replies (1 level deep only)
- Upvote/downvote comments
- Edit own comments (within 5 minutes)
- Delete own comments
- Report inappropriate comments

#### 3. **Comment Moderation (Admin)**
- View reported comments
- Delete inappropriate comments
- Ban users who repeatedly violate policy
- Comment removal reasons logged

#### 4. **UI Components**
- Comment input box (500 char limit)
- Comment thread display
- Reply button and nested display
- Vote buttons on comments
- Edit/delete buttons for own comments
- Timestamp and author display

### Success Metrics:
- ✓ Users can comment on promises and verifications
- ✓ Nested replies work correctly
- ✓ Comment voting functional
- ✓ Admins can moderate effectively

---

## **PHASE 6: Analytics & Insights Dashboard**
**Priority:** MEDIUM
**Estimated Time:** 3-4 days

### Why This Phase?
Provide data-driven insights to increase transparency and engagement.

### Tasks:

#### 1. **Platform Statistics Page (`/analytics`)**
```sql
-- Materialized view for fast analytics
CREATE MATERIALIZED VIEW platform_stats AS
SELECT
  COUNT(DISTINCT p.id) as total_promises,
  COUNT(DISTINCT v.id) as total_verifications,
  COUNT(DISTINCT vo.id) as total_votes,
  COUNT(DISTINCT u.id) as total_users,
  AVG(u.citizen_score) as avg_citizen_score,
  (COUNT(*) FILTER (WHERE v.status = 'approved')::FLOAT /
   NULLIF(COUNT(*), 0)) as approval_rate
FROM promises p
LEFT JOIN verifications v ON p.id = v.promise_id
LEFT JOIN votes vo ON v.id = vo.verification_id
LEFT JOIN users u ON v.submitted_by = u.id;

REFRESH MATERIALIZED VIEW platform_stats;
```

**Metrics:**
- Total promises tracked
- Total verifications submitted
- Total votes cast
- Total active users
- Verification approval rate
- Average citizen score

#### 2. **Politician Analytics**
- Promise fulfillment rate by politician (top 10)
- Promises by status (fulfilled/broken/in_progress/stalled)
- Most verified politicians
- Least verified politicians (need attention)

#### 3. **Party Analytics**
- Promise fulfillment rate by party
- Comparative analysis (BJP vs Congress vs AAP, etc.)
- Party bias in verifications (using vote pattern data)

#### 4. **Category Analytics**
- Promises by category (Education, Healthcare, Infrastructure)
- Fulfillment rate by category
- Most tracked categories

#### 5. **Data Visualizations**
- Pie charts (promise status distribution)
- Bar charts (fulfillment by politician/party/category)
- Line charts (promises over time)
- Heatmaps (geographic distribution)

**Libraries:**
- Recharts for charts
- React Map GL for heatmaps (future)

### Success Metrics:
- ✓ Analytics page loads in < 2 seconds
- ✓ Charts are interactive and responsive
- ✓ Data updates daily via materialized views
- ✓ Users can filter by time period

---

## **PHASE 7: Security & Performance**
**Priority:** HIGH (Before Public Launch)
**Estimated Time:** 3-4 days

### Why This Phase?
Protect against attacks and ensure platform can handle traffic.

### Tasks:

#### 1. **Security Enhancements**
- Rate limiting on API endpoints (Vercel middleware)
- CAPTCHA for signup and submissions (hCaptcha or reCAPTCHA)
- Content Security Policy (CSP) headers
- XSS prevention (sanitize user input)
- SQL injection prevention (already handled by Supabase)

#### 2. **Performance Optimization**
- Add database indexes for frequently queried fields
- Implement pagination for large lists
- Lazy load images with Next.js Image
- Add CDN caching for static assets
- Optimize database queries (EXPLAIN ANALYZE)

#### 3. **Error Monitoring**
- Set up Sentry for error tracking
- Custom error logging
- Monitor API response times
- Track user sessions

#### 4. **Load Testing**
- Test with 1000+ concurrent users
- Identify bottlenecks
- Optimize slow queries

### Success Metrics:
- ✓ API endpoints have rate limiting
- ✓ CAPTCHA prevents bot signups
- ✓ Page load time < 2 seconds
- ✓ Error monitoring captures 100% of errors
- ✓ Platform handles 1000+ concurrent users

---

## **PHASE 8: Mobile Optimization & PWA**
**Priority:** MEDIUM
**Estimated Time:** 2-3 days

### Why This Phase?
70%+ of Indian users browse on mobile devices.

### Tasks:

#### 1. **Progressive Web App (PWA)**
- Add manifest.json for installability
- Add service worker for offline support
- Cache static assets
- Add app icons (192px, 512px)
- Add splash screens

#### 2. **Mobile UI Improvements**
- Touch-friendly buttons (48x48px minimum)
- Mobile-optimized navigation (hamburger menu)
- Swipe gestures for verification cards
- Bottom navigation bar for key actions

#### 3. **Offline Support**
- Cache recently viewed promises
- Cache user profile data
- Show offline indicator
- Queue actions when offline (sync when online)

### Success Metrics:
- ✓ Users can install as PWA
- ✓ Offline mode works for cached content
- ✓ Mobile UI is touch-friendly
- ✓ Lighthouse mobile score > 90

---

## **PHASE 9: Gamification & Achievements**
**Priority:** LOW
**Estimated Time:** 2-3 days

### Tasks:

#### 1. **Achievement Badges** (Migration 024)
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  requirement JSONB
);

CREATE TABLE user_achievements (
  user_id UUID REFERENCES users(id),
  achievement_id UUID REFERENCES achievements(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);
```

#### 2. **Achievement Types:**
- **First Steps**: Submit first promise/verification
- **Fact Checker**: 10/25/50/100 approved verifications
- **Promise Hunter**: Create 10/25/50 promises
- **Community Leader**: Reach 250/500/1000 citizen score
- **Trusted Contributor**: 5 consecutive approved verifications
- **Bug Hunter**: Report fixed bug
- **Voting Champion**: Cast 100/500/1000 votes
- **Streak Master**: 7/30/90 day activity streak

#### 3. **Leaderboard Enhancements**
- Top weekly contributors
- Top monthly contributors
- Hall of fame (all-time top 10)
- Category-specific leaderboards

### Success Metrics:
- ✓ Users earn badges for achievements
- ✓ Badges display on profiles
- ✓ Leaderboard shows weekly/monthly leaders
- ✓ Increased user engagement

---

## **PHASE 10: AI/ML Features** (Future)
**Priority:** VERY LOW
**Estimated Time:** 4-6 weeks

### Tasks:

#### 1. **Automated Fact-Checking**
- Integrate with news APIs (NewsAPI, Google News)
- Cross-reference with government databases
- Sentiment analysis on evidence text
- Fact-check URLs against known fake news sites

#### 2. **Smart Recommendations**
- Suggest related promises (content similarity)
- Recommend promises needing verification
- Detect duplicate promises using NLP
- Suggest evidence sources

#### 3. **Advanced Spam Detection**
- Train ML model on flagged spam
- Auto-flag low-quality submissions
- Detect bot activity patterns
- Quality score prediction

---

## 📋 **IMMEDIATE PRIORITY ORDER**

### **Critical Path (Before Public Launch):**
1. ✅ Phase 2: Additional Anti-Gaming (3-4 days)
2. ✅ Phase 3: Promise Status Updates (2-3 days)
3. ✅ Phase 7: Security & Performance (3-4 days)
4. ✅ Phase 8: Mobile Optimization & PWA (2-3 days)

**Total:** 10-14 days before launch

### **Post-Launch Enhancements:**
5. Phase 4: Notifications (2-3 days)
6. Phase 5: Comments (2-3 days)
7. Phase 6: Analytics (3-4 days)
8. Phase 9: Gamification (2-3 days)

**Total:** 9-13 days post-launch

### **Future (Optional):**
9. Phase 10: AI/ML Features (4-6 weeks)

---

## ⏱️ **ESTIMATED TIMELINE**

### **Pre-Launch (Critical):** 10-14 days
- Phase 2: Additional Anti-Gaming
- Phase 3: Promise Status Updates
- Phase 7: Security & Performance
- Phase 8: Mobile & PWA

### **Post-Launch (Enhancements):** 9-13 days
- Phase 4: Notifications
- Phase 5: Comments
- Phase 6: Analytics
- Phase 9: Gamification

### **Future (Optional):** 4-6 weeks
- Phase 10: AI/ML Features

---

## 🎯 **SUCCESS METRICS**

### **Pre-Launch Quality:**
- ✅ Zero critical bugs
- ✅ All core features working
- ✅ Mobile-responsive on all pages
- ✅ Page load time < 2 seconds
- ✅ Security measures in place
- ✅ Error monitoring active

### **Post-Launch (Month 1):**
- 500+ registered users
- 200+ promises documented
- 500+ verifications submitted
- 2000+ votes cast
- < 5% spam/flagged content

### **Post-Launch (Month 3):**
- 2000+ registered users
- 1000+ promises documented
- 2000+ verifications submitted
- 10,000+ votes cast
- 50+ daily active users

---

**Last Updated:** November 27, 2025
**Current Status:** Phase 1 (Anti-Gaming) completed, preparing for Phase 2
