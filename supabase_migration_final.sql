-- Political Accountability Platform - Complete Supabase Migration
-- This migration should be run in your Supabase SQL Editor
-- ⚠️ Run this AFTER creating your tables from database/schema.sql

-- Step 1: Add auth_id column to users table (links Supabase auth to our users)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Step 2: Remove password-related fields (Supabase handles auth)
ALTER TABLE users
DROP COLUMN IF EXISTS password_hash,
DROP COLUMN IF EXISTS mfa_enabled,
DROP COLUMN IF EXISTS mfa_secret;

-- Step 3: Modify promises table for simplified schema
ALTER TABLE promises
DROP COLUMN IF EXISTS title,
DROP COLUMN IF EXISTS leader_name,
DROP COLUMN IF EXISTS leader_party,
DROP COLUMN IF EXISTS constituency,
DROP COLUMN IF EXISTS promised_date,
DROP COLUMN IF EXISTS target_completion_date,
DROP COLUMN IF EXISTS location,
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS metadata;

ALTER TABLE promises
ADD COLUMN IF NOT EXISTS politician_name VARCHAR(200) NOT NULL DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS promise_text TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS promise_date DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- Remove the DEFAULT after adding columns
ALTER TABLE promises
ALTER COLUMN politician_name DROP DEFAULT,
ALTER COLUMN promise_text DROP DEFAULT;

-- Update promise status enum to match our app
DROP TYPE IF EXISTS promise_status_enum CASCADE;
CREATE TYPE promise_status_enum AS ENUM ('pending', 'in_progress', 'fulfilled', 'broken', 'stalled');

ALTER TABLE promises
ALTER COLUMN status TYPE promise_status_enum USING status::text::promise_status_enum;

-- Step 4: Modify verifications table for simplified schema
ALTER TABLE verifications
DROP COLUMN IF EXISTS completion_status,
DROP COLUMN IF EXISTS quality_rating,
DROP COLUMN IF EXISTS timeline_status,
DROP COLUMN IF EXISTS budget_status,
DROP COLUMN IF EXISTS impact_rating,
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS verification_status,
DROP COLUMN IF EXISTS community_votes_for,
DROP COLUMN IF EXISTS community_votes_against,
DROP COLUMN IF EXISTS expert_reviewed,
DROP COLUMN IF EXISTS evidence_metadata;

ALTER TABLE verifications
ADD COLUMN IF NOT EXISTS verdict VARCHAR(20) NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS evidence_text TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS evidence_urls TEXT[],
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS upvotes INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS downvotes INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS fraud_flags TEXT[] DEFAULT '{}';

-- Remove defaults
ALTER TABLE verifications
ALTER COLUMN verdict DROP DEFAULT,
ALTER COLUMN evidence_text DROP DEFAULT;

-- Add constraint for verdict
ALTER TABLE verifications
ADD CONSTRAINT verifications_verdict_check
CHECK (verdict IN ('fulfilled', 'broken', 'in_progress', 'stalled'));

-- Add constraint for status
ALTER TABLE verifications
ADD CONSTRAINT verifications_status_check
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Step 5: Modify votes table for upvote/downvote system
ALTER TABLE votes
DROP COLUMN IF EXISTS vote_type,
DROP COLUMN IF EXISTS weight;

DROP TYPE IF EXISTS vote_type_enum CASCADE;
CREATE TYPE vote_type_enum AS ENUM ('upvote', 'downvote');

ALTER TABLE votes
ADD COLUMN IF NOT EXISTS vote_type vote_type_enum NOT NULL DEFAULT 'upvote';

ALTER TABLE votes
ALTER COLUMN vote_type DROP DEFAULT;

-- Step 6: Create trigger to automatically create user record when Supabase user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, username, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Step 8: RLS Policies for USERS
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- Step 9: RLS Policies for PROMISES
DROP POLICY IF EXISTS "Promises are viewable by everyone" ON promises;
CREATE POLICY "Promises are viewable by everyone" ON promises
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create promises" ON promises;
CREATE POLICY "Authenticated users can create promises" ON promises
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.id = created_by)
  );

