-- Migration: Fraud Detection System
-- Description: Track and flag suspicious activity, vote manipulation, and low-quality content
-- Date: 2025-11-23

-- Create fraud_flags table
CREATE TABLE IF NOT EXISTS fraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_type VARCHAR(50) NOT NULL, -- 'spam', 'vote_manipulation', 'low_quality', 'duplicate', 'coordinated_voting'
  target_type VARCHAR(50) NOT NULL, -- 'verification', 'user', 'vote'
  target_id UUID NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'confirmed', 'dismissed'
  confidence_score DECIMAL(3,2) DEFAULT 0.50, -- 0.00 to 1.00
  details JSONB, -- Specific details about the flag
  auto_detected BOOLEAN DEFAULT true,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_activity_log table (for pattern analysis)
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'verification_submit', 'vote', 'comment'
  target_type VARCHAR(50),
  target_id UUID,
  ip_address VARCHAR(45), -- IPv4 or IPv6
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fraud_flags_target ON fraud_flags(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_status ON fraud_flags(status);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_severity ON fraud_flags(severity);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_created_at ON fraud_flags(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_ip ON user_activity_log(ip_address);

-- Enable RLS
ALTER TABLE fraud_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all fraud flags" ON fraud_flags;
DROP POLICY IF EXISTS "Admins can update fraud flags" ON fraud_flags;
DROP POLICY IF EXISTS "System can create fraud flags" ON fraud_flags;
DROP POLICY IF EXISTS "Only system can access activity log" ON user_activity_log;

-- RLS Policies: Only admins can view fraud flags
CREATE POLICY "Admins can view all fraud flags" ON fraud_flags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- RLS Policies: Admins can update fraud flags (review them)
CREATE POLICY "Admins can update fraud flags" ON fraud_flags
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- RLS Policies: System can create fraud flags (automated detection)
CREATE POLICY "System can create fraud flags" ON fraud_flags
  FOR INSERT WITH CHECK (true);

-- RLS Policies: Activity log is system-only
CREATE POLICY "Only system can access activity log" ON user_activity_log
  FOR ALL USING (false);

-- Function: Detect rapid verification submissions (spam detection)
CREATE OR REPLACE FUNCTION detect_rapid_submissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  submission_count INTEGER;
BEGIN
  -- Find users who submitted more than 5 verifications in the last hour
  FOR user_record IN
    SELECT
      submitted_by as user_id,
      COUNT(*) as count
    FROM verifications
    WHERE created_at > NOW() - INTERVAL '1 hour'
    GROUP BY submitted_by
    HAVING COUNT(*) > 5
  LOOP
    submission_count := user_record.count;

    -- Create fraud flag if not already flagged
    INSERT INTO fraud_flags (
      flag_type,
      target_type,
      target_id,
      severity,
      confidence_score,
      details
    )
    SELECT
      'spam',
      'user',
      user_record.user_id,
      CASE
        WHEN submission_count > 20 THEN 'critical'
        WHEN submission_count > 10 THEN 'high'
        ELSE 'medium'
      END,
      LEAST(0.50 + (submission_count::DECIMAL / 40), 0.95),
      jsonb_build_object(
        'submission_count', submission_count,
        'time_window', '1 hour',
        'detection_reason', 'Rapid verification submissions detected'
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM fraud_flags
      WHERE target_type = 'user'
      AND target_id = user_record.user_id
      AND flag_type = 'spam'
      AND status = 'pending'
      AND created_at > NOW() - INTERVAL '24 hours'
    );
  END LOOP;
END;
$$;

-- Function: Detect low-quality verifications
CREATE OR REPLACE FUNCTION detect_low_quality_verifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  verification_record RECORD;
  quality_score DECIMAL(3,2);
BEGIN
  -- Find verifications with low-quality indicators
  FOR verification_record IN
    SELECT
      id,
      evidence,
      source_url,
      LENGTH(evidence) as evidence_length
    FROM verifications
    WHERE status = 'pending'
    AND created_at > NOW() - INTERVAL '24 hours'
  LOOP
    quality_score := 0.50;

    -- Check evidence length (too short = low quality)
    IF verification_record.evidence_length < 50 THEN
      quality_score := quality_score + 0.20;
    END IF;

    -- Check if source URL is missing
    IF verification_record.source_url IS NULL OR verification_record.source_url = '' THEN
      quality_score := quality_score + 0.15;
    END IF;

    -- Check for generic phrases indicating AI-generated content
    IF verification_record.evidence ~* '(as an ai|i cannot|i apologize|furthermore|moreover|in conclusion)' THEN
      quality_score := quality_score + 0.20;
    END IF;

    -- Flag if quality score is high enough
    IF quality_score >= 0.70 THEN
      INSERT INTO fraud_flags (
        flag_type,
        target_type,
        target_id,
        severity,
        confidence_score,
        details
      )
      SELECT
        'low_quality',
        'verification',
        verification_record.id,
        CASE
          WHEN quality_score >= 0.85 THEN 'high'
          WHEN quality_score >= 0.75 THEN 'medium'
          ELSE 'low'
        END,
        quality_score,
        jsonb_build_object(
          'evidence_length', verification_record.evidence_length,
          'has_source', verification_record.source_url IS NOT NULL AND verification_record.source_url != '',
          'detection_reason', 'Low quality evidence detected'
        )
      WHERE NOT EXISTS (
        SELECT 1 FROM fraud_flags
        WHERE target_type = 'verification'
        AND target_id = verification_record.id
        AND flag_type = 'low_quality'
        AND status = 'pending'
      );
    END IF;
  END LOOP;
END;
$$;

-- Function: Detect vote manipulation patterns
CREATE OR REPLACE FUNCTION detect_vote_manipulation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  verification_record RECORD;
  recent_votes INTEGER;
  unique_voters INTEGER;
  vote_ratio DECIMAL;
BEGIN
  -- Find verifications with suspicious voting patterns
  FOR verification_record IN
    SELECT
      v.id,
      v.upvotes,
      v.downvotes,
      v.created_at
    FROM verifications v
    WHERE v.status = 'pending'
    AND v.created_at > NOW() - INTERVAL '7 days'
    AND (v.upvotes + v.downvotes) > 10
  LOOP
    -- Calculate vote ratio (extreme ratios are suspicious)
    vote_ratio := CASE
      WHEN verification_record.upvotes + verification_record.downvotes > 0
      THEN verification_record.upvotes::DECIMAL / (verification_record.upvotes + verification_record.downvotes)
      ELSE 0
    END;

    -- Flag if vote ratio is suspiciously extreme (>95% or <5%)
    IF vote_ratio > 0.95 OR vote_ratio < 0.05 THEN
      INSERT INTO fraud_flags (
        flag_type,
        target_type,
        target_id,
        severity,
        confidence_score,
        details
      )
      SELECT
        'vote_manipulation',
        'verification',
        verification_record.id,
        CASE
          WHEN vote_ratio > 0.98 OR vote_ratio < 0.02 THEN 'high'
          ELSE 'medium'
        END,
        CASE
          WHEN vote_ratio > 0.98 OR vote_ratio < 0.02 THEN 0.85
          ELSE 0.70
        END,
        jsonb_build_object(
          'vote_ratio', vote_ratio,
          'total_votes', verification_record.upvotes + verification_record.downvotes,
          'detection_reason', 'Extreme vote ratio detected'
        )
      WHERE NOT EXISTS (
        SELECT 1 FROM fraud_flags
        WHERE target_type = 'verification'
        AND target_id = verification_record.id
        AND flag_type = 'vote_manipulation'
        AND status = 'pending'
      );
    END IF;
  END LOOP;
END;
$$;

-- Function: Detect duplicate evidence (plagiarism)
CREATE OR REPLACE FUNCTION detect_duplicate_evidence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  verification_record RECORD;
  duplicate_count INTEGER;
BEGIN
  -- Find verifications with identical or very similar evidence
  FOR verification_record IN
    SELECT
      id,
      evidence
    FROM verifications
    WHERE status = 'pending'
    AND created_at > NOW() - INTERVAL '7 days'
  LOOP
    -- Count how many other verifications have the exact same evidence
    SELECT COUNT(*)
    INTO duplicate_count
    FROM verifications
    WHERE evidence = verification_record.evidence
    AND id != verification_record.id;

    -- Flag if duplicates found
    IF duplicate_count > 0 THEN
      INSERT INTO fraud_flags (
        flag_type,
        target_type,
        target_id,
        severity,
        confidence_score,
        details
      )
      SELECT
        'duplicate',
        'verification',
        verification_record.id,
        CASE
          WHEN duplicate_count > 3 THEN 'high'
          WHEN duplicate_count > 1 THEN 'medium'
          ELSE 'low'
        END,
        LEAST(0.60 + (duplicate_count::DECIMAL / 10), 0.95),
        jsonb_build_object(
          'duplicate_count', duplicate_count,
          'detection_reason', 'Duplicate evidence detected'
        )
      WHERE NOT EXISTS (
        SELECT 1 FROM fraud_flags
        WHERE target_type = 'verification'
        AND target_id = verification_record.id
        AND flag_type = 'duplicate'
        AND status = 'pending'
      );
    END IF;
  END LOOP;
END;
$$;

-- Function: Run all fraud detection algorithms
CREATE OR REPLACE FUNCTION run_fraud_detection()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Run all detection algorithms
  PERFORM detect_rapid_submissions();
  PERFORM detect_low_quality_verifications();
  PERFORM detect_vote_manipulation();
  PERFORM detect_duplicate_evidence();

  -- Log the run
  RAISE NOTICE 'Fraud detection completed at %', NOW();
END;
$$;

-- Function: Review fraud flag (admin action)
CREATE OR REPLACE FUNCTION review_fraud_flag(
  flag_id UUID,
  admin_user_id UUID,
  new_status VARCHAR(20), -- 'confirmed' or 'dismissed'
  admin_notes TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  flag_record RECORD;
BEGIN
  -- Get flag details
  SELECT * INTO flag_record
  FROM fraud_flags
  WHERE id = flag_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fraud flag not found';
  END IF;

  -- Update flag status
  UPDATE fraud_flags
  SET
    status = new_status,
    reviewed_by = admin_user_id,
    reviewed_at = NOW(),
    details = COALESCE(details, '{}'::jsonb) || jsonb_build_object('admin_notes', admin_notes)
  WHERE id = flag_id;

  -- Log admin action
  INSERT INTO admin_actions (action_type, target_type, target_id, admin_id, reason, metadata)
  VALUES (
    'review_fraud_flag',
    'fraud_flag',
    flag_id,
    admin_user_id,
    admin_notes,
    jsonb_build_object(
      'new_status', new_status,
      'flag_type', flag_record.flag_type,
      'original_target_type', flag_record.target_type,
      'original_target_id', flag_record.target_id
    )
  );

  -- If confirmed and target is a user, potentially take action
  IF new_status = 'confirmed' AND flag_record.target_type = 'user' AND flag_record.severity IN ('high', 'critical') THEN
    -- Deduct reputation points for confirmed fraud
    PERFORM update_user_reputation(
      flag_record.target_id,
      CASE
        WHEN flag_record.severity = 'critical' THEN -50
        WHEN flag_record.severity = 'high' THEN -25
        ELSE -10
      END,
      'Confirmed fraudulent activity: ' || flag_record.flag_type
    );
  END IF;
END;
$$;

-- Comments
COMMENT ON TABLE fraud_flags IS 'Tracks suspicious activity and fraud detection flags';
COMMENT ON TABLE user_activity_log IS 'Logs user activity for pattern analysis and fraud detection';
COMMENT ON FUNCTION detect_rapid_submissions() IS 'Detects users submitting verifications too rapidly (spam)';
COMMENT ON FUNCTION detect_low_quality_verifications() IS 'Detects low-quality evidence and potential AI-generated content';
COMMENT ON FUNCTION detect_vote_manipulation() IS 'Detects suspicious voting patterns and manipulation';
COMMENT ON FUNCTION detect_duplicate_evidence() IS 'Detects plagiarized or duplicate evidence';
COMMENT ON FUNCTION run_fraud_detection() IS 'Runs all fraud detection algorithms';
COMMENT ON FUNCTION review_fraud_flag(UUID, UUID, VARCHAR, TEXT) IS 'Admin reviews and confirms/dismisses fraud flags';
