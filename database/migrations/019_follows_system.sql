-- Migration 019: Follow System
-- Allows users to follow politicians, promises, tags, and other users
-- Enables personalized feeds and targeted notifications

-- =====================================================
-- FOLLOWS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  follow_type VARCHAR(50) NOT NULL CHECK (follow_type IN ('politician', 'promise', 'tag', 'user')),
  target_id UUID NOT NULL,

  -- Notification preferences per follow
  notify_on_update BOOLEAN DEFAULT true,
  notify_on_verification BOOLEAN DEFAULT true,
  notify_on_status_change BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate follows
  UNIQUE(user_id, follow_type, target_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_follows_user_id ON follows(user_id);
CREATE INDEX idx_follows_target ON follows(follow_type, target_id);
CREATE INDEX idx_follows_created ON follows(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Users can view their own follows
CREATE POLICY "Users can view own follows" ON follows
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Users can create their own follows
CREATE POLICY "Users can create follows" ON follows
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Users can delete their own follows
CREATE POLICY "Users can delete own follows" ON follows
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Public can see follow counts (for displaying "X followers")
CREATE POLICY "Public can count follows" ON follows
  FOR SELECT USING (true);

-- =====================================================
-- FOLLOW COUNTS VIEW
-- =====================================================

CREATE OR REPLACE VIEW follow_counts AS
SELECT
  follow_type,
  target_id,
  COUNT(*) as follower_count
FROM follows
GROUP BY follow_type, target_id;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to follow something
CREATE OR REPLACE FUNCTION follow_target(
  p_user_id UUID,
  p_follow_type VARCHAR(50),
  p_target_id UUID,
  p_notify_update BOOLEAN DEFAULT true,
  p_notify_verification BOOLEAN DEFAULT true,
  p_notify_status BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
  v_follow_id UUID;
BEGIN
  INSERT INTO follows (
    user_id,
    follow_type,
    target_id,
    notify_on_update,
    notify_on_verification,
    notify_on_status_change
  )
  VALUES (
    p_user_id,
    p_follow_type,
    p_target_id,
    p_notify_update,
    p_notify_verification,
    p_notify_status
  )
  ON CONFLICT (user_id, follow_type, target_id)
  DO UPDATE SET
    notify_on_update = p_notify_update,
    notify_on_verification = p_notify_verification,
    notify_on_status_change = p_notify_status
  RETURNING id INTO v_follow_id;

  RETURN v_follow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unfollow something
CREATE OR REPLACE FUNCTION unfollow_target(
  p_user_id UUID,
  p_follow_type VARCHAR(50),
  p_target_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM follows
  WHERE user_id = p_user_id
    AND follow_type = p_follow_type
    AND target_id = p_target_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user follows something
CREATE OR REPLACE FUNCTION is_following(
  p_user_id UUID,
  p_follow_type VARCHAR(50),
  p_target_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows
    WHERE user_id = p_user_id
      AND follow_type = p_follow_type
      AND target_id = p_target_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's followed items
CREATE OR REPLACE FUNCTION get_user_follows(
  p_user_id UUID,
  p_follow_type VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
  follow_id UUID,
  follow_type VARCHAR(50),
  target_id UUID,
  notify_on_update BOOLEAN,
  notify_on_verification BOOLEAN,
  notify_on_status_change BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.follow_type,
    f.target_id,
    f.notify_on_update,
    f.notify_on_verification,
    f.notify_on_status_change,
    f.created_at
  FROM follows f
  WHERE f.user_id = p_user_id
    AND (p_follow_type IS NULL OR f.follow_type = p_follow_type)
  ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- NOTIFICATION TRIGGERS
-- =====================================================

-- Notify followers when a promise status changes
CREATE OR REPLACE FUNCTION notify_promise_followers()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
    SELECT
      f.user_id,
      'promise_update',
      'Promise Status Updated',
      'A promise you follow has been updated to: ' || NEW.status,
      'promise',
      NEW.id
    FROM follows f
    WHERE f.follow_type = 'promise'
      AND f.target_id = NEW.id
      AND f.notify_on_status_change = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on promises table
DROP TRIGGER IF EXISTS trigger_notify_promise_followers ON promises;
CREATE TRIGGER trigger_notify_promise_followers
  AFTER UPDATE ON promises
  FOR EACH ROW
  EXECUTE FUNCTION notify_promise_followers();

-- Notify followers when a new verification is submitted for a followed promise
CREATE OR REPLACE FUNCTION notify_verification_followers()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify promise followers about new verification
  INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
  SELECT
    f.user_id,
    'new_verification',
    'New Verification Submitted',
    'A new verification was submitted for a promise you follow',
    'verification',
    NEW.id
  FROM follows f
  WHERE f.follow_type = 'promise'
    AND f.target_id = NEW.promise_id
    AND f.notify_on_verification = true
    AND f.user_id != NEW.submitted_by; -- Don't notify the submitter

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on verifications table
DROP TRIGGER IF EXISTS trigger_notify_verification_followers ON verifications;
CREATE TRIGGER trigger_notify_verification_followers
  AFTER INSERT ON verifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_verification_followers();

-- Notify politician followers when a new promise is added
CREATE OR REPLACE FUNCTION notify_politician_followers()
RETURNS TRIGGER AS $$
DECLARE
  v_politician_id UUID;
BEGIN
  -- Get politician ID from name (if politicians table exists)
  SELECT id INTO v_politician_id
  FROM politicians
  WHERE name ILIKE NEW.politician_name
  LIMIT 1;

  IF v_politician_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
    SELECT
      f.user_id,
      'new_promise',
      'New Promise Added',
      'A new promise was added for ' || NEW.politician_name,
      'promise',
      NEW.id
    FROM follows f
    WHERE f.follow_type = 'politician'
      AND f.target_id = v_politician_id
      AND f.notify_on_update = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on promises table for new promises
DROP TRIGGER IF EXISTS trigger_notify_politician_followers ON promises;
CREATE TRIGGER trigger_notify_politician_followers
  AFTER INSERT ON promises
  FOR EACH ROW
  EXECUTE FUNCTION notify_politician_followers();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, DELETE ON follows TO authenticated;
GRANT SELECT ON follow_counts TO authenticated;
GRANT EXECUTE ON FUNCTION follow_target TO authenticated;
GRANT EXECUTE ON FUNCTION unfollow_target TO authenticated;
GRANT EXECUTE ON FUNCTION is_following TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_follows TO authenticated;
