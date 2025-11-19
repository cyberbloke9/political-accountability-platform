# Supabase Deployment Guide

Complete guide to deploy the Political Accountability Platform to production.

## Architecture

- **Frontend**: Vercel (Next.js 14)
- **Backend**: Supabase (Database + Auth + Storage + Realtime + Edge Functions)

No separate backend server needed!

## Prerequisites

1. Supabase project created: `avxuugbgewmiccgteghi`
2. Environment variables configured (see ENV_SETUP_GUIDE.md)
3. Missing: SUPABASE_SERVICE_ROLE_KEY and database password

## Quick Start

### Get Missing Credentials

1. **SERVICE_ROLE_KEY**: https://supabase.com/dashboard/project/avxuugbgewmiccgteghi/settings/api
2. **Database password**: From project creation (or reset in Settings → Database)

### Run Migrations

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
```

Then run in Supabase SQL Editor:
- `database/migrations/supabase/01_add_auth_id_and_rls.sql`
- `database/migrations/supabase/02_rls_policies.sql`

### Create Storage Buckets

In Supabase SQL Editor:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('promise-images', 'promise-images', true),
  ('verification-evidence', 'verification-evidence', false),
  ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;
```

### Test Locally

```bash
cd frontend
npm run dev
```

Visit http://localhost:3000 and test signup/login.

### Deploy to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# Deploy via Vercel Dashboard
# Go to: https://vercel.com/new
# Import your GitHub repository
# Set Root Directory: frontend
# Add environment variables from frontend/.env.local
```

### Configure Supabase for Production

1. **CORS**: Add Vercel URL to Supabase Settings → API → Additional allowed origins
2. **Auth URLs**: Add Vercel URL to Auth → URL Configuration → Redirect URLs

## Production URLs

- Vercel: https://[your-app].vercel.app
- Supabase Dashboard: https://supabase.com/dashboard/project/avxuugbgewmiccgteghi

## Cost

- Free tier: $0/month (50K MAU, 500MB DB, 1GB storage)
- Pro tier: $25/month (Unlimited MAU, 8GB DB, 100GB storage)

For full details, see complete documentation in ENV_SETUP_GUIDE.md and SUPABASE_SETUP.md.
