-- Fix Ambiguous Column References in Moderation Functions
-- The issue: variable names conflict with column names

-- Drop existing functions
DROP FUNCTION IF EXISTS approve_verification(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS reject_verification(UUID, UUID, TEXT);

-- Function: Approve verification (FIXED)
CREATE OR REPLACE FUNCTION approve_verification(
  p_verification_id UUID,
  p_admin_user_id UUID,
  p_approval_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_submitter_id UUID;
  v_verification_verdict VARCHAR(50);
  v_promise_id UUID;
BEGIN
  -- Get verification details
  SELECT v.submitted_by, v.verdict, v.promise_id
  INTO v_submitter_id, v_verification_verdict, v_promise_id
  FROM verifications v
  WHERE v.id = p_verification_id;

  -- Update verification status
  UPDATE verifications
  SET status = 'approved', updated_at = NOW()
  WHERE id = p_verification_id;

  -- Add reputation points to submitter (+10 for approved verification)
  PERFORM update_user_reputation(
    v_submitter_id,
    10,
    'Your verification was approved by an admin'
  );

  -- Create admin action log
  INSERT INTO admin_actions (action_type, target_type, target_id, admin_id, reason, metadata)
  VALUES (
    'approve_verification',
    'verification',
    p_verification_id,
    p_admin_user_id,
    p_approval_reason,
    jsonb_build_object('verdict', v_verification_verdict)
  );

  -- Create notification for submitter
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    v_submitter_id,
    'verification_approved',
    'Verification Approved',
    'Your verification has been approved by an admin.',
    '/promises/' || v_promise_id::TEXT
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Reject verification (FIXED)
CREATE OR REPLACE FUNCTION reject_verification(
  p_verification_id UUID,
  p_admin_user_id UUID,
  p_rejection_reason TEXT
) RETURNS VOID AS $$
DECLARE
  v_submitter_id UUID;
  v_verification_verdict VARCHAR(50);
  v_promise_id UUID;
BEGIN
  -- Get verification details
  SELECT v.submitted_by, v.verdict, v.promise_id
  INTO v_submitter_id, v_verification_verdict, v_promise_id
  FROM verifications v
  WHERE v.id = p_verification_id;

  -- Update verification status
  UPDATE verifications
  SET status = 'rejected', updated_at = NOW()
  WHERE id = p_verification_id;

  -- Deduct reputation points from submitter (-15 for rejected verification)
  PERFORM update_user_reputation(
    v_submitter_id,
    -15,
    'Your verification was rejected: ' || p_rejection_reason
  );

  -- Create admin action log
  INSERT INTO admin_actions (action_type, target_type, target_id, admin_id, reason, metadata)
  VALUES (
    'reject_verification',
    'verification',
    p_verification_id,
    p_admin_user_id,
    p_rejection_reason,
    jsonb_build_object('verdict', v_verification_verdict)
  );

  -- Create notification for submitter
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    v_submitter_id,
    'verification_rejected',
    'Verification Rejected',
    'Your verification was rejected. Reason: ' || p_rejection_reason,
    '/promises/' || v_promise_id::TEXT
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION approve_verification IS 'Approve verification, update reputation, log action';
COMMENT ON FUNCTION reject_verification IS 'Reject verification, update reputation, log action';

-- Verify functions were created
SELECT
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('approve_verification', 'reject_verification')
ORDER BY p.proname;
