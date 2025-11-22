-- Migration: Reputation Calculation Engine
-- Description: Automated rule-based reputation system with history tracking and decay
-- Date: 2025-11-23

-- Create reputation_rules table (configurable rules)
CREATE TABLE IF NOT EXISTS reputation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(100) NOT NULL UNIQUE,
  event_type VARCHAR(50) NOT NULL, -- 'verification_submitted', 'verification_approved', 'verification_rejected', 'helpful_vote', 'unhelpful_vote'
  points_change INTEGER NOT NULL, -- Can be positive or negative
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reputation_history table (audit trail of all changes)
CREATE TABLE IF NOT EXISTS reputation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL,
  reason VARCHAR(200) NOT NULL,
  event_type VARCHAR(50), -- Links to reputation_rules.event_type
  related_id UUID, -- ID of related entity (verification_id, vote_id, etc.)
  previous_score INTEGER NOT NULL,
  new_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_activity_status table (for decay tracking)
CREATE TABLE IF NOT EXISTS user_activity_status (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_verification_at TIMESTAMP WITH TIME ZONE,
  last_vote_at TIMESTAMP WITH TIME ZONE,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  total_verifications INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  inactive_days INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reputation_history_user_id ON reputation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_history_created_at ON reputation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reputation_history_event_type ON reputation_history(event_type);
CREATE INDEX IF NOT EXISTS idx_reputation_rules_event_type ON reputation_rules(event_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_status_last_active ON user_activity_status(last_active_at);

-- Enable RLS
ALTER TABLE reputation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_status ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Reputation rules viewable by everyone" ON reputation_rules;
DROP POLICY IF EXISTS "Only SuperAdmins can modify reputation rules" ON reputation_rules;
DROP POLICY IF EXISTS "Reputation history viewable by everyone" ON reputation_history;
DROP POLICY IF EXISTS "System can insert reputation history" ON reputation_history;
DROP POLICY IF EXISTS "Activity status viewable by everyone" ON user_activity_status;
DROP POLICY IF EXISTS "System can manage activity status" ON user_activity_status;

-- RLS Policies: Reputation rules are public (transparency)
CREATE POLICY "Reputation rules viewable by everyone" ON reputation_rules
  FOR SELECT USING (true);

-- RLS Policies: Only SuperAdmins can modify reputation rules
CREATE POLICY "Only SuperAdmins can modify reputation rules" ON reputation_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN admin_roles ar ON ur.role_id = ar.id
      WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
      AND ar.level = 3
    )
  );

-- RLS Policies: Reputation history is public (transparency)
CREATE POLICY "Reputation history viewable by everyone" ON reputation_history
  FOR SELECT USING (true);

-- RLS Policies: System can insert reputation history
CREATE POLICY "System can insert reputation history" ON reputation_history
  FOR INSERT WITH CHECK (true);

-- RLS Policies: Activity status is public
CREATE POLICY "Activity status viewable by everyone" ON user_activity_status
  FOR SELECT USING (true);

-- RLS Policies: System can manage activity status
CREATE POLICY "System can manage activity status" ON user_activity_status
  FOR ALL USING (true);

-- Seed default reputation rules
INSERT INTO reputation_rules (rule_name, event_type, points_change, description) VALUES
  ('verification_submitted', 'verification_submitted', 1, 'User submits a verification for review'),
  ('verification_approved', 'verification_approved', 10, 'User''s verification is approved by admin'),
  ('verification_rejected', 'verification_rejected', -15, 'User''s verification is rejected by admin'),
  ('helpful_vote_received', 'helpful_vote_received', 1, 'User''s verification receives an upvote'),
  ('unhelpful_vote_received', 'unhelpful_vote_received', -1, 'User''s verification receives a downvote'),
  ('fraud_confirmed', 'fraud_confirmed', -50, 'User flagged for confirmed fraudulent activity')
ON CONFLICT (rule_name) DO NOTHING;

