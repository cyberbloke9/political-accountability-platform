-- Supabase Integration Migration
-- Adds auth_id field and enables Row Level Security

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

-- Step 4: Create trigger to automatically create user record when Supabase user signs up
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

-- Step 5: Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Step 6: Create materialized view for citizen scores (for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS citizen_scores_mv AS
SELECT 
  u.id AS user_id,
  u.username,
  u.citizen_score AS total_score,
  u.citizen_title AS title,
  u.reputation,
  COUNT(DISTINCT p.id) AS total_promises_created,
  COUNT(DISTINCT v.id) AS total_verifications_submitted,
  COUNT(DISTINCT vo.id) AS total_votes_cast,
  u.created_at AS member_since
FROM users u
LEFT JOIN promises p ON p.created_by = u.id
LEFT JOIN verifications v ON v.submitted_by = u.id
LEFT JOIN votes vo ON vo.user_id = u.id
GROUP BY u.id, u.username, u.citizen_score, u.citizen_title, u.reputation, u.created_at
ORDER BY u.citizen_score DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_citizen_scores_mv_user_id ON citizen_scores_mv(user_id);

-- Step 7: Function to refresh materialized view
CREATE OR REPLACE FUNCTION public.refresh_citizen_scores()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY citizen_scores_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Grant appropriate permissions
GRANT SELECT ON citizen_scores_mv TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_citizen_scores() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully: auth_id added, RLS enabled, triggers created';
END $$;
-- Row Level Security Policies for Political Accountability Platform

-- USERS TABLE POLICIES
CREATE POLICY "Anyone can view user profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- PROMISES TABLE POLICIES
CREATE POLICY "Promises are publicly readable" ON promises
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create promises" ON promises
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid()::text = created_by);

CREATE POLICY "Users can edit own recent promises" ON promises
  FOR UPDATE
  USING (auth.uid()::text = created_by AND created_at > NOW() - INTERVAL '24 hours')
  WITH CHECK (auth.uid()::text = created_by AND created_at > NOW() - INTERVAL '24 hours');

-- VERIFICATIONS TABLE POLICIES
CREATE POLICY "Verifications are publicly readable" ON verifications
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit verifications" ON verifications
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid()::text = submitted_by);

CREATE POLICY "Users can edit own pending verifications" ON verifications
  FOR UPDATE
  USING (auth.uid()::text = submitted_by AND verification_status = 'pending')
  WITH CHECK (auth.uid()::text = submitted_by AND verification_status = 'pending');

CREATE POLICY "Service role can update verifications" ON verifications
  FOR UPDATE USING (auth.jwt()->>'role' = 'service_role');

-- VOTES TABLE POLICIES
CREATE POLICY "Votes are publicly readable" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Users can vote on verifications" ON votes
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid()::text = user_id);

-- EVIDENCE FILES TABLE POLICIES
CREATE POLICY "Evidence files are publicly readable" ON evidence_files
  FOR SELECT USING (true);

CREATE POLICY "Users can upload evidence for own verifications" ON evidence_files
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM verifications
      WHERE verifications.id = evidence_files.verification_id
      AND verifications.submitted_by = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own evidence" ON evidence_files
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM verifications
      WHERE verifications.id = evidence_files.verification_id
      AND verifications.submitted_by = auth.uid()::text
      AND verifications.verification_status = 'pending'
    )
  );

-- ACTIVITY LOGS TABLE POLICIES
CREATE POLICY "Users can view own activity logs" ON activity_logs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- STORAGE BUCKET POLICIES
INSERT INTO storage.buckets (id, name, public) 
VALUES ('evidence-images', 'evidence-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence-videos', 'evidence-videos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view evidence images" ON storage.objects
  FOR SELECT USING (bucket_id = 'evidence-images');

CREATE POLICY "Authenticated users can upload evidence images" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'evidence-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own evidence images" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'evidence-images' AND auth.uid()::text = owner);
