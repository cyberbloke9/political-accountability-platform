# Quick Start Guide - Supabase Migration

## Overview
This project now uses Supabase for authentication, database, storage, and serverless functions.

## Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- Google Cloud Vision API key (for fraud detection)

## Setup Steps

### 1. Create Supabase Project
```
1. Go to https://supabase.com
2. Create new project: "political-accountability-platform"
3. Save your project URL and API keys
```

### 2. Configure Environment Variables

Backend (.env):
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
GOOGLE_VISION_API_KEY=your-vision-api-key
```

Frontend (.env.local):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Database Migrations
In Supabase SQL Editor, run these files in order:
1. database/schema.sql
2. database/migrations/supabase/01_add_auth_id_and_rls.sql
3. database/migrations/supabase/02_rls_policies.sql

### 4. Deploy Edge Functions
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy fraud-detection
supabase functions deploy calculate-citizen-score
supabase secrets set GOOGLE_VISION_API_KEY=your-key
```

### 5. Install Dependencies
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### 6. Run Development Servers
```bash
# Backend (Terminal 1)
cd backend && npm run dev

# Frontend (Terminal 2)
cd frontend && npm run dev
```

### 7. Test Authentication
1. Go to http://localhost:3000
2. Create an account
3. Verify email
4. Login

## New Features

### Supabase Auth
- Email/password authentication
- MFA support
- OAuth providers (Google, GitHub)
- Password reset

### Supabase Storage
- Direct file uploads from frontend
- Automatic image optimization
- CDN delivery
- Thumbnail generation

### Row Level Security
- Database-level access control
- Users can only edit their own data
- Votes are immutable
- Evidence files protected

### Realtime Features
- Live leaderboard updates
- Real-time voting counters
- Instant UI updates

### Edge Functions
- Fraud detection (Google Vision)
- Citizen score calculation
- Auto-scaling

## Key Files

### Backend
- backend/src/config/supabase.config.ts
- backend/src/middleware/supabase-auth.middleware.ts
- backend/src/utils/supabase-storage.utils.ts

### Frontend
- frontend/src/lib/supabase.ts
- frontend/src/hooks/useAuth.ts
- frontend/src/hooks/useRealtimeLeaderboard.ts
- frontend/src/hooks/useRealtimeVoting.ts
- frontend/src/hooks/useSupabaseStorage.ts

## Troubleshooting

### "Missing environment variables" error
Check that all SUPABASE_* variables are set in .env files

### "relation does not exist" error
Run database migrations in correct order

### Storage upload fails
Verify storage buckets exist and RLS policies allow upload

### Edge function timeout
Check Google Vision API key is set correctly

## Documentation

- Full Setup: SUPABASE_SETUP.md
- Migration Details: SUPABASE_MIGRATION_SUMMARY.md
- Completion Report: MIGRATION_COMPLETE.md

## Support

- Supabase Docs: https://supabase.com/docs
- Project Issues: GitHub Issues
- Supabase Community: https://discord.supabase.com

---
Last Updated: November 19, 2025
