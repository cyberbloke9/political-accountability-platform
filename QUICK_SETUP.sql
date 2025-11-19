-- =============================================
-- POLITICAL ACCOUNTABILITY PLATFORM
-- Complete Database Setup for Supabase
-- Run this entire file in Supabase SQL Editor
-- =============================================

-- Success message at the end will confirm everything worked!

SELECT 'Starting database setup...' AS status;

-- STEP 1: Create ENUM types
DO $$ BEGIN
  CREATE TYPE promise_status AS ENUM ('pending', 'in_progress', 'fulfilled', 'broken', 'stalled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected', 'disputed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_verdict AS ENUM ('fulfilled', 'broken', 'in_progress', 'needs_more_time');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE vote_type AS ENUM ('upvote', 'downvote');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM ('promise_created', 'verification_submitted', 'vote_cast', 'comment_posted', 'user_registered');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

SELECT 'ENUM types created' AS status;

-- STEP 2: Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  location VARCHAR(255),
  reputation INTEGER DEFAULT 0,
  citizen_score INTEGER DEFAULT 0,
  citizen_title VARCHAR(100) DEFAULT 'Novice Citizen',
  is_verified BOOLEAN DEFAULT false,
  is_moderator BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

SELECT 'Users table created' AS status;

-- STEP 3: Create promises table
CREATE TABLE IF NOT EXISTS promises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_name VARCHAR(255) NOT NULL,
  promise_text TEXT NOT NULL,
  promise_date DATE NOT NULL,
  source_url TEXT,
  category VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  status promise_status DEFAULT 'pending',
  image_url TEXT,
  view_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promises_politician ON promises(politician_name);
CREATE INDEX IF NOT EXISTS idx_promises_created_by ON promises(created_by);
CREATE INDEX IF NOT EXISTS idx_promises_status ON promises(status);

SELECT 'Promises table created' AS status;

-- STEP 4: Create verifications table
CREATE TABLE IF NOT EXISTS verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promise_id UUID NOT NULL REFERENCES promises(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verdict verification_verdict NOT NULL,
  evidence_text TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT '{}',
  status verification_status DEFAULT 'pending',
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  fraud_score INTEGER DEFAULT 0,
  fraud_flags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verifications_promise ON verifications(promise_id);
CREATE INDEX IF NOT EXISTS idx_verifications_submitted_by ON verifications(submitted_by);

SELECT 'Verifications table created' AS status;

-- STEP 5: Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
  vote_type vote_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, verification_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_verification ON votes(verification_id);

SELECT 'Votes table created' AS status;

-- STEP 6: Create evidence_files table
CREATE TABLE IF NOT EXISTS evidence_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

SELECT 'Evidence files table created' AS status;

-- STEP 7: Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);

SELECT 'Activity logs table created' AS status;

-- STEP 8: Create trigger for new user signup
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

SELECT 'Auth trigger created' AS status;

-- STEP 9: Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

SELECT 'RLS enabled on all tables' AS status;

-- STEP 10: Create RLS Policies for users
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = auth_id);

SELECT 'Users policies created' AS status;

-- STEP 11: Create RLS Policies for promises
DROP POLICY IF EXISTS "Anyone can view promises" ON promises;
CREATE POLICY "Anyone can view promises" ON promises FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create promises" ON promises;
CREATE POLICY "Authenticated users can create promises" ON promises FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own promises" ON promises;
CREATE POLICY "Users can update own promises" ON promises FOR UPDATE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = created_by));

DROP POLICY IF EXISTS "Users can delete own promises" ON promises;
CREATE POLICY "Users can delete own promises" ON promises FOR DELETE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = created_by));

SELECT 'Promises policies created' AS status;

-- STEP 12: Create RLS Policies for verifications
DROP POLICY IF EXISTS "Anyone can view verifications" ON verifications;
CREATE POLICY "Anyone can view verifications" ON verifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create verifications" ON verifications;
CREATE POLICY "Authenticated users can create verifications" ON verifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own verifications" ON verifications;
CREATE POLICY "Users can update own verifications" ON verifications FOR UPDATE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = submitted_by));

DROP POLICY IF EXISTS "Users can delete own verifications" ON verifications;
CREATE POLICY "Users can delete own verifications" ON verifications FOR DELETE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = submitted_by));

SELECT 'Verifications policies created' AS status;

