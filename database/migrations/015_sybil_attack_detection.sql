-- Migration: Sybil Attack Detection and Prevention
-- Description: Detect coordinated fake accounts, rapid submissions, and suspicious voting patterns
-- Date: 2025-11-25
-- Impact: Non-breaking, adds monitoring and flagging of suspicious activity

-- =====================================================
-- PART 1: Create Suspicious Activity Flags Table
-- =====================================================

-- Table to track flagged accounts and suspicious behavior
CREATE TABLE IF NOT EXISTS user_activity_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  flag_type VARCHAR(50) NOT NULL,
  flag_reason TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  auto_detected BOOLEAN DEFAULT TRUE,
  flagged_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed', 'banned')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_flags_user ON user_activity_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_flags_type ON user_activity_flags(flag_type);
CREATE INDEX IF NOT EXISTS idx_activity_flags_status ON user_activity_flags(status);
CREATE INDEX IF NOT EXISTS idx_activity_flags_severity ON user_activity_flags(severity);
CREATE INDEX IF NOT EXISTS idx_activity_flags_created ON user_activity_flags(created_at DESC);

-- Enable RLS
ALTER TABLE user_activity_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view flags
CREATE POLICY "Admins can view all flags"
  ON user_activity_flags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- RLS Policy: Only admins can insert/update flags
CREATE POLICY "Admins can manage flags"
  ON user_activity_flags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- =====================================================
-- PART 2: Voting Pattern Analysis
-- =====================================================

-- Table to track voting relationships (who votes on whose verifications)
CREATE TABLE IF NOT EXISTS voting_relationships (
  voter_id UUID REFERENCES users(id) NOT NULL,
  verification_submitter_id UUID REFERENCES users(id) NOT NULL,
  vote_count INT DEFAULT 0,
  last_vote_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (voter_id, verification_submitter_id)
);

CREATE INDEX IF NOT EXISTS idx_voting_rel_voter ON voting_relationships(voter_id);
CREATE INDEX IF NOT EXISTS idx_voting_rel_submitter ON voting_relationships(verification_submitter_id);

-- Enable RLS
ALTER TABLE voting_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view voting relationships"
  ON voting_relationships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- Trigger to track voting relationships
CREATE OR REPLACE FUNCTION track_voting_relationship()
RETURNS TRIGGER AS $$
DECLARE
  verification_submitter UUID;
BEGIN
  -- Get verification submitter
  SELECT submitted_by INTO verification_submitter
  FROM verifications
  WHERE id = NEW.verification_id;

  -- Update or insert voting relationship
  INSERT INTO voting_relationships (voter_id, verification_submitter_id, vote_count, last_vote_at)
  VALUES (NEW.user_id, verification_submitter, 1, NOW())
  ON CONFLICT (voter_id, verification_submitter_id)
  DO UPDATE SET
    vote_count = voting_relationships.vote_count + 1,
    last_vote_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_track_voting_relationship ON votes;
CREATE TRIGGER trigger_track_voting_relationship
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION track_voting_relationship();

-- =====================================================
-- PART 3: Detection Functions
-- =====================================================

