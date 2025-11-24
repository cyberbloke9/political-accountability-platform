-- Deploy Moderation Functions to Supabase
-- Run this script in your Supabase SQL Editor
-- =============================================

-- Drop existing functions if they exist (to avoid conflicts)
DROP FUNCTION IF EXISTS update_user_reputation(UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS approve_verification(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS reject_verification(UUID, UUID, TEXT);

-- Function: Update user reputation
CREATE OR REPLACE FUNCTION update_user_reputation(
  target_user_id UUID,
  points_change INTEGER,
  reason TEXT
) RETURNS VOID AS $$
BEGIN
  -- Update citizen score
  UPDATE users
  SET citizen_score = GREATEST(0, citizen_score + points_change)
  WHERE id = target_user_id;

  -- Create notification
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    target_user_id,
    'reputation_change',
    CASE
      WHEN points_change > 0 THEN 'Reputation Increased +' || points_change::TEXT
      ELSE 'Reputation Decreased ' || points_change::TEXT
    END,
    reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Approve verification
CREATE OR REPLACE FUNCTION approve_verification(
  verification_id UUID,
  admin_user_id UUID,
  approval_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  submitter_id UUID;
  verification_verdict VARCHAR(50);
  promise_id UUID;
BEGIN
  -- Get verification details
  SELECT submitted_by, verdict, promise_id
  INTO submitter_id, verification_verdict, promise_id
  FROM verifications
  WHERE id = verification_id;

  -- Update verification status
  UPDATE verifications
  SET status = 'approved', updated_at = NOW()
  WHERE id = verification_id;

  -- Add reputation points to submitter (+10 for approved verification)
  PERFORM update_user_reputation(
    submitter_id,
    10,
    'Your verification was approved by an admin'
  );

  -- Create admin action log
  INSERT INTO admin_actions (action_type, target_type, target_id, admin_id, reason, metadata)
  VALUES (
    'approve_verification',
    'verification',
    verification_id,
    admin_user_id,
    approval_reason,
    jsonb_build_object('verdict', verification_verdict)
  );

  -- Create notification for submitter
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    submitter_id,
    'verification_approved',
    'Verification Approved',
    'Your verification has been approved by an admin.',
    '/promises/' || promise_id::TEXT
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Reject verification
CREATE OR REPLACE FUNCTION reject_verification(
  verification_id UUID,
  admin_user_id UUID,
  rejection_reason TEXT
) RETURNS VOID AS $$
DECLARE
  submitter_id UUID;
  verification_verdict VARCHAR(50);
  promise_id UUID;
BEGIN
  -- Get verification details
  SELECT submitted_by, verdict, promise_id
  INTO submitter_id, verification_verdict, promise_id
  FROM verifications
  WHERE id = verification_id;

  -- Update verification status
  UPDATE verifications
  SET status = 'rejected', updated_at = NOW()
  WHERE id = verification_id;

  -- Deduct reputation points from submitter (-15 for rejected verification)
  PERFORM update_user_reputation(
    submitter_id,
    -15,
    'Your verification was rejected: ' || rejection_reason
  );

  -- Create admin action log
  INSERT INTO admin_actions (action_type, target_type, target_id, admin_id, reason, metadata)
  VALUES (
    'reject_verification',
    'verification',
    verification_id,
    admin_user_id,
    rejection_reason,
    jsonb_build_object('verdict', verification_verdict)
  );

  -- Create notification for submitter
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    submitter_id,
    'verification_rejected',
    'Verification Rejected',
    'Your verification was rejected. Reason: ' || rejection_reason,
    '/promises/' || promise_id::TEXT
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION update_user_reputation IS 'Update user reputation and create notification';
COMMENT ON FUNCTION approve_verification IS 'Approve verification, update reputation, log action';
COMMENT ON FUNCTION reject_verification IS 'Reject verification, update reputation, log action';

-- Verify functions were created
SELECT
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('update_user_reputation', 'approve_verification', 'reject_verification')
ORDER BY p.proname;
