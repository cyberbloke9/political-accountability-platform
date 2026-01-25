# Political Accountability Platform

A citizen-driven platform to track political promises with community verification and transparent accountability across India.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Version](https://img.shields.io/badge/Version-2.4.0-blue)](https://github.com/cyberbloke9/political-accountability-platform)

## Mission

Break the cycle of broken promises. Empower citizens to hold political leaders accountable through transparent, evidence-based tracking of political commitments.

## Live Demo

**Website:** [https://www.political-accountability.in](https://www.political-accountability.in)

## Features

### Core Features
- **Promise Tracking** - Submit, browse, and search political promises with filters
- **Community Verification** - Upload evidence and vote on verification accuracy
- **Politician Profiles** - Detailed report cards with fulfillment grades (A-F)
- **Real-time Status** - Track promises as pending, in-progress, fulfilled, or broken

### v2.4.0 Features (Latest)
- **Social Sharing** - Share promises and politicians on Twitter, Facebook, WhatsApp, LinkedIn
- **Comparison Tool** - Compare up to 4 politicians side-by-side
- **Follow System** - Follow politicians and promises for personalized updates
- **Notifications** - Real-time notification bell with customizable settings
- **Timeline Visualization** - Enhanced timeline with filters and grouping
- **Dynamic OG Images** - Beautiful preview cards when sharing links

### Engagement Features
- **Citizen Score** - Earn points for quality contributions
- **Leaderboard** - Top contributors showcase
- **Discussion Threads** - Comment and discuss on promises
- **Elections Integration** - Track election-specific promises and candidates

### Security & Anti-Gaming
- **Trust Levels** - Admin (3.0x), Trusted (2.0x), Community (1.0x), New User (0.5x)
- **Sybil Attack Detection** - Pattern recognition for coordinated attacks
- **Vote Brigade Detection** - Identifies coordinated voting groups
- **Self-Verification Prevention** - Automatic flagging with penalties
- **Fraud Detection** - Automated similarity and manipulation detection

### Transparency
- **Open Source** - Every line of code is publicly auditable
- **No Ads** - Completely ad-free platform
- **No Data Selling** - Your data stays with you
- **Public Audit Log** - All admin actions visible at /transparency

## Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Supabase account ([sign up free](https://supabase.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/cyberbloke9/political-accountability-platform.git
cd political-accountability-platform

# Install dependencies
cd frontend
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

Run the migrations in `database/migrations/` in order (001-031) in your Supabase SQL Editor.

## Project Structure

```
political-accountability-platform/
├── frontend/                 # Next.js 14 application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── comparison/  # Comparison tool
│   │   │   ├── notifications/ # Notification system
│   │   │   ├── sharing/     # Social sharing
│   │   │   ├── timeline/    # Timeline components
│   │   │   └── ...
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Utilities and configs
│   └── public/              # Static assets
├── database/
│   └── migrations/          # SQL migration files (001-031)
└── .github/                 # GitHub workflows
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Deployment | Vercel (Frontend), Supabase (Backend) |
| State | React Hooks, Context API |

## Version History

| Version | Features |
|---------|----------|
| v2.4.0 | Social Sharing, Comparison Tool, Notifications, Timeline Filters |
| v2.3.0 | Evidence Quality System, Community Notes |
| v2.2.0 | Election Integration, Constituencies, Manifestos |
| v2.1.0 | Discussion Threads, Comments, Voting |
| v2.0.0 | Follow System, Personalized Dashboard |
| v1.0.0 | Core Platform, Verification System |

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Ways to contribute:
- Report bugs and issues
- Suggest new features
- Submit pull requests
- Improve documentation
- Add translations

## Privacy & Security

- **No Data Selling** - We never sell your data
- **No Ads** - Completely ad-free
- **Open Source** - Transparent, auditable code
- **Encrypted** - HTTPS/SSL for all data
- **Secure Auth** - Supabase authentication

See our [Privacy Policy](https://www.political-accountability.in/privacy) for details.

## Contact

- **Website:** [political-accountability.in](https://www.political-accountability.in)
- **Email:** support@political-accountability.in
- **GitHub Issues:** [Report a bug](https://github.com/cyberbloke9/political-accountability-platform/issues)

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Made for the citizens of India**

*Empowering democratic accountability through technology*
