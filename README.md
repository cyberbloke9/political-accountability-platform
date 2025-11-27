# Political Accountability Platform 🏛️

> A citizen-driven platform to track political promises with community verification and transparent accountability across India.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)

## 🎯 Mission

Break the cycle of broken promises. Empower citizens to hold political leaders accountable through transparent, evidence-based tracking of political commitments.

## ✨ Features

### 🔍 Promise Tracking
- **Submit Promises**: Document political promises with sources and context
- **Browse & Search**: Filter by politician, party, category, status, constituency
- **Real-time Status**: Track promises as pending, in-progress, fulfilled, or broken

### ✅ Community Verification
- **Evidence Submission**: Upload documents, images, news articles as proof
- **Voting System**: Community votes on verification accuracy  
- **Reputation Scores**: Earn citizen points for quality contributions

### 🏆 Gamification
- **Citizen Titles**: Progress from Citizen → Watchdog → Guardian → Champion
- **Leaderboard**: Showcase top contributors
- **Badges & Achievements**: Recognize quality participation

### 📊 Transparency
- **Open Source**: Every line of code is publicly auditable
- **No Ads**: Completely ad-free platform
- **No Data Selling**: Your data stays with you
- **Public Verifications**: All votes and evidence are publicly visible
- **Public Audit Log**: All admin actions visible at `/transparency` (no login required)

### 🛡️ Admin & Moderation (Phase 8-9)
- **Role-Based Access**: Reviewer (L1) → Moderator (L2) → SuperAdmin (L3)
- **Fraud Detection**: Automated detection of similarity, vote manipulation, fake sources
- **Vote Pattern Analysis**: Detect partisan bias and coordinated voting
- **Reputation Engine**: Dynamic scoring based on contribution quality
- **Auto-Approval**: Trusted users (250+ score) skip manual review
- **Ban Management**: Temporary/permanent bans with appeals system
- **Complete Transparency**: All mod actions publicly logged

