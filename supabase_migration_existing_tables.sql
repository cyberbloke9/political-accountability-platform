-- Political Accountability Platform - Migration for EXISTING Tables
-- ⚠️ Use this if you already have tables created in your database
-- This will transform your existing schema to match the app

-- Step 1: Add auth_id column to users table (links Supabase auth to our users)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS auth_id UUID;

-- Create unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_auth_id_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Step 2: Remove password-related fields (Supabase handles auth)
ALTER TABLE users
DROP COLUMN IF EXISTS password_hash CASCADE,
DROP COLUMN IF EXISTS mfa_enabled CASCADE,
DROP COLUMN IF EXISTS mfa_secret CASCADE;

-- Step 3: Modify promises table for simplified schema
-- Drop old columns that don't match our app
ALTER TABLE promises
DROP COLUMN IF EXISTS title CASCADE,
DROP COLUMN IF EXISTS leader_name CASCADE,
DROP COLUMN IF EXISTS leader_party CASCADE,
DROP COLUMN IF EXISTS constituency CASCADE,
DROP COLUMN IF EXISTS promised_date CASCADE,
DROP COLUMN IF EXISTS target_completion_date CASCADE,
DROP COLUMN IF EXISTS location CASCADE,
DROP COLUMN IF EXISTS description CASCADE,
DROP COLUMN IF EXISTS metadata CASCADE;

-- Add new columns needed by the app
ALTER TABLE promises
ADD COLUMN IF NOT EXISTS politician_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS promise_text TEXT,
ADD COLUMN IF NOT EXISTS promise_date DATE,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Update any existing null values
UPDATE promises
SET politician_name = 'Unknown'
WHERE politician_name IS NULL;

UPDATE promises
SET promise_text = ''
WHERE promise_text IS NULL;

UPDATE promises
SET promise_date = CURRENT_DATE
WHERE promise_date IS NULL;

UPDATE promises
SET view_count = 0
WHERE view_count IS NULL;

-- Make columns NOT NULL after filling in values
ALTER TABLE promises
ALTER COLUMN politician_name SET NOT NULL,
ALTER COLUMN promise_text SET NOT NULL,
ALTER COLUMN promise_date SET NOT NULL,
ALTER COLUMN view_count SET NOT NULL;

-- Keep category column if it exists, just ensure it's the right type
ALTER TABLE promises
ALTER COLUMN category TYPE VARCHAR(100);

-- Update promise status enum to match our app
DO $$
BEGIN
  -- Drop the old enum type and create new one
  ALTER TABLE promises ALTER COLUMN status TYPE TEXT;

  DROP TYPE IF EXISTS promise_status_enum CASCADE;
  CREATE TYPE promise_status_enum AS ENUM ('pending', 'in_progress', 'fulfilled', 'broken', 'stalled');

  ALTER TABLE promises
  ALTER COLUMN status TYPE promise_status_enum
  USING CASE
    WHEN status IN ('pending', 'in_progress', 'fulfilled', 'broken') THEN status::promise_status_enum
    WHEN status = 'disputed' THEN 'pending'::promise_status_enum
    ELSE 'pending'::promise_status_enum
  END;

  ALTER TABLE promises
  ALTER COLUMN status SET DEFAULT 'pending'::promise_status_enum;
END $$;

-- Step 4: Modify verifications table for simplified schema
-- Drop old columns
ALTER TABLE verifications
DROP COLUMN IF EXISTS completion_status CASCADE,
DROP COLUMN IF EXISTS quality_rating CASCADE,
DROP COLUMN IF EXISTS timeline_status CASCADE,
DROP COLUMN IF EXISTS budget_status CASCADE,
DROP COLUMN IF EXISTS impact_rating CASCADE,
DROP COLUMN IF EXISTS description CASCADE,
DROP COLUMN IF EXISTS verification_status CASCADE,
DROP COLUMN IF EXISTS community_votes_for CASCADE,
DROP COLUMN IF EXISTS community_votes_against CASCADE,
DROP COLUMN IF EXISTS expert_reviewed CASCADE,
DROP COLUMN IF EXISTS evidence_metadata CASCADE;

