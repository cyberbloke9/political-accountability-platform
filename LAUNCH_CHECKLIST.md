# Launch Checklist - Political Accountability Platform

## ✅ COMPLETED

### Legal Pages Updated
- ✅ Terms of Use - Comprehensive with trust levels, penalties, enforcement
- ✅ Privacy Policy - Detailed data collection, anti-gaming usage, security
- ✅ Community Guidelines - Zero tolerance policies, vote brigading detection, quality standards

### Platform Features Documented
- ✅ 100 base reputation points mentioned throughout
- ✅ Trust level system (Untrusted/Community/Trusted/Admin) fully explained
- ✅ Self-verification penalty (0.1x) documented
- ✅ Vote brigade detection methods explained
- ✅ AI content ban policy added
- ✅ Enforcement tiers and appeal process added

### Code Quality
- ✅ All Scale icons replaced with ShieldCheck
- ✅ "Made in India ❤️" added to footer
- ✅ Responsive design verified (using grid-cols-1 md:grid-cols-2)
- ✅ No internal dialogue in code or documentation
- ✅ Repository cleaned up (no unwanted files)

### Launch Materials
- ✅ Product Hunt launch copy written (One Piece-inspired)
- ✅ Reddit launch post written (r/india, r/IndiaSpeaks, r/unitedstatesofindia)
- ✅ Compelling story with technical details