### 🎯 Anti-Gaming System (Phase 1-2 Anti-Gaming)
- **Trust Levels**: Admin (3.0x) → Trusted Community (2.0x) → Community (1.0x) → Untrusted (0.5x)
- **Self-Verification Detection**: Automatic flagging with 0.1x weight penalty
- **Weighted Scoring**: Verification points based on submitter trust level
- **Sybil Attack Detection**: Pattern recognition for coordinated voting, rapid submissions
- **Vote Brigade Detection**: Identifies coordinated voting groups with confidence scoring
- **Correlation Analysis**: Tracks voting patterns between user pairs
- **Velocity Detection**: Flags suspicious rapid voting (>10 votes in 5 minutes)
- **Automated Flagging**: Real-time suspicious activity monitoring
- **Trust Progression**: Clear requirements for users to advance trust levels
- **Admin Dashboards**: Flagged accounts and vote brigades with resolution tools

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm 9+
- **Supabase** account ([sign up free](https://supabase.com))
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cyberbloke9/political-accountability-platform.git
   cd political-accountability-platform
   ```

2. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the database migrations from `database/migrations/` in order:
     1. `001_initial_schema.sql` - Core tables and initial setup
     2. `002_reputation_system.sql` - Reputation system foundation
     3. `003_promise_tags.sql` - Promise tagging system
     4. `004_admin_system.sql` - Admin roles & permissions
     5. `005_moderation_system_fixed.sql` - Moderation & audit log
     6. `006_fraud_detection_fixed.sql` - Fraud detection algorithms
     7. `007_add_fraud_permission.sql` - Fraud permission setup
     8. `008_vote_pattern_analysis_fixed.sql` - Vote pattern analysis
     9. `009_reputation_engine.sql` - Reputation calculation engine
     10. `010_auto_approval_system.sql` - Auto-approval system
     11. `011_ban_management_system.sql` - Ban system with appeals
     12. `012_add_verification_hash.sql` - Cryptographic hash integrity
     13. `013_self_verification_prevention.sql` - Self-verification detection
     14. `014_weighted_trust_system.sql` - Weighted trust level system
     15. `015_sybil_attack_detection.sql` - Sybil attack prevention
     16. `016_vote_brigade_detection.sql` - Vote brigade detection schema
     17. `016_part2_brigade_detection_functions.sql` - Brigade detection algorithms
     18. `016_part3_brigade_rls_policies.sql` - Brigade security policies
     19. `016_part4_fixes.sql` - Brigade function fixes
     20. `016_part5_admin_check_fix.sql` - Admin check improvements

   Run each SQL file in the Supabase SQL Editor in sequential order

4. **Configure environment variables**
   ```bash
   cp .env.example frontend/.env.local
   ```
   
   Edit `frontend/.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

For detailed setup instructions, see [docs/SETUP.md](./docs/SETUP.md)

## 🏗️ Project Structure

```
political-accountability-platform/
├── frontend/                # Next.js 14 application
│   ├── src/
│   │   ├── app/            # App router pages
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and configs
│   └── public/             # Static assets
├── database/
│   └── migrations/         # SQL migration files
├── supabase/               # Supabase config
└── docs/                   # Documentation
```

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Backend** | Supabase (PostgreSQL + Auth + Storage) |
| **Deployment** | Vercel (Frontend), Supabase (Backend) |
| **State** | React Hooks, Context API |

## 📖 How It Works

1. **Discover Promises** - Browse political promises with filters and search
2. **Submit a Promise** - Add new promises with credible sources
3. **Verify Progress** - Upload evidence about promise fulfillment
4. **Community Voting** - Vote on verification accuracy
5. **Earn Reputation** - Build citizen score through quality contributions
6. **Track Accountability** - Monitor promise status transparently

For the detailed workflow, see [How It Works](https://your-deployment-url.vercel.app/how-it-works)

## 🤝 Contributing

We welcome contributions from developers, designers, and citizens passionate about political accountability!

**Ways to contribute:**
- 🐛 Report bugs and issues
- 💡 Suggest new features
- 🔧 Submit pull requests
- 📖 Improve documentation
- 🌐 Add translations (Hindi support coming soon!)

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## 📋 Roadmap

See [NEXT_PHASES.md](./NEXT_PHASES.md) for the complete development roadmap.

**Completed:**
- ✅ Phase 1-8: Foundation, Core Features, Admin Moderation System
- ✅ Phase 9: Verification Detail Page with Cryptographic Hash Integrity
- ✅ Phase 1 (Anti-Gaming): Complete Anti-Gaming System
  - Trust level system with weighted multipliers (Admin 3.0x → Untrusted 0.5x)
  - Self-verification detection and prevention (0.1x penalty)
  - Sybil attack detection for coordinated voting
  - Automated flagging system with severity levels
  - Trust progression display for users
  - Admin dashboard for flagged accounts
- ✅ Phase 2 Sprint 1 (Anti-Gaming): Vote Brigade Detection
  - Correlation analysis between user pairs
  - Coordinated voting group detection (>80% correlation, >5 votes in 1 min)
  - Confidence scoring algorithm (0.0-1.0)
  - Velocity-based detection (rapid voting patterns)
  - Admin review dashboard for brigades

**In Progress:**
- Phase 2 Sprint 2-6 (Anti-Gaming): Additional Enhancements
  - Trust level automation (nightly auto-updates)
  - Reputation decay system
  - Advanced fraud detection
  - Rate limiting system
  - Comprehensive audit trail

**Upcoming:**
- Phase 3: Promise Status Updates (Automated transitions)
- Phase 10: In-App Notifications & Real-time Updates
- Phase 11: Comments & Discussions
- Phase 12: Analytics & Insights Dashboard
- Phase 13: Mobile Application & PWA
- Phase 14: AI/ML Features (Fact-checking, smart recommendations)

## 🔒 Privacy & Security

- **No Data Selling**: We never sell your data
- **No Ads**: Completely ad-free experience  
- **No Tracking**: No cross-site tracking or analytics surveillance
- **Open Source**: Transparent, auditable code
- **Encrypted**: HTTPS/SSL for all data transmission
- **Secure Auth**: Supabase authentication with bcrypt password hashing

See our [Privacy Policy](https://your-deployment-url.vercel.app/privacy) for details.

## 📞 Contact & Support

- **Email**: [papsupport@gmail.com](mailto:papsupport@gmail.com)
- **Phone**: [+91 9959311144](tel:+919959311144)
- **Issues**: [GitHub Issues](https://github.com/cyberbloke9/political-accountability-platform/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with the mission to bring transparency and accountability to political promises across India.

Special thanks to all contributors who believe in the power of citizen engagement and democratic accountability.

---

**Made with ❤️ for the citizens of India**

[Website](https://your-deployment-url.vercel.app) • [GitHub](https://github.com/cyberbloke9/political-accountability-platform) • [Documentation](./docs)
