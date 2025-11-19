# Supabase Setup Guide

Complete guide to setting up Supabase for the Political Accountability Platform.

## 1. Create Supabase Project

### Sign up and Create Project
1. Go to https://supabase.com and sign up
2. Click "New Project"
3. Name: political-accountability-platform
4. Generate strong database password
5. Choose region closest to users
6. Wait 2-3 minutes for provisioning

### Get API Keys
Go to Settings > API and copy:
- Project URL (NEXT_PUBLIC_SUPABASE_URL)
- anon public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
- service_role key (SUPABASE_SERVICE_ROLE_KEY)

## 2. Database Setup

### Run Migrations
1. Go to SQL Editor
2. Run: database/schema.sql
3. Run: database/migrations/supabase/01_add_auth_id_and_rls.sql
4. Run: database/migrations/supabase/02_rls_policies.sql

### Verify
Check that users table has auth_id column and RLS is enabled.

## 3. Storage Buckets

Buckets are created automatically by RLS migration.
Verify in Storage section:
- evidence-images
- evidence-videos
- profile-avatars

## 4. Authentication

### Enable Email Auth
1. Go to Authentication > Providers
2. Enable Email provider
3. Customize email templates in Email Templates section

### Enable MFA (Optional)
1. Go to Authentication > Settings
2. Enable TOTP

## 5. Edge Functions

### Install Supabase CLI
npm install -g supabase

### Deploy Functions
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy fraud-detection
supabase functions deploy calculate-citizen-score

### Set Secrets
supabase secrets set GOOGLE_VISION_API_KEY=your-key

## 6. Environment Variables

### Backend .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres

### Frontend .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

## 7. Testing

Test auth, storage, and RLS using Supabase dashboard and browser console.

## Production Checklist

- Upgrade to Pro plan
- Enable backups
- Configure custom domain
- Set up monitoring
- Review RLS policies
- Enable MFA for admins

---
Last Updated: November 19, 2025