-- STEP 13: Create RLS Policies for votes
DROP POLICY IF EXISTS "Anyone can view votes" ON votes;
CREATE POLICY "Anyone can view votes" ON votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create votes" ON votes;
CREATE POLICY "Authenticated users can create votes" ON votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own votes" ON votes;
CREATE POLICY "Users can update own votes" ON votes FOR UPDATE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

DROP POLICY IF EXISTS "Users can delete own votes" ON votes;
CREATE POLICY "Users can delete own votes" ON votes FOR DELETE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

SELECT 'Votes policies created' AS status;

-- STEP 14: Create RLS Policies for evidence_files
DROP POLICY IF EXISTS "Anyone can view evidence files" ON evidence_files;
CREATE POLICY "Anyone can view evidence files" ON evidence_files FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can upload evidence" ON evidence_files;
CREATE POLICY "Authenticated users can upload evidence" ON evidence_files FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own evidence" ON evidence_files;
CREATE POLICY "Users can update own evidence" ON evidence_files FOR UPDATE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = uploaded_by));

DROP POLICY IF EXISTS "Users can delete own evidence" ON evidence_files;
CREATE POLICY "Users can delete own evidence" ON evidence_files FOR DELETE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = uploaded_by));

SELECT 'Evidence files policies created' AS status;

-- STEP 15: Create RLS Policies for activity_logs
DROP POLICY IF EXISTS "Users can view own activity" ON activity_logs;
CREATE POLICY "Users can view own activity" ON activity_logs FOR SELECT USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

DROP POLICY IF EXISTS "Authenticated users can create activity" ON activity_logs;
CREATE POLICY "Authenticated users can create activity" ON activity_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

SELECT 'Activity logs policies created' AS status;

-- STEP 16: Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('promise-images', 'promise-images', true),
  ('verification-evidence', 'verification-evidence', false),
  ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

SELECT 'Storage buckets created' AS status;

-- STEP 17: Storage policies for promise-images
DROP POLICY IF EXISTS "Anyone can view promise images" ON storage.objects;
CREATE POLICY "Anyone can view promise images" ON storage.objects FOR SELECT USING (bucket_id = 'promise-images');

DROP POLICY IF EXISTS "Authenticated users can upload promise images" ON storage.objects;
CREATE POLICY "Authenticated users can upload promise images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'promise-images' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own promise images" ON storage.objects;
CREATE POLICY "Users can update own promise images" ON storage.objects FOR UPDATE USING (bucket_id = 'promise-images' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete own promise images" ON storage.objects;
CREATE POLICY "Users can delete own promise images" ON storage.objects FOR DELETE USING (bucket_id = 'promise-images' AND auth.uid() = owner);

SELECT 'Promise images storage policies created' AS status;

-- STEP 18: Storage policies for verification-evidence
DROP POLICY IF EXISTS "Users can view own evidence" ON storage.objects;
CREATE POLICY "Users can view own evidence" ON storage.objects FOR SELECT USING (bucket_id = 'verification-evidence' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Authenticated users can upload evidence" ON storage.objects;
CREATE POLICY "Authenticated users can upload evidence" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'verification-evidence' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own evidence files" ON storage.objects;
CREATE POLICY "Users can update own evidence files" ON storage.objects FOR UPDATE USING (bucket_id = 'verification-evidence' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete own evidence files" ON storage.objects;
CREATE POLICY "Users can delete own evidence files" ON storage.objects FOR DELETE USING (bucket_id = 'verification-evidence' AND auth.uid() = owner);

SELECT 'Verification evidence storage policies created' AS status;

-- STEP 19: Storage policies for user-avatars
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'user-avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'user-avatars' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'user-avatars' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'user-avatars' AND auth.uid() = owner);

SELECT 'User avatars storage policies created' AS status;

-- STEP 20: Create materialized view for leaderboard
DROP MATERIALIZED VIEW IF EXISTS citizen_scores_mv;
CREATE MATERIALIZED VIEW citizen_scores_mv AS
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

SELECT 'Materialized view created' AS status;

-- STEP 21: Refresh function
CREATE OR REPLACE FUNCTION public.refresh_citizen_scores()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY citizen_scores_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Refresh function created' AS status;

-- STEP 22: Grant permissions
GRANT SELECT ON citizen_scores_mv TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_citizen_scores() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

SELECT 'Permissions granted' AS status;

-- Final success message
SELECT '✅ DATABASE SETUP COMPLETE! All tables, RLS policies, storage buckets, and triggers created successfully.' AS status;
