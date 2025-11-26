-- Migration: Self-Verification Detection and Prevention
-- Description: Detect and flag when users verify their own promises to prevent gaming
-- Date: 2025-11-25
-- Impact: Non-breaking, adds tracking and reduces weight for self-verifications
-- FIXED: Use users(id) instead of auth.users(id) for foreign keys

-- =====================================================
-- PART 1: Add Self-Verification Tracking Columns
-- =====================================================

-- Add flag to verifications table
ALTER TABLE verifications
ADD COLUMN IF NOT EXISTS is_self_verification BOOLEAN DEFAULT FALSE;

-- Add column to track if this is a status update vs initial verification
ALTER TABLE verifications
ADD COLUMN IF NOT EXISTS is_status_update BOOLEAN DEFAULT FALSE;

-- Create index for fast lookup of self-verifications
CREATE INDEX IF NOT EXISTS idx_verifications_self_verification
  ON verifications(is_self_verification) WHERE is_self_verification = TRUE;

-- =====================================================
-- PART 2: Create Verification Relationships Table
-- =====================================================

-- Track relationship between promise submitter and verification submitter
CREATE TABLE IF NOT EXISTS verification_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID REFERENCES verifications(id) ON DELETE CASCADE NOT NULL,
  promise_id UUID REFERENCES promises(id) ON DELETE CASCADE NOT NULL,
  promise_submitter_id UUID REFERENCES users(id) NOT NULL,
  verification_submitter_id UUID REFERENCES users(id) NOT NULL,
  is_self_verification BOOLEAN DEFAULT FALSE,
  flagged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(verification_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vr_verification
  ON verification_relationships(verification_id);
CREATE INDEX IF NOT EXISTS idx_vr_promise
  ON verification_relationships(promise_id);
CREATE INDEX IF NOT EXISTS idx_vr_self_verify
  ON verification_relationships(is_self_verification) WHERE is_self_verification = TRUE;
CREATE INDEX IF NOT EXISTS idx_vr_promise_submitter
  ON verification_relationships(promise_submitter_id);
CREATE INDEX IF NOT EXISTS idx_vr_verification_submitter
  ON verification_relationships(verification_submitter_id);

-- Enable RLS
ALTER TABLE verification_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view relationships (transparency)
CREATE POLICY "Anyone can view verification relationships"
  ON verification_relationships FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- PART 3: Self-Verification Detection Function
-- =====================================================

-- Function to check and flag self-verification
CREATE OR REPLACE FUNCTION check_self_verification()
RETURNS TRIGGER AS $$
DECLARE
  promise_creator_id UUID;
  is_self_verify BOOLEAN := FALSE;
BEGIN
  -- Get promise creator (uses users.id from promises.created_by)
  SELECT created_by INTO promise_creator_id
  FROM promises
  WHERE id = NEW.promise_id;

  -- Check if verification submitter is same as promise creator
  IF NEW.submitted_by = promise_creator_id THEN
    is_self_verify := TRUE;

    -- Set self-verification flag
    NEW.is_self_verification := TRUE;

    -- Force manual approval (remove auto-approval for self-verifications)
    -- Even if user has high citizen score
    IF NEW.status = 'approved' THEN
      NEW.status := 'pending';
    END IF;
  ELSE
    NEW.is_self_verification := FALSE;
  END IF;

  -- Insert relationship record for tracking
  INSERT INTO verification_relationships (
    verification_id,
    promise_id,
    promise_submitter_id,
    verification_submitter_id,
    is_self_verification,
    flagged_at
  ) VALUES (
    NEW.id,
    NEW.promise_id,
    promise_creator_id,
    NEW.submitted_by,
    is_self_verify,
    CASE WHEN is_self_verify THEN NOW() ELSE NULL END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_check_self_verification ON verifications;
CREATE TRIGGER trigger_check_self_verification
  BEFORE INSERT ON verifications
  FOR EACH ROW
  EXECUTE FUNCTION check_self_verification();

-- =====================================================
-- PART 4: Backfill Existing Verifications
-- =====================================================

-- First, populate verification_relationships for existing verifications
INSERT INTO verification_relationships (
  verification_id,
  promise_id,
  promise_submitter_id,
  verification_submitter_id,
  is_self_verification,
  flagged_at
)
SELECT
  v.id,
  v.promise_id,
  p.created_by,
  v.submitted_by,
  (v.submitted_by = p.created_by) as is_self_verification,
  CASE WHEN (v.submitted_by = p.created_by) THEN v.created_at ELSE NULL END
FROM verifications v
JOIN promises p ON v.promise_id = p.id
WHERE NOT EXISTS (
  SELECT 1 FROM verification_relationships vr
  WHERE vr.verification_id = v.id
)
ON CONFLICT (verification_id) DO NOTHING;

-- Update is_self_verification flag on existing verifications
UPDATE verifications v
SET is_self_verification = vr.is_self_verification
FROM verification_relationships vr
WHERE v.id = vr.verification_id
  AND v.is_self_verification IS DISTINCT FROM vr.is_self_verification;

-- =====================================================
-- PART 5: Create View for Self-Verification Statistics
-- =====================================================

-- View to track self-verification rates per user
CREATE OR REPLACE VIEW user_self_verification_stats AS
SELECT
  u.id as user_id,
  u.email,
  u.username,
  COUNT(v.id) as total_verifications,
  COUNT(v.id) FILTER (WHERE v.is_self_verification = TRUE) as self_verifications,
  COUNT(v.id) FILTER (WHERE v.is_self_verification = FALSE) as community_verifications,
  CASE
    WHEN COUNT(v.id) > 0 THEN
      ROUND(
        (COUNT(v.id) FILTER (WHERE v.is_self_verification = TRUE)::DECIMAL / COUNT(v.id)) * 100,
        2
      )
    ELSE 0
  END as self_verification_percentage,
  MAX(v.created_at) FILTER (WHERE v.is_self_verification = TRUE) as last_self_verification_at
FROM users u
LEFT JOIN verifications v ON u.id = v.submitted_by
GROUP BY u.id, u.email, u.username;

-- Grant select on view
GRANT SELECT ON user_self_verification_stats TO authenticated;

-- =====================================================
-- PART 6: Admin Function to Review Self-Verifications
-- =====================================================

-- Function for admins to get all pending self-verifications
CREATE OR REPLACE FUNCTION get_pending_self_verifications()
RETURNS TABLE(
  verification_id UUID,
  promise_title TEXT,
  promise_submitter TEXT,
  verification_submitter TEXT,
  verdict VARCHAR(50),
  evidence_text TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  helpful_votes INT,
  not_helpful_votes INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    pr.promise_text as title,
    p1.username,
    p2.username,
    v.verdict,
    v.evidence_text,
    v.created_at,
    v.helpful_votes,
    v.not_helpful_votes
  FROM verifications v
  JOIN verification_relationships vr ON v.id = vr.verification_id
  JOIN promises pr ON v.promise_id = pr.id
  JOIN users p1 ON vr.promise_submitter_id = p1.id
  JOIN users p2 ON vr.verification_submitter_id = p2.id
  WHERE v.status = 'pending'
    AND vr.is_self_verification = TRUE
  ORDER BY v.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to admins only
REVOKE EXECUTE ON FUNCTION get_pending_self_verifications() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_pending_self_verifications() TO authenticated;

-- =====================================================
-- PART 7: Update Auto-Approval Function
-- =====================================================

-- Modify auto-approval function to NEVER auto-approve self-verifications
-- (This overrides the function from migration 010)
CREATE OR REPLACE FUNCTION auto_approve_verification()
RETURNS TRIGGER AS $$
DECLARE
  submitter_score INT;
BEGIN
  -- Only process on INSERT when status is pending
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN

    -- CRITICAL: Never auto-approve self-verifications
    IF NEW.is_self_verification = TRUE THEN
      RETURN NEW;  -- Keep as pending
    END IF;

    -- Get submitter's citizen score
    SELECT citizen_score INTO submitter_score
    FROM users
    WHERE id = NEW.submitted_by;

    -- Auto-approve if score >= 250 AND not self-verification
    IF submitter_score >= 250 THEN
      NEW.status := 'approved';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger (replaces old one)
DROP TRIGGER IF EXISTS trigger_auto_approve_verification ON verifications;
CREATE TRIGGER trigger_auto_approve_verification
  BEFORE INSERT ON verifications
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_verification();

-- =====================================================
-- PART 8: Add Comments and Documentation
-- =====================================================

COMMENT ON COLUMN verifications.is_self_verification IS 'TRUE if user verified their own promise (requires manual admin approval)';
COMMENT ON COLUMN verifications.is_status_update IS 'TRUE if this is a status update (not initial verification)';
COMMENT ON TABLE verification_relationships IS 'Tracks relationship between promise creator and verification submitter to detect self-verification';
COMMENT ON VIEW user_self_verification_stats IS 'Statistics on self-verification rate per user for admin monitoring';
COMMENT ON FUNCTION check_self_verification IS 'Automatically detects and flags self-verifications on INSERT';
COMMENT ON FUNCTION get_pending_self_verifications IS 'Admin function to list all pending self-verifications requiring review';

-- =====================================================
-- VERIFICATION: Check Migration Success
-- =====================================================

-- Verify self-verification detection
SELECT
  COUNT(*) as total_verifications,
  COUNT(*) FILTER (WHERE is_self_verification = TRUE) as self_verifications,
  COUNT(*) FILTER (WHERE is_self_verification = FALSE) as community_verifications,
  ROUND(
    (COUNT(*) FILTER (WHERE is_self_verification = TRUE)::DECIMAL /
     NULLIF(COUNT(*), 0)) * 100,
    2
  ) as self_verification_percentage
FROM verifications;

-- Show top users by self-verification rate (potential gaming)
SELECT
  username,
  total_verifications,
  self_verifications,
  self_verification_percentage
FROM user_self_verification_stats
WHERE total_verifications >= 3
ORDER BY self_verification_percentage DESC, total_verifications DESC
LIMIT 10;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Migration 013 completed successfully';
  RAISE NOTICE '✓ Self-verification detection enabled';
  RAISE NOTICE '✓ Auto-approval disabled for self-verifications';
  RAISE NOTICE '✓ All existing verifications analyzed and flagged';
END $$;
