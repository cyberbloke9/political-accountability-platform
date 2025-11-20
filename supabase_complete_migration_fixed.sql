-- Supabase Complete Migration - Fixed Version
-- This migration should be run in your Supabase SQL Editor

-- Step 1: Add auth_id column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Step 2: Remove password-related fields (Supabase handles auth)
ALTER TABLE users
DROP COLUMN IF EXISTS password_hash,
DROP COLUMN IF EXISTS mfa_enabled,
DROP COLUMN IF EXISTS mfa_secret;

-- Step 3: Add fraud_flags array to verifications
ALTER TABLE verifications
ADD COLUMN IF NOT EXISTS fraud_flags TEXT[] DEFAULT '{}';

-- Step 4: Add upvotes and downvotes columns to verifications table
ALTER TABLE verifications
ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0;

-- Step 5: Create trigger to automatically create user record when Supabase user signs up
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

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Step 7: Create materialized view for citizen scores (for performance)
DROP MATERIALIZED VIEW IF EXISTS citizen_scores_mv;
CREATE MATERIALIZED VIEW citizen_scores_mv AS
SELECT
  u.id AS user_id,
  u.username,
  u.citizen_score AS total_score,
  COUNT(DISTINCT p.id) AS total_promises_created,
  COUNT(DISTINCT v.id) AS total_verifications_submitted,
  COUNT(DISTINCT vo.id) AS total_votes_cast,
  u.created_at AS member_since
FROM users u
LEFT JOIN promises p ON p.created_by = u.id
LEFT JOIN verifications v ON v.submitted_by = u.id
LEFT JOIN votes vo ON vo.user_id = u.id
GROUP BY u.id, u.username, u.citizen_score, u.created_at
ORDER BY u.citizen_score DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_citizen_scores_mv_user_id ON citizen_scores_mv(user_id);

-- Step 8: Function to refresh materialized view
CREATE OR REPLACE FUNCTION public.refresh_citizen_scores()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY citizen_scores_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Grant appropriate permissions
GRANT SELECT ON citizen_scores_mv TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_citizen_scores() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Row Level Security Policies for Political Accountability Platform

-- USERS TABLE POLICIES
DROP POLICY IF EXISTS "Anyone can view user profiles" ON users;
CREATE POLICY "Anyone can view user profiles" ON users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- PROMISES TABLE POLICIES
DROP POLICY IF EXISTS "Promises are publicly readable" ON promises;
CREATE POLICY "Promises are publicly readable" ON promises
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create promises" ON promises;
CREATE POLICY "Authenticated users can create promises" ON promises
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.id = created_by)
  );

DROP POLICY IF EXISTS "Users can edit own recent promises" ON promises;
CREATE POLICY "Users can edit own recent promises" ON promises
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.id = created_by)
    AND created_at > NOW() - INTERVAL '24 hours'
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.id = created_by)
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- VERIFICATIONS TABLE POLICIES
DROP POLICY IF EXISTS "Verifications are publicly readable" ON verifications;
CREATE POLICY "Verifications are publicly readable" ON verifications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can submit verifications" ON verifications;
CREATE POLICY "Authenticated users can submit verifications" ON verifications
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.id = submitted_by)
  );

DROP POLICY IF EXISTS "Users can edit own pending verifications" ON verifications;
CREATE POLICY "Users can edit own pending verifications" ON verifications
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

-- VOTES TABLE POLICIES
DROP POLICY IF EXISTS "Votes are publicly readable" ON votes;
CREATE POLICY "Votes are publicly readable" ON votes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can vote on verifications" ON votes;
CREATE POLICY "Users can vote on verifications" ON votes
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

-- EVIDENCE FILES TABLE POLICIES
DROP POLICY IF EXISTS "Evidence files are publicly readable" ON evidence_files;
CREATE POLICY "Evidence files are publicly readable" ON evidence_files
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

-- ACTIVITY LOGS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own activity logs" ON activity_logs;
CREATE POLICY "Users can view own activity logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.id = user_id)
  );

DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- STORAGE BUCKET CREATION
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

-- STORAGE POLICIES
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
  RAISE NOTICE 'Migration completed successfully: auth_id added, RLS enabled, triggers and policies created';
END $$;