-- Function 1: Detect rapid submissions (>10 verifications in 1 hour)
DROP FUNCTION IF EXISTS detect_rapid_submissions();
CREATE OR REPLACE FUNCTION detect_rapid_submissions()
RETURNS TABLE(user_id UUID, verification_count BIGINT, time_window TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.submitted_by,
    COUNT(*) as verification_count,
    'Last 1 hour' as time_window
  FROM verifications v
  WHERE v.created_at >= NOW() - INTERVAL '1 hour'
  GROUP BY v.submitted_by
  HAVING COUNT(*) >= 10;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Detect high self-verification rate (>50%)
DROP FUNCTION IF EXISTS detect_high_self_verification_rate();
CREATE OR REPLACE FUNCTION detect_high_self_verification_rate()
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  total_verifications BIGINT,
  self_verifications BIGINT,
  self_verification_percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.username::TEXT,
    COUNT(v.id) as total_verifications,
    COUNT(v.id) FILTER (WHERE v.is_self_verification = TRUE) as self_verifications,
    ROUND(
      (COUNT(v.id) FILTER (WHERE v.is_self_verification = TRUE)::DECIMAL / COUNT(v.id)) * 100,
      2
    ) as self_verification_percentage
  FROM users u
  JOIN verifications v ON u.id = v.submitted_by
  GROUP BY u.id, u.username
  HAVING COUNT(v.id) >= 3
    AND (COUNT(v.id) FILTER (WHERE v.is_self_verification = TRUE)::DECIMAL / COUNT(v.id)) > 0.5;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Detect coordinated voting (user always votes on same person's verifications)
DROP FUNCTION IF EXISTS detect_coordinated_voting();
CREATE OR REPLACE FUNCTION detect_coordinated_voting()
RETURNS TABLE(
  voter_id UUID,
  voter_name TEXT,
  target_user_id UUID,
  target_user_name TEXT,
  vote_count INT,
  suspicion_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vr.voter_id,
    u1.username::TEXT,
    vr.verification_submitter_id,
    u2.username::TEXT,
    vr.vote_count,
    -- Suspicion score: higher if many votes concentrated on one person
    ROUND(
      (vr.vote_count::DECIMAL / NULLIF(
        (SELECT SUM(vr2.vote_count) FROM voting_relationships vr2 WHERE vr2.voter_id = vr.voter_id),
        0
      )) * 100,
      2
    ) as suspicion_score
  FROM voting_relationships vr
  JOIN users u1 ON vr.voter_id = u1.id
  JOIN users u2 ON vr.verification_submitter_id = u2.id
  WHERE vr.vote_count >= 5
    AND (
      vr.vote_count::DECIMAL / NULLIF(
        (SELECT SUM(vr2.vote_count) FROM voting_relationships vr2 WHERE vr2.voter_id = vr.voter_id),
        0
      )
    ) > 0.7; -- 70% of votes go to one person
END;
$$ LANGUAGE plpgsql;

-- Function 4: Detect high rejection rate (>70% rejected)
DROP FUNCTION IF EXISTS detect_high_rejection_rate();
CREATE OR REPLACE FUNCTION detect_high_rejection_rate()
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  total_verifications BIGINT,
  rejected_verifications BIGINT,
  rejection_percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.username::TEXT,
    COUNT(v.id) as total_verifications,
    COUNT(v.id) FILTER (WHERE v.status = 'rejected') as rejected_verifications,
    ROUND(
      (COUNT(v.id) FILTER (WHERE v.status = 'rejected')::DECIMAL / COUNT(v.id)) * 100,
      2
    ) as rejection_percentage
  FROM users u
  JOIN verifications v ON u.id = v.submitted_by
  WHERE v.status IN ('approved', 'rejected')
  GROUP BY u.id, u.username
  HAVING COUNT(v.id) >= 5
    AND (COUNT(v.id) FILTER (WHERE v.status = 'rejected')::DECIMAL / COUNT(v.id)) > 0.7;
END;
$$ LANGUAGE plpgsql;

-- Function 5: Detect new accounts with rapid activity (account < 7 days, >5 verifications)
DROP FUNCTION IF EXISTS detect_suspicious_new_accounts();
CREATE OR REPLACE FUNCTION detect_suspicious_new_accounts()
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  account_age_hours INT,
  verification_count BIGINT,
  promise_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.username::TEXT,
    EXTRACT(HOUR FROM (NOW() - u.created_at))::INT as account_age_hours,
    COUNT(DISTINCT v.id) as verification_count,
    COUNT(DISTINCT pr.id) as promise_count
  FROM users u
  LEFT JOIN verifications v ON u.id = v.submitted_by
  LEFT JOIN promises pr ON u.id = pr.created_by
  WHERE u.created_at >= NOW() - INTERVAL '7 days'
  GROUP BY u.id, u.username, u.created_at
  HAVING COUNT(DISTINCT v.id) >= 5 OR COUNT(DISTINCT pr.id) >= 5;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 4: Automated Flagging Function
-- =====================================================

-- Master function to run all detection and auto-flag suspicious accounts
DROP FUNCTION IF EXISTS run_sybil_detection();
CREATE OR REPLACE FUNCTION run_sybil_detection()
RETURNS TABLE(flags_created INT) AS $$
DECLARE
  flag_count INT := 0;
  detection_record RECORD;
BEGIN
  -- Detection 1: Rapid submissions
  FOR detection_record IN SELECT * FROM detect_rapid_submissions() LOOP
    INSERT INTO user_activity_flags (user_id, flag_type, flag_reason, severity)
    VALUES (
      detection_record.user_id,
      'rapid_submissions',
      format('Submitted %s verifications in last 1 hour', detection_record.verification_count),
      'high'
    )
    ON CONFLICT DO NOTHING;
    flag_count := flag_count + 1;
  END LOOP;

  -- Detection 2: High self-verification rate
  FOR detection_record IN SELECT * FROM detect_high_self_verification_rate() LOOP
    INSERT INTO user_activity_flags (user_id, flag_type, flag_reason, severity)
    VALUES (
      detection_record.user_id,
      'high_self_verification_rate',
      format('Self-verification rate: %s%% (%s of %s verifications)',
        detection_record.self_verification_percentage,
        detection_record.self_verifications,
        detection_record.total_verifications
      ),
      'critical'
    )
    ON CONFLICT DO NOTHING;
    flag_count := flag_count + 1;
  END LOOP;

  -- Detection 3: Coordinated voting
  FOR detection_record IN SELECT * FROM detect_coordinated_voting() LOOP
    INSERT INTO user_activity_flags (user_id, flag_type, flag_reason, severity)
    VALUES (
      detection_record.voter_id,
      'coordinated_voting',
      format('Suspicious voting pattern: %s%% of votes to user %s (%s votes)',
        detection_record.suspicion_score,
        detection_record.target_user_name,
        detection_record.vote_count
      ),
      'high'
    )
    ON CONFLICT DO NOTHING;
    flag_count := flag_count + 1;
  END LOOP;

  -- Detection 4: High rejection rate
  FOR detection_record IN SELECT * FROM detect_high_rejection_rate() LOOP
    INSERT INTO user_activity_flags (user_id, flag_type, flag_reason, severity)
    VALUES (
      detection_record.user_id,
      'high_rejection_rate',
      format('Rejection rate: %s%% (%s of %s verifications rejected)',
        detection_record.rejection_percentage,
        detection_record.rejected_verifications,
        detection_record.total_verifications
      ),
      'medium'
    )
    ON CONFLICT DO NOTHING;
    flag_count := flag_count + 1;
  END LOOP;

  -- Detection 5: Suspicious new accounts
  FOR detection_record IN SELECT * FROM detect_suspicious_new_accounts() LOOP
    INSERT INTO user_activity_flags (user_id, flag_type, flag_reason, severity)
    VALUES (
      detection_record.user_id,
      'suspicious_new_account',
      format('Account age: %s hours, Activity: %s verifications, %s promises',
        detection_record.account_age_hours,
        detection_record.verification_count,
        detection_record.promise_count
      ),
      'high'
    )
    ON CONFLICT DO NOTHING;
    flag_count := flag_count + 1;
  END LOOP;

  RETURN QUERY SELECT flag_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 5: Penalty System for Flagged Accounts
-- =====================================================

-- Function to calculate citizen score penalty based on active flags
DROP FUNCTION IF EXISTS calculate_flag_penalty(UUID);
CREATE OR REPLACE FUNCTION calculate_flag_penalty(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  penalty INT := 0;
  flag_record RECORD;
BEGIN
  FOR flag_record IN
    SELECT severity, COUNT(*) as flag_count
    FROM user_activity_flags
    WHERE user_activity_flags.user_id = p_user_id
      AND status = 'active'
    GROUP BY severity
  LOOP
    -- Apply penalties based on severity
    penalty := penalty + CASE flag_record.severity
      WHEN 'critical' THEN flag_record.flag_count * 100
      WHEN 'high' THEN flag_record.flag_count * 50
      WHEN 'medium' THEN flag_record.flag_count * 25
      WHEN 'low' THEN flag_record.flag_count * 10
      ELSE 0
    END;
  END LOOP;

  RETURN penalty;
END;
$$ LANGUAGE plpgsql;

-- Update citizen score calculation to include penalties
DROP FUNCTION IF EXISTS calculate_citizen_score_with_penalties(UUID);
CREATE OR REPLACE FUNCTION calculate_citizen_score_with_penalties(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  base_score INT;
  penalty INT;
  final_score INT;
BEGIN
  -- Get base score (from previous migration)
  base_score := calculate_citizen_score(p_user_id);

  -- Get penalties
  penalty := calculate_flag_penalty(p_user_id);

  -- Calculate final score
  final_score := GREATEST(base_score - penalty, 0);

  RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 6: Admin Dashboard Views
-- =====================================================

-- View: All flagged accounts summary
CREATE OR REPLACE VIEW flagged_accounts_summary AS
SELECT
  u.id as user_id,
  u.username,
  u.email,
  u.citizen_score,
  calculate_flag_penalty(u.id) as score_penalty,
  u.citizen_score - calculate_flag_penalty(u.id) as adjusted_score,
  COUNT(f.id) as total_flags,
  COUNT(f.id) FILTER (WHERE f.status = 'active') as active_flags,
  COUNT(f.id) FILTER (WHERE f.severity = 'critical') as critical_flags,
  COUNT(f.id) FILTER (WHERE f.severity = 'high') as high_flags,
  MAX(f.created_at) as last_flagged_at,
  STRING_AGG(DISTINCT f.flag_type, ', ') as flag_types
FROM users u
JOIN user_activity_flags f ON u.id = f.user_id
GROUP BY u.id, u.username, u.email, u.citizen_score;

GRANT SELECT ON flagged_accounts_summary TO authenticated;

-- View: Recent suspicious activity
CREATE OR REPLACE VIEW recent_suspicious_activity AS
SELECT
  f.id as flag_id,
  f.user_id,
  u.username,
  f.flag_type,
  f.flag_reason,
  f.severity,
  f.status,
  f.created_at
FROM user_activity_flags f
JOIN users u ON f.user_id = u.id
WHERE f.created_at >= NOW() - INTERVAL '7 days'
ORDER BY f.created_at DESC, f.severity DESC;

GRANT SELECT ON recent_suspicious_activity TO authenticated;

-- =====================================================
-- PART 7: Admin Functions
-- =====================================================

-- Function for admins to resolve/dismiss flags
DROP FUNCTION IF EXISTS admin_resolve_flag(UUID, VARCHAR, TEXT, UUID);
CREATE OR REPLACE FUNCTION admin_resolve_flag(
  p_flag_id UUID,
  p_new_status VARCHAR(20),
  p_admin_notes TEXT,
  p_admin_id UUID
)
RETURNS VOID AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Verify caller is admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = p_admin_id
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can resolve flags';
  END IF;

  -- Update flag
  UPDATE user_activity_flags
  SET
    status = p_new_status,
    resolved_at = NOW(),
    resolved_by = p_admin_id,
    admin_notes = p_admin_notes
  WHERE id = p_flag_id;

  -- Recalculate user's citizen score if flag was resolved
  IF p_new_status IN ('resolved', 'dismissed') THEN
    UPDATE users
    SET citizen_score = calculate_citizen_score_with_penalties(
      (SELECT user_id FROM user_activity_flags WHERE id = p_flag_id)
    )
    WHERE id = (SELECT user_id FROM user_activity_flags WHERE id = p_flag_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION admin_resolve_flag FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_resolve_flag TO authenticated;

-- =====================================================
-- PART 8: Backfill Voting Relationships
-- =====================================================

-- Populate voting_relationships from existing votes
INSERT INTO voting_relationships (voter_id, verification_submitter_id, vote_count, last_vote_at)
SELECT
  vt.user_id as voter_id,
  v.submitted_by as verification_submitter_id,
  COUNT(*) as vote_count,
  MAX(vt.created_at) as last_vote_at
FROM votes vt
JOIN verifications v ON vt.verification_id = v.id
GROUP BY vt.user_id, v.submitted_by
ON CONFLICT (voter_id, verification_submitter_id) DO NOTHING;

-- =====================================================
-- PART 9: Comments and Documentation
-- =====================================================

COMMENT ON TABLE user_activity_flags IS 'Tracks suspicious user behavior for admin review';
COMMENT ON TABLE voting_relationships IS 'Tracks voting patterns to detect coordinated voting rings';
COMMENT ON FUNCTION run_sybil_detection IS 'Run all Sybil attack detection checks and auto-flag suspicious accounts';
COMMENT ON FUNCTION calculate_flag_penalty IS 'Calculate citizen score penalty based on active flags';
COMMENT ON VIEW flagged_accounts_summary IS 'Summary of all flagged accounts for admin dashboard';
COMMENT ON VIEW recent_suspicious_activity IS 'Recent suspicious activity in last 7 days';

-- =====================================================
-- VERIFICATION: Run Detection
-- =====================================================

-- Run initial detection
SELECT * FROM run_sybil_detection();

-- Show flagged accounts
SELECT
  username,
  active_flags,
  critical_flags,
  high_flags,
  score_penalty,
  adjusted_score,
  flag_types
FROM flagged_accounts_summary
ORDER BY active_flags DESC, score_penalty DESC
LIMIT 20;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Migration 015 completed successfully';
  RAISE NOTICE '✓ Sybil attack detection enabled';
  RAISE NOTICE '✓ Monitoring: rapid submissions, self-verification rate, coordinated voting, rejection rate, suspicious new accounts';
  RAISE NOTICE '✓ Penalty system active - flagged accounts have reduced citizen scores';
  RAISE NOTICE '✓ Run "SELECT * FROM run_sybil_detection()" regularly to detect new suspicious activity';
END $$;
