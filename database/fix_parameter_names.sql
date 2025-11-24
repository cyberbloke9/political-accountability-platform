-- Fix Parameter Names to Match Frontend Calls
-- Remove p_ prefix from parameters (keep v_ for internal variables)

-- Drop existing functions
DROP FUNCTION IF EXISTS approve_verification(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS reject_verification(UUID, UUID, TEXT);

-- Function: Approve verification (FIXED - no p_ prefix on parameters)
CREATE OR REPLACE FUNCTION approve_verification(
  verification_id UUID,
  admin_user_id UUID,
  approval_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_submitter_id UUID;
  v_verification_verdict VARCHAR(50);
  v_promise_id UUID;
BEGIN
  -- Get verification details (use table alias to avoid ambiguity)
  SELECT v.submitted_by, v.verdict, v.promise_id
  INTO v_submitter_id, v_verification_verdict, v_promise_id
  FROM verifications v
  WHERE v.id = approve_verification.verification_id;

  -- Update verification status
  UPDATE verifications v
  SET status = 'approved', updated_at = NOW()
  WHERE v.id = approve_verification.verification_id;

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
    approve_verification.verification_id,
    approve_verification.admin_user_id,
    approve_verification.approval_reason,
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

-- Function: Reject verification (FIXED - no p_ prefix on parameters)
CREATE OR REPLACE FUNCTION reject_verification(
  verification_id UUID,
  admin_user_id UUID,
  rejection_reason TEXT
) RETURNS VOID AS $$
DECLARE
  v_submitter_id UUID;
  v_verification_verdict VARCHAR(50);
  v_promise_id UUID;
BEGIN
  -- Get verification details (use table alias to avoid ambiguity)
  SELECT v.submitted_by, v.verdict, v.promise_id
  INTO v_submitter_id, v_verification_verdict, v_promise_id
  FROM verifications v
  WHERE v.id = reject_verification.verification_id;

  -- Update verification status
  UPDATE verifications v
  SET status = 'rejected', updated_at = NOW()
  WHERE v.id = reject_verification.verification_id;

  -- Deduct reputation points from submitter (-15 for rejected verification)
  PERFORM update_user_reputation(
    v_submitter_id,
    -15,
    'Your verification was rejected: ' || reject_verification.rejection_reason
  );

  -- Create admin action log
  INSERT INTO admin_actions (action_type, target_type, target_id, admin_id, reason, metadata)
  VALUES (
    'reject_verification',
    'verification',
    reject_verification.verification_id,
    reject_verification.admin_user_id,
    reject_verification.rejection_reason,
    jsonb_build_object('verdict', v_verification_verdict)
  );

  -- Create notification for submitter
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    v_submitter_id,
    'verification_rejected',
    'Verification Rejected',
    'Your verification was rejected. Reason: ' || reject_verification.rejection_reason,
    '/promises/' || v_promise_id::TEXT
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION approve_verification IS 'Approve verification, update reputation, log action';
COMMENT ON FUNCTION reject_verification IS 'Reject verification, update reputation, log action';

-- Verify functions were created with correct parameter names
SELECT
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('approve_verification', 'reject_verification')
ORDER BY p.proname;
