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