DROP POLICY IF EXISTS "Users can update own recent promises" ON promises;
CREATE POLICY "Users can update own recent promises" ON promises
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.id = created_by)
    AND created_at > NOW() - INTERVAL '24 hours'
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.id = created_by)
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- Step 10: RLS Policies for VERIFICATIONS
DROP POLICY IF EXISTS "Verifications are viewable by everyone" ON verifications;
CREATE POLICY "Verifications are viewable by everyone" ON verifications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create verifications" ON verifications;
CREATE POLICY "Authenticated users can create verifications" ON verifications
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.id = submitted_by)
  );

DROP POLICY IF EXISTS "Users can update own pending verifications" ON verifications;
CREATE POLICY "Users can update own pending verifications" ON verifications
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.id = submitted_by)
    AND status = 'pending'
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.id = submitted_by)
    AND status = 'pending'
  );

DROP POLICY IF EXISTS "Service role can update verifications" ON verifications;
CREATE POLICY "Service role can update verifications" ON verifications
  FOR UPDATE USING (auth.jwt()->>'role' = 'service_role');

-- Step 11: RLS Policies for VOTES
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON votes;
CREATE POLICY "Votes are viewable by everyone" ON votes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create votes" ON votes;
CREATE POLICY "Authenticated users can create votes" ON votes
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.id = user_id)
  );

DROP POLICY IF EXISTS "Users can update own votes" ON votes;
CREATE POLICY "Users can update own votes" ON votes
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.id = user_id))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.id = user_id));

DROP POLICY IF EXISTS "Users can delete own votes" ON votes;
CREATE POLICY "Users can delete own votes" ON votes
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.id = user_id));

-- Step 12: RLS Policies for EVIDENCE FILES
DROP POLICY IF EXISTS "Evidence files are viewable by everyone" ON evidence_files;
CREATE POLICY "Evidence files are viewable by everyone" ON evidence_files
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can upload evidence for own verifications" ON evidence_files;
CREATE POLICY "Users can upload evidence for own verifications" ON evidence_files
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM verifications v
      JOIN users u ON u.id = v.submitted_by
      WHERE v.id = evidence_files.verification_id
      AND u.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own evidence" ON evidence_files;
CREATE POLICY "Users can delete own evidence" ON evidence_files
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM verifications v
      JOIN users u ON u.id = v.submitted_by
      WHERE v.id = evidence_files.verification_id
      AND u.auth_id = auth.uid()
      AND v.status = 'pending'
    )
  );

-- Step 13: RLS Policies for ACTIVITY LOGS
DROP POLICY IF EXISTS "Users can view own activity logs" ON activity_logs;
CREATE POLICY "Users can view own activity logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.id = user_id)
  );

DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- Step 14: Create Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('promise-images', 'promise-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence-images', 'evidence-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence-videos', 'evidence-videos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Step 15: Storage Policies for Promise Images
DROP POLICY IF EXISTS "Anyone can view promise images" ON storage.objects;
CREATE POLICY "Anyone can view promise images" ON storage.objects
  FOR SELECT USING (bucket_id = 'promise-images');

DROP POLICY IF EXISTS "Authenticated users can upload promise images" ON storage.objects;
CREATE POLICY "Authenticated users can upload promise images" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'promise-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete own promise images" ON storage.objects;
CREATE POLICY "Users can delete own promise images" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'promise-images' AND auth.uid()::text = owner);

-- Step 16: Storage Policies for Evidence Images
DROP POLICY IF EXISTS "Anyone can view evidence images" ON storage.objects;
CREATE POLICY "Anyone can view evidence images" ON storage.objects
  FOR SELECT USING (bucket_id = 'evidence-images');

DROP POLICY IF EXISTS "Authenticated users can upload evidence images" ON storage.objects;
CREATE POLICY "Authenticated users can upload evidence images" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'evidence-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete own evidence images" ON storage.objects;
CREATE POLICY "Users can delete own evidence images" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'evidence-images' AND auth.uid()::text = owner);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Main migration completed successfully!';
  RAISE NOTICE 'Next step: Run supabase_reputation_system.sql to enable reputation features';
END $$;
