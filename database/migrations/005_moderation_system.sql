-- Migration: Moderation System (Audit Log + Notifications)
-- Description: Add audit logging and in-app notifications for moderation actions
-- Date: 2025-11-22

-- Create admin_actions table (audit log)
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type VARCHAR(50) NOT NULL, -- approve_verification, reject_verification, ban_user, etc.
  target_type VARCHAR(50) NOT NULL, -- verification, user, promise, etc.
  target_id UUID NOT NULL,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  metadata JSONB, -- Additional data (old_status, new_status, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table (in-app notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- verification_approved, verification_rejected, reputation_change, etc.
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500), -- Optional link to relevant page
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
      WHEN points_change > 0 THEN 'Reputation Increased +'
      ELSE 'Reputation Decreased '
    END || ABS(points_change)::TEXT,
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

-- Comments
COMMENT ON TABLE admin_actions IS 'Audit log of all admin actions for transparency';
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON FUNCTION update_user_reputation IS 'Update user reputation and create notification';
COMMENT ON FUNCTION approve_verification IS 'Approve verification, update reputation, log action';
COMMENT ON FUNCTION reject_verification IS 'Reject verification, update reputation, log action';