### Git & Repository
- ✅ All changes committed and pushed
- ✅ Clean git history
- ✅ README updated with correct domain (https://www.political-accountability.in)
- ✅ All documentation links point to correct domain

---

## 🔧 MANUAL TASKS REQUIRED

### 1. GitHub Repository Settings
**Go to:** https://github.com/cyberbloke9/political-accountability-platform/settings

#### Update Repository Details:
- **Website:** Change from Vercel URL to `https://www.political-accountability.in`
- **Description:** "Citizen-driven platform to track political promises in India. Open-source, no ads, evidence-based accountability."
- **Topics/Tags:** Add `india`, `politics`, `accountability`, `open-source`, `nextjs`, `typescript`, `supabase`

### 2. Vercel Environment Variable (CRITICAL for Feedback Form)
**Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

**Add:**
- **Key:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** [Get from Supabase Dashboard → Settings → API → service_role key]
- **Environments:** Production, Preview, Development

**Then:** Redeploy the application

### 3. Database Cleanup (If Needed)
If you want a completely fresh start:

```sql
-- Reset all reputation scores to 100
UPDATE users SET citizen_score = 100, citizen_title = 'Citizen', updated_at = NOW();

-- Clear reputation history
DELETE FROM reputation_history;
```

---

## 🚀 LAUNCH SEQUENCE

### Product Hunt Launch

1. **Create Product Hunt Account** (if you don't have one)
2. **Go to:** https://www.producthunt.com/posts/new
3. **Use the copy from `LAUNCH_COPY.md`:**
   - Tagline: "Track political promises. Demand accountability. Built for India."
   - Short Description: Use the 260-character version
   - Full Description: Use "The Grand Line of Indian Democracy" section
4. **Add Screenshots:**
   - Homepage
   - Promise submission page
   - Verification page
   - Leaderboard
   - How It Works page
5. **Add Logo:** Your platform logo
6. **Add Links:**
   - Website: https://www.political-accountability.in
   - GitHub: https://github.com/cyberbloke9/political-accountability-platform
7. **Best Time to Launch:** Tuesday-Thursday, 12:01 AM PST (optimal visibility)

### Reddit Launch

#### r/india
1. **Title:** "I built an open-source platform to track every political promise in India. Zero tolerance for broken commitments. [OC]"
2. **Body:** Use the Reddit version from `LAUNCH_COPY.md`
3. **Flair:** `Non-Political` or `AMA` (if doing Q&A)
4. **Best Time:** Evening IST (6-9 PM) when engagement is high

#### r/IndiaSpeaks
1. Same title and body
2. **Flair:** `Politics` or `Discussion`
3. Post 1-2 hours after r/india post

#### r/unitedstatesofindia
1. Same title and body
2. **Flair:** `Politics` or `OC`
3. Post 1-2 hours after r/IndiaSpeaks

### Twitter/X Launch
Create thread:
```
🧵 After 75 years of broken political promises, I built something different.

An open-source platform where Indian citizens track EVERY political promise. Zero ads, zero BS, pure accountability.

Thread on how it works and why political parties will hate it 👇
```

Then use sections from LAUNCH_COPY.md as thread tweets.

### LinkedIn Post
Professional version:
```
Introducing Political Accountability Platform - an open-source initiative to track political promises in India.

After witnessing decades of vanishing commitments, I built a citizen-driven platform where:
- Every promise is logged with credible sources
- Community verifies with evidence
- Advanced anti-gaming prevents manipulation
- Complete transparency through open-source code

Built with Next.js 14, TypeScript, PostgreSQL. 100% open-source.

No VC funding. No ads. No compromise on accountability.

https://www.political-accountability.in
```

---

## 📧 EMAIL OUTREACH (Optional)

### Tech Journalists (India)
- The Ken
- Medianama
- Factor Daily
- TechCircle
- YourStory

**Subject:** "Open-source platform to track political promises in India - built by citizen, for citizens"

### Political Analysts
- NewsLaundry
- The Wire
- Scroll.in
- The Print

**Pitch:** Citizen-driven accountability platform with advanced anti-gaming systems

---

## 🎯 SUCCESS METRICS

### Week 1 Goals
- 100+ users signed up
- 20+ political promises submitted
- 10+ verifications submitted
- Product Hunt: 100+ upvotes
- Reddit: 500+ upvotes combined
- GitHub: 50+ stars

### Month 1 Goals
- 1,000+ users
- 100+ promises tracked
- 50+ verifications
- 5+ contributors on GitHub
- Media coverage (at least 1 article)

### Month 3 Goals
- 10,000+ users
- 500+ promises
- 200+ verifications
- Active moderation team (3-5 people)
- Regional language support planning

---

## 🔒 SECURITY CHECKLIST

Before launch:
- ✅ Environment variables secured (no secrets in code)
- ✅ HTTPS/SSL enabled
- ✅ RLS policies active
- ✅ Rate limiting configured
- ✅ Input validation on all forms
- ✅ SQL injection prevention verified
- ✅ XSS protection enabled
- ✅ CORS properly configured

---

## 📊 MONITORING

### Set Up Alerts For:
- Server errors (500s)
- Database connection issues
- High traffic spikes
- Fraud detection triggers
- Moderation queue backlog

### Track:
- Daily active users
- Promise submissions per day
- Verification submissions per day
- Voting activity
- Reputation score distribution
- Trust level distribution

---

## 🛡️ MODERATION PLAN

### Week 1
- Monitor ALL content manually
- Respond to feedback within 24 hours
- Active on platform daily

### Week 2-4
- Recruit 2-3 volunteer moderators
- Establish moderation guidelines
- Set up moderation workflow

### Month 2+
- Automated fraud detection handles most issues
- Moderators review flagged content
- Community self-moderates through voting

---

## 💡 POST-LAUNCH IMPROVEMENTS

### Phase 1 (Weeks 1-4)
- Mobile app (React Native or PWA)
- Hindi language support
- Push notifications
- Email digests

### Phase 2 (Months 2-3)
- Regional language support
- Advanced analytics dashboard
- Data export tools
- API for researchers

### Phase 3 (Months 4-6)
- Machine learning for fraud detection
- Automated fact-checking assistance
- Politician performance scorecards
- Comparative analysis tools

---

## 🎉 LAUNCH DAY CHECKLIST

**Morning:**
- [ ] Final test of all forms
- [ ] Clear test data from database
- [ ] Verify SUPABASE_SERVICE_ROLE_KEY in Vercel
- [ ] Check all external links work
- [ ] Test responsive design on mobile
- [ ] Update GitHub about section

**Launch:**
- [ ] Post on Product Hunt (12:01 AM PST ideally)
- [ ] Post on r/india (6-9 PM IST)
- [ ] Post on Twitter/X
- [ ] Post on LinkedIn
- [ ] Share in relevant WhatsApp groups
- [ ] Email tech journalists

**Monitoring:**
- [ ] Watch for errors in Vercel logs
- [ ] Monitor Supabase dashboard
- [ ] Respond to comments/questions
- [ ] Thank early supporters
- [ ] Fix critical bugs immediately

---

## 📝 IMPORTANT NOTES

1. **Be Present:** First 24 hours are critical. Respond to comments, fix bugs, engage users.

2. **Expect Attacks:** Political IT cells will test your anti-gaming systems. Your fraud detection is ready.

3. **Stay Neutral:** Do NOT take political sides. Enforce rules equally for all parties.

4. **Document Everything:** Keep transparency log updated with all moderation actions.

5. **Community First:** Listen to feedback, implement suggestions, build WITH users.

---

## 🚢 THE CREW IS READY. TIME TO SET SAIL.

**Website:** https://www.political-accountability.in
**GitHub:** https://github.com/cyberbloke9/political-accountability-platform
**Email:** support@political-accountability.in

**Made in India 🇮🇳 | Zero Tolerance for Broken Promises**

---

Good luck with the launch! The revolution will be verified. 🏴‍☠️