-- Function: Update reputation with history tracking
CREATE OR REPLACE FUNCTION update_reputation_with_history(
  target_user_id UUID,
  points_change INTEGER,
  reason VARCHAR(200),
  event_type VARCHAR(50) DEFAULT NULL,
  related_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  previous_score INTEGER;
  new_score INTEGER;
BEGIN
  -- Get current score
  SELECT citizen_score INTO previous_score
  FROM users
  WHERE id = target_user_id;

  -- Calculate new score (minimum 0)
  new_score := GREATEST(0, previous_score + points_change);

  -- Update user score
  UPDATE users
  SET citizen_score = new_score,
      updated_at = NOW()
  WHERE id = target_user_id;

  -- Insert into history
  INSERT INTO reputation_history (
    user_id,
    points_change,
    reason,
    event_type,
    related_id,
    previous_score,
    new_score
  )
  VALUES (
    target_user_id,
    points_change,
    reason,
    event_type,
    related_id,
    previous_score,
    new_score
  );

  -- Update notification if points changed significantly (>5)
  IF ABS(points_change) >= 5 THEN
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
  END IF;
END;
$$;

-- Trigger Function: Auto-update reputation on verification approval
CREATE OR REPLACE FUNCTION trigger_reputation_on_verification_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  points INTEGER;
BEGIN
  -- Only trigger when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Get points from rules
    SELECT points_change INTO points
    FROM reputation_rules
    WHERE event_type = 'verification_approved' AND enabled = true;

    IF points IS NOT NULL THEN
      PERFORM update_reputation_with_history(
        NEW.submitted_by,
        points,
        'Verification approved by admin',
        'verification_approved',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger Function: Auto-update reputation on verification rejection
CREATE OR REPLACE FUNCTION trigger_reputation_on_verification_rejection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  points INTEGER;
BEGIN
  -- Only trigger when status changes to 'rejected'
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    -- Get points from rules
    SELECT points_change INTO points
    FROM reputation_rules
    WHERE event_type = 'verification_rejected' AND enabled = true;

    IF points IS NOT NULL THEN
      PERFORM update_reputation_with_history(
        NEW.submitted_by,
        points,
        'Verification rejected by admin',
        'verification_rejected',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger Function: Auto-update reputation on verification submission
CREATE OR REPLACE FUNCTION trigger_reputation_on_verification_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  points INTEGER;
BEGIN
  -- Get points from rules
  SELECT points_change INTO points
  FROM reputation_rules
  WHERE event_type = 'verification_submitted' AND enabled = true;

  IF points IS NOT NULL THEN
    PERFORM update_reputation_with_history(
      NEW.submitted_by,
      points,
      'Verification submitted for review',
      'verification_submitted',
      NEW.id
    );
  END IF;

  -- Update activity status
  INSERT INTO user_activity_status (user_id, last_verification_at, last_active_at, total_verifications)
  VALUES (NEW.submitted_by, NOW(), NOW(), 1)
  ON CONFLICT (user_id) DO UPDATE
  SET last_verification_at = NOW(),
      last_active_at = NOW(),
      total_verifications = user_activity_status.total_verifications + 1,
      inactive_days = 0,
      updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Trigger Function: Auto-update reputation on vote received
CREATE OR REPLACE FUNCTION trigger_reputation_on_vote_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  verification_submitter UUID;
  points INTEGER;
  event_type_name VARCHAR(50);
BEGIN
  -- Get the submitter of the verification
  SELECT submitted_by INTO verification_submitter
  FROM verifications
  WHERE id = NEW.verification_id;

  -- Determine event type and points based on vote type
  IF NEW.vote_type = 'upvote' THEN
    event_type_name := 'helpful_vote_received';
  ELSE
    event_type_name := 'unhelpful_vote_received';
  END IF;

  -- Get points from rules
  SELECT points_change INTO points
  FROM reputation_rules
  WHERE event_type = event_type_name AND enabled = true;

  IF points IS NOT NULL THEN
    PERFORM update_reputation_with_history(
      verification_submitter,
      points,
      'Received ' || NEW.vote_type::TEXT || ' on verification',
      event_type_name,
      NEW.id
    );
  END IF;

  -- Update voter's activity status
  INSERT INTO user_activity_status (user_id, last_vote_at, last_active_at, total_votes)
  VALUES (NEW.user_id, NOW(), NOW(), 1)
  ON CONFLICT (user_id) DO UPDATE
  SET last_vote_at = NOW(),
      last_active_at = NOW(),
      total_votes = user_activity_status.total_votes + 1,
      inactive_days = 0,
      updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Create triggers on verifications table
DROP TRIGGER IF EXISTS trigger_reputation_verification_approval ON verifications;
CREATE TRIGGER trigger_reputation_verification_approval
  AFTER UPDATE ON verifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_reputation_on_verification_approval();

DROP TRIGGER IF EXISTS trigger_reputation_verification_rejection ON verifications;
CREATE TRIGGER trigger_reputation_verification_rejection
  AFTER UPDATE ON verifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_reputation_on_verification_rejection();

DROP TRIGGER IF EXISTS trigger_reputation_verification_submission ON verifications;
CREATE TRIGGER trigger_reputation_verification_submission
  AFTER INSERT ON verifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_reputation_on_verification_submission();

-- Create trigger on votes table
DROP TRIGGER IF EXISTS trigger_reputation_vote_received ON votes;
CREATE TRIGGER trigger_reputation_vote_received
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_reputation_on_vote_received();

-- Function: Apply reputation decay for inactive users
CREATE OR REPLACE FUNCTION apply_reputation_decay()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  days_inactive INTEGER;
  decay_points INTEGER;
BEGIN
  -- Find users inactive for 30+ days with reputation > 0
  FOR user_record IN
    SELECT
      u.id,
      u.citizen_score,
      COALESCE(uas.last_active_at, u.created_at) as last_active,
      EXTRACT(DAY FROM NOW() - COALESCE(uas.last_active_at, u.created_at))::INTEGER as days_inactive
    FROM users u
    LEFT JOIN user_activity_status uas ON u.id = uas.user_id
    WHERE u.citizen_score > 0
    AND EXTRACT(DAY FROM NOW() - COALESCE(uas.last_active_at, u.created_at)) >= 30
  LOOP
    days_inactive := user_record.days_inactive;

    -- Calculate decay: -1 point per 30 days of inactivity
    decay_points := -1 * (days_inactive / 30);

    -- Apply decay (max -10 points per run to prevent huge drops)
    decay_points := GREATEST(decay_points, -10);

    IF decay_points < 0 THEN
      PERFORM update_reputation_with_history(
        user_record.id,
        decay_points,
        'Reputation decay: ' || days_inactive || ' days inactive',
        'reputation_decay',
        NULL
      );

      -- Update activity status
      INSERT INTO user_activity_status (user_id, inactive_days)
      VALUES (user_record.id, days_inactive)
      ON CONFLICT (user_id) DO UPDATE
      SET inactive_days = days_inactive,
          updated_at = NOW();
    END IF;
  END LOOP;

  RAISE NOTICE 'Reputation decay applied at %', NOW();
END;
$$;

-- Update existing update_user_reputation function to use new system
CREATE OR REPLACE FUNCTION update_user_reputation(
  target_user_id UUID,
  points_change INTEGER,
  reason TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Redirect to new function with history tracking
  PERFORM update_reputation_with_history(
    target_user_id,
    points_change,
    reason,
    NULL,
    NULL
  );
END;
$$;

-- Comments
COMMENT ON TABLE reputation_rules IS 'Configurable reputation rules for automated scoring';
COMMENT ON TABLE reputation_history IS 'Audit trail of all reputation changes';
COMMENT ON TABLE user_activity_status IS 'Tracks user activity for reputation decay';
COMMENT ON FUNCTION update_reputation_with_history(UUID, INTEGER, VARCHAR, VARCHAR, UUID) IS 'Update reputation with automatic history tracking';
COMMENT ON FUNCTION trigger_reputation_on_verification_approval() IS 'Auto-update reputation when verification approved';
COMMENT ON FUNCTION trigger_reputation_on_verification_rejection() IS 'Auto-update reputation when verification rejected';
COMMENT ON FUNCTION trigger_reputation_on_verification_submission() IS 'Auto-update reputation when verification submitted';
COMMENT ON FUNCTION trigger_reputation_on_vote_received() IS 'Auto-update reputation when vote received';
COMMENT ON FUNCTION apply_reputation_decay() IS 'Apply reputation decay for inactive users (run daily)';
