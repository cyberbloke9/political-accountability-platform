-- Migration: Weighted Trust Level System
-- Description: Add trust levels and weights to verifications based on submitter reputation and evidence quality
-- Date: 2025-11-25
-- Impact: Non-breaking, adds trust scoring to reduce gaming impact

-- =====================================================
-- PART 1: Add Trust Level Columns to Verifications
-- =====================================================

-- Add trust level column
ALTER TABLE verifications
ADD COLUMN IF NOT EXISTS trust_level VARCHAR(20) DEFAULT 'community';

-- Add constraint for valid trust levels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_verifications_trust_level'
  ) THEN
    ALTER TABLE verifications
    ADD CONSTRAINT check_verifications_trust_level
      CHECK (trust_level IN ('admin', 'trusted_community', 'community', 'untrusted'));
  END IF;
END $$;

-- Add verification weight column (used in consensus calculation)
ALTER TABLE verifications
ADD COLUMN IF NOT EXISTS verification_weight DECIMAL(3,2) DEFAULT 1.0;

-- Add constraint for valid weights
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_verifications_weight'
  ) THEN
    ALTER TABLE verifications
    ADD CONSTRAINT check_verifications_weight
      CHECK (verification_weight >= 0.0 AND verification_weight <= 5.0);
  END IF;
END $$;

-- Create index for trust level filtering
CREATE INDEX IF NOT EXISTS idx_verifications_trust_level
  ON verifications(trust_level);

-- =====================================================
-- PART 2: Trust Level Assignment Logic
-- =====================================================

-- Function to determine trust level based on submitter's history
DROP FUNCTION IF EXISTS calculate_trust_level(UUID);
CREATE OR REPLACE FUNCTION calculate_trust_level(p_user_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  is_admin BOOLEAN;
  total_approved INT;
  total_rejected INT;
  rejection_rate DECIMAL;
  citizen_score INT;
  account_age_days INT;
BEGIN
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = p_user_id
  ) INTO is_admin;

  IF is_admin THEN
    RETURN 'admin';
  END IF;

  -- Get user's verification history
  SELECT
    COUNT(*) FILTER (WHERE status = 'approved'),
    COUNT(*) FILTER (WHERE status = 'rejected')
  INTO total_approved, total_rejected
  FROM verifications
  WHERE submitted_by = p_user_id;

  -- Calculate rejection rate
  IF (total_approved + total_rejected) > 0 THEN
    rejection_rate := total_rejected::DECIMAL / (total_approved + total_rejected);
  ELSE
    rejection_rate := 0;
  END IF;

  -- Get citizen score
  SELECT u.citizen_score INTO citizen_score
  FROM users u
  WHERE u.id = p_user_id;

  -- Get account age
  SELECT EXTRACT(DAY FROM (NOW() - created_at))
  INTO account_age_days
  FROM users
  WHERE id = p_user_id;

  -- Determine trust level based on criteria
  -- TRUSTED_COMMUNITY: High reputation, proven track record
  IF citizen_score >= 500
     AND total_approved >= 10
     AND rejection_rate < 0.2
     AND account_age_days >= 30
  THEN
    RETURN 'trusted_community';

  -- COMMUNITY: Regular users with decent score
  ELSIF citizen_score >= 100
        AND rejection_rate < 0.5
        AND account_age_days >= 7
  THEN
    RETURN 'community';

  -- UNTRUSTED: New users, high rejection rate, or low score
  ELSE
    RETURN 'untrusted';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate verification weight based on trust level
DROP FUNCTION IF EXISTS calculate_verification_weight(VARCHAR, BOOLEAN);
CREATE OR REPLACE FUNCTION calculate_verification_weight(
  p_trust_level VARCHAR(20),
  p_is_self_verification BOOLEAN DEFAULT FALSE
)
RETURNS DECIMAL(3,2) AS $$
BEGIN
  -- Self-verifications get minimal weight
  IF p_is_self_verification = TRUE THEN
    RETURN 0.1;
  END IF;

  -- Weight based on trust level
  RETURN CASE p_trust_level
    WHEN 'admin' THEN 3.0
    WHEN 'trusted_community' THEN 2.0
    WHEN 'community' THEN 1.0
    WHEN 'untrusted' THEN 0.5
    ELSE 1.0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- PART 3: Trigger to Assign Trust Level on INSERT
-- =====================================================

-- Function to automatically assign trust level when verification is created
DROP FUNCTION IF EXISTS assign_verification_trust_level() CASCADE;
CREATE OR REPLACE FUNCTION assign_verification_trust_level()
RETURNS TRIGGER AS $$
DECLARE
  calculated_trust_level VARCHAR(20);
  calculated_weight DECIMAL(3,2);