-- Add new columns
ALTER TABLE verifications
ADD COLUMN IF NOT EXISTS verdict VARCHAR(20),
ADD COLUMN IF NOT EXISTS evidence_text TEXT,
ADD COLUMN IF NOT EXISTS evidence_urls TEXT[],
ADD COLUMN IF NOT EXISTS status VARCHAR(20),
ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fraud_flags TEXT[] DEFAULT '{}';

-- Update any existing null values
UPDATE verifications
SET verdict = 'in_progress'
WHERE verdict IS NULL;

UPDATE verifications
SET evidence_text = ''
WHERE evidence_text IS NULL;

UPDATE verifications
SET status = 'pending'
WHERE status IS NULL;

UPDATE verifications
SET upvotes = 0
WHERE upvotes IS NULL;

UPDATE verifications
SET downvotes = 0
WHERE downvotes IS NULL;

-- Make columns NOT NULL after filling in values
ALTER TABLE verifications
ALTER COLUMN verdict SET NOT NULL,
ALTER COLUMN evidence_text SET NOT NULL,
ALTER COLUMN status SET NOT NULL,
ALTER COLUMN upvotes SET NOT NULL,
ALTER COLUMN downvotes SET NOT NULL;

-- Add constraints
ALTER TABLE verifications
DROP CONSTRAINT IF EXISTS verifications_verdict_check;

ALTER TABLE verifications
ADD CONSTRAINT verifications_verdict_check
CHECK (verdict IN ('fulfilled', 'broken', 'in_progress', 'stalled'));

ALTER TABLE verifications
DROP CONSTRAINT IF EXISTS verifications_status_check;

ALTER TABLE verifications
ADD CONSTRAINT verifications_status_check
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Step 5: Modify votes table for upvote/downvote system
ALTER TABLE votes
DROP COLUMN IF EXISTS weight CASCADE;

-- Change vote_type if it exists as old enum
DO $$
BEGIN
  ALTER TABLE votes ALTER COLUMN vote_type TYPE TEXT;

  DROP TYPE IF EXISTS vote_type_enum CASCADE;
  CREATE TYPE vote_type_enum AS ENUM ('upvote', 'downvote');

  ALTER TABLE votes
  ALTER COLUMN vote_type TYPE vote_type_enum
  USING CASE
    WHEN vote_type = 'approve' THEN 'upvote'::vote_type_enum
    WHEN vote_type = 'reject' THEN 'downvote'::vote_type_enum
    ELSE 'upvote'::vote_type_enum
  END;
END $$;

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
  ON CONFLICT (email) DO UPDATE
  SET auth_id = EXCLUDED.auth_id,
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Sync existing auth users with users table
-- This connects any existing Supabase auth users to your users table
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN
    SELECT id, email, raw_user_meta_data
    FROM auth.users
  LOOP
    INSERT INTO public.users (auth_id, email, username, created_at, updated_at)
    VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(auth_user.raw_user_meta_data->>'username', SPLIT_PART(auth_user.email, '@', 1)),
      NOW(),
      NOW()
    )
    ON CONFLICT (email) DO UPDATE
    SET auth_id = EXCLUDED.auth_id,
        updated_at = NOW();
  END LOOP;
END $$;

-- Step 8: Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Step 9: RLS Policies for USERS
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- Step 10: RLS Policies for PROMISES
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

-- Step 11: RLS Policies for VERIFICATIONS
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

-- Step 12: RLS Policies for VOTES
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

-- Step 13: RLS Policies for EVIDENCE FILES
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

-- Step 14: RLS Policies for ACTIVITY LOGS
DROP POLICY IF EXISTS "Users can view own activity logs" ON activity_logs;
CREATE POLICY "Users can view own activity logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.id = user_id)
  );

DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- Step 15: Create Storage Buckets
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

-- Step 16: Storage Policies
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
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE 'Next step: Run supabase_reputation_system.sql to enable reputation features';
END $$;
