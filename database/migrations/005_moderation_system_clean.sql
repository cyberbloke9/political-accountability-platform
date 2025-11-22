-- Migration: Moderation System (Audit Log + Notifications) - CLEAN VERSION
-- Description: Add audit logging and in-app notifications for moderation actions
-- Run DROP_ALL_MODERATION_FUNCTIONS.sql FIRST before running this
-- Date: 2025-11-22

-- Create admin_actions table (audit log)
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table (in-app notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin actions are viewable by everyone" ON admin_actions;
DROP POLICY IF EXISTS "Only admins can create admin actions" ON admin_actions;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- RLS Policies: Admin actions viewable by everyone (transparency)
CREATE POLICY "Admin actions are viewable by everyone" ON admin_actions
  FOR SELECT USING (true);

-- RLS Policies: Only admins can create admin actions
CREATE POLICY "Only admins can create admin actions" ON admin_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- RLS Policies: Users can only view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- RLS Policies: System can create notifications (for triggers)
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- RLS Policies: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Function: Update user reputation (with specific signature)
CREATE FUNCTION update_user_reputation(
  target_user_id UUID,
  points_change INTEGER,
  reason TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Function: Approve verification
CREATE FUNCTION approve_verification(
  verification_id UUID,
  admin_user_id UUID,
  approval_reason TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Function: Reject verification
CREATE FUNCTION reject_verification(
  verification_id UUID,
  admin_user_id UUID,
  rejection_reason TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Comments
COMMENT ON TABLE admin_actions IS 'Audit log of all admin actions for transparency';
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON FUNCTION update_user_reputation(UUID, INTEGER, TEXT) IS 'Update user reputation and create notification';
COMMENT ON FUNCTION approve_verification(UUID, UUID, TEXT) IS 'Approve verification, update reputation, log action';
COMMENT ON FUNCTION reject_verification(UUID, UUID, TEXT) IS 'Reject verification, update reputation, log action';