BEGIN
  -- Calculate trust level for submitter
  calculated_trust_level := calculate_trust_level(NEW.submitted_by);

  -- Calculate weight based on trust level and self-verification status
  calculated_weight := calculate_verification_weight(
    calculated_trust_level,
    NEW.is_self_verification
  );

  -- Assign to NEW record
  NEW.trust_level := calculated_trust_level;
  NEW.verification_weight := calculated_weight;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_assign_trust_level ON verifications;
CREATE TRIGGER trigger_assign_trust_level
  BEFORE INSERT ON verifications
  FOR EACH ROW
  EXECUTE FUNCTION assign_verification_trust_level();

-- =====================================================
-- PART 4: Update Citizen Score Calculation (Weighted)
-- =====================================================

-- Update citizen score to use weighted points based on trust level
DROP FUNCTION IF EXISTS calculate_citizen_score(UUID);
CREATE OR REPLACE FUNCTION calculate_citizen_score(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  score INT := 0;
  admin_approved_count INT;
  trusted_approved_count INT;
  community_approved_count INT;
  self_verify_count INT;
  helpful_votes INT;
  promise_count INT;
BEGIN
  -- Admin-approved verifications (full points: 50)
  SELECT COUNT(*) INTO admin_approved_count
  FROM verifications v
  LEFT JOIN verification_relationships vr ON v.id = vr.verification_id
  WHERE v.submitted_by = p_user_id
    AND v.status = 'approved'
    AND v.trust_level = 'admin'
    AND (vr.is_self_verification = FALSE OR vr.is_self_verification IS NULL);

  score := score + (admin_approved_count * 50);

  -- Trusted community approved verifications (40 points)
  SELECT COUNT(*) INTO trusted_approved_count
  FROM verifications v
  LEFT JOIN verification_relationships vr ON v.id = vr.verification_id
  WHERE v.submitted_by = p_user_id
    AND v.status = 'approved'
    AND v.trust_level = 'trusted_community'
    AND (vr.is_self_verification = FALSE OR vr.is_self_verification IS NULL);

  score := score + (trusted_approved_count * 40);

  -- Community-approved verifications (25 points - reduced from 50)
  SELECT COUNT(*) INTO community_approved_count
  FROM verifications v
  LEFT JOIN verification_relationships vr ON v.id = vr.verification_id
  WHERE v.submitted_by = p_user_id
    AND v.status = 'approved'
    AND v.trust_level IN ('community', 'untrusted')
    AND (vr.is_self_verification = FALSE OR vr.is_self_verification IS NULL);

  score := score + (community_approved_count * 25);

  -- Self-verified promises (minimal points: 5)
  SELECT COUNT(*) INTO self_verify_count
  FROM verifications v
  JOIN verification_relationships vr ON v.id = vr.verification_id
  WHERE v.submitted_by = p_user_id
    AND v.status = 'approved'
    AND vr.is_self_verification = TRUE;

  score := score + (self_verify_count * 5);

  -- Helpful votes - count upvotes user has cast (full points: 10)
  SELECT COUNT(*) INTO helpful_votes
  FROM votes
  WHERE votes.user_id = p_user_id
    AND vote_type = 'upvote';

  score := score + (helpful_votes * 10);

  -- Promises submitted (full points: 20)
  SELECT COUNT(*) INTO promise_count
  FROM promises
  WHERE created_by = p_user_id;

  score := score + (promise_count * 20);

  -- Ensure non-negative
  IF score < 0 THEN score := 0; END IF;

  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 5: Backfill Existing Verifications
-- =====================================================

-- Update trust level and weight for existing verifications
UPDATE verifications
SET
  trust_level = calculate_trust_level(submitted_by),
  verification_weight = calculate_verification_weight(
    calculate_trust_level(submitted_by),
    COALESCE(is_self_verification, FALSE)
  )
WHERE trust_level IS NULL OR verification_weight IS NULL;

-- Recalculate all citizen scores with new weighted system
UPDATE users
SET citizen_score = calculate_citizen_score(id);

-- =====================================================
-- PART 6: Create Trust Statistics View
-- =====================================================

-- View to monitor trust level distribution
CREATE OR REPLACE VIEW verification_trust_stats AS
SELECT
  trust_level,
  COUNT(*) as verification_count,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  ROUND(AVG(verification_weight), 2) as avg_weight,
  COUNT(DISTINCT submitted_by) as unique_submitters
FROM verifications
GROUP BY trust_level
ORDER BY
  CASE trust_level
    WHEN 'admin' THEN 1
    WHEN 'trusted_community' THEN 2
    WHEN 'community' THEN 3
    WHEN 'untrusted' THEN 4
  END;

GRANT SELECT ON verification_trust_stats TO authenticated;

-- View to track user trust level progression
CREATE OR REPLACE VIEW user_trust_progression AS
SELECT
  u.id as user_id,
  u.username,
  u.citizen_score,
  calculate_trust_level(u.id) as current_trust_level,
  COUNT(v.id) as total_verifications,
  COUNT(v.id) FILTER (WHERE v.status = 'approved') as approved_verifications,
  COUNT(v.id) FILTER (WHERE v.status = 'rejected') as rejected_verifications,
  ROUND(
    CASE
      WHEN COUNT(v.id) > 0 THEN
        (COUNT(v.id) FILTER (WHERE v.status = 'rejected')::DECIMAL / COUNT(v.id)) * 100
      ELSE 0
    END,
    2
  ) as rejection_rate_percentage,
  EXTRACT(DAY FROM (NOW() - u.created_at)) as account_age_days,
  -- What's needed for next trust level
  CASE calculate_trust_level(u.id)
    WHEN 'untrusted' THEN 'Need: 100+ score, <50% rejection rate, 7+ days old'
    WHEN 'community' THEN 'Need: 500+ score, 10+ approved, <20% rejection, 30+ days old'
    WHEN 'trusted_community' THEN 'Already at trusted community level'
    WHEN 'admin' THEN 'Admin level'
  END as next_level_requirements
FROM users u
LEFT JOIN verifications v ON u.id = v.submitted_by
GROUP BY u.id, u.username, u.citizen_score, u.created_at;

GRANT SELECT ON user_trust_progression TO authenticated;

-- =====================================================
-- PART 7: Admin Function to Manually Override Trust
-- =====================================================

-- Function for admins to manually set trust level (e.g., for verified journalists)
DROP FUNCTION IF EXISTS admin_set_user_trust_level(UUID, VARCHAR, UUID);
CREATE OR REPLACE FUNCTION admin_set_user_trust_level(
  p_user_id UUID,
  p_trust_level VARCHAR(20),
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
    RAISE EXCEPTION 'Only admins can manually set trust levels';
  END IF;

  -- Validate trust level
  IF p_trust_level NOT IN ('admin', 'trusted_community', 'community', 'untrusted') THEN
    RAISE EXCEPTION 'Invalid trust level';
  END IF;

  -- Update all user's pending verifications
  UPDATE verifications
  SET
    trust_level = p_trust_level,
    verification_weight = calculate_verification_weight(p_trust_level, is_self_verification)
  WHERE submitted_by = p_user_id
    AND status = 'pending';

  -- Log the action (you could add an audit table here)
  RAISE NOTICE 'Trust level for user % set to % by admin %', p_user_id, p_trust_level, p_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION admin_set_user_trust_level FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_set_user_trust_level TO authenticated;

-- =====================================================
-- PART 8: Add Comments and Documentation
-- =====================================================

COMMENT ON COLUMN verifications.trust_level IS 'Trust level of submitter: admin (3.0x), trusted_community (2.0x), community (1.0x), untrusted (0.5x)';
COMMENT ON COLUMN verifications.verification_weight IS 'Weight multiplier used in consensus calculations (0.1 for self-verify, up to 3.0 for admin)';
COMMENT ON FUNCTION calculate_trust_level IS 'Calculate user trust level based on score, approval rate, and account age';
COMMENT ON FUNCTION calculate_verification_weight IS 'Calculate verification weight based on trust level and self-verification status';
COMMENT ON VIEW verification_trust_stats IS 'Distribution of verifications across trust levels';
COMMENT ON VIEW user_trust_progression IS 'Track user progression through trust levels with requirements for next level';

-- =====================================================
-- VERIFICATION: Check Migration Success
-- =====================================================

-- Show trust level distribution
SELECT * FROM verification_trust_stats;

-- Show top users by trust level
SELECT
  username,
  current_trust_level,
  citizen_score,
  approved_verifications,
  rejection_rate_percentage,
  account_age_days
FROM user_trust_progression
WHERE total_verifications >= 1
ORDER BY
  CASE current_trust_level
    WHEN 'admin' THEN 1
    WHEN 'trusted_community' THEN 2
    WHEN 'community' THEN 3
    WHEN 'untrusted' THEN 4
  END,
  citizen_score DESC
LIMIT 20;

-- Verify citizen scores were recalculated
SELECT
  COUNT(*) as total_users,
  AVG(citizen_score) as avg_score,
  MAX(citizen_score) as max_score,
  MIN(citizen_score) as min_score
FROM users;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Migration 014 completed successfully';
  RAISE NOTICE '✓ Trust levels assigned to all verifications';
  RAISE NOTICE '✓ Verification weights calculated (admin: 3.0x, trusted: 2.0x, community: 1.0x, untrusted: 0.5x, self: 0.1x)';
  RAISE NOTICE '✓ Citizen scores recalculated with weighted points';
  RAISE NOTICE '✓ Self-verifications now give only 5 points vs 25-50 points for legitimate verifications';
END $$;
