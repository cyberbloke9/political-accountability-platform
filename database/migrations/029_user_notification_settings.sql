-- Migration 029: User Notification Settings
-- User preferences for notifications (in-app and email)

-- =====================================================
-- 1. USER NOTIFICATION SETTINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- In-app notification settings
  in_app_enabled BOOLEAN DEFAULT true,
  in_app_promise_updates BOOLEAN DEFAULT true,
  in_app_verification_updates BOOLEAN DEFAULT true,
  in_app_new_promises BOOLEAN DEFAULT true,
  in_app_discussion_replies BOOLEAN DEFAULT true,
  in_app_mentions BOOLEAN DEFAULT true,

  -- Email notification settings
  email_enabled BOOLEAN DEFAULT false,
  email_address VARCHAR(255),
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMPTZ,
  email_frequency VARCHAR(20) DEFAULT 'instant', -- 'instant', 'daily', 'weekly', 'never'
  email_promise_updates BOOLEAN DEFAULT true,
  email_verification_updates BOOLEAN DEFAULT true,
  email_new_promises BOOLEAN DEFAULT true,
  email_weekly_digest BOOLEAN DEFAULT false,
  last_email_sent_at TIMESTAMPTZ,
  last_digest_sent_at TIMESTAMPTZ,

  -- Quiet hours (do not disturb)
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  timezone VARCHAR(50) DEFAULT 'UTC',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  CONSTRAINT unique_user_notification_settings UNIQUE (user_id)
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_notification_settings_user
  ON user_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_email_frequency
  ON user_notification_settings(email_frequency) WHERE email_enabled = true;

-- =====================================================
-- 2. ENABLE RLS
-- =====================================================

ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own settings
CREATE POLICY "Users can view own notification settings"
  ON user_notification_settings FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can update their own settings
CREATE POLICY "Users can update own notification settings"
  ON user_notification_settings FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can insert their own settings (for initialization)
CREATE POLICY "Users can insert own notification settings"
  ON user_notification_settings FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- =====================================================
-- 3. AUTO-CREATE SETTINGS FOR NEW USERS
-- =====================================================

CREATE OR REPLACE FUNCTION create_user_notification_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS trigger_create_notification_settings ON users;
CREATE TRIGGER trigger_create_notification_settings
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_notification_settings();

-- =====================================================
-- 4. CREATE SETTINGS FOR EXISTING USERS
-- =====================================================

INSERT INTO user_notification_settings (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_notification_settings)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 5. GET USER NOTIFICATION SETTINGS
-- =====================================================

CREATE OR REPLACE FUNCTION get_notification_settings()
RETURNS TABLE (
  in_app_enabled BOOLEAN,
  in_app_promise_updates BOOLEAN,
  in_app_verification_updates BOOLEAN,
  in_app_new_promises BOOLEAN,
  in_app_discussion_replies BOOLEAN,
  in_app_mentions BOOLEAN,
  email_enabled BOOLEAN,
  email_address VARCHAR(255),
  email_verified BOOLEAN,
  email_frequency VARCHAR(20),
  email_promise_updates BOOLEAN,
  email_verification_updates BOOLEAN,
  email_new_promises BOOLEAN,
  email_weekly_digest BOOLEAN,
  quiet_hours_enabled BOOLEAN,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone VARCHAR(50)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user's internal ID
  SELECT u.id INTO v_user_id
  FROM users u
  WHERE u.auth_id = auth.uid();

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    uns.in_app_enabled,
    uns.in_app_promise_updates,
    uns.in_app_verification_updates,
    uns.in_app_new_promises,
    uns.in_app_discussion_replies,
    uns.in_app_mentions,
    uns.email_enabled,
    uns.email_address,
    uns.email_verified,
    uns.email_frequency,
    uns.email_promise_updates,
    uns.email_verification_updates,
    uns.email_new_promises,
    uns.email_weekly_digest,
    uns.quiet_hours_enabled,
    uns.quiet_hours_start,
    uns.quiet_hours_end,
    uns.timezone
  FROM user_notification_settings uns
  WHERE uns.user_id = v_user_id;
END;
$$;

-- =====================================================
-- 6. UPDATE USER NOTIFICATION SETTINGS
-- =====================================================

CREATE OR REPLACE FUNCTION update_notification_settings(
  p_settings JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user's internal ID
  SELECT u.id INTO v_user_id
  FROM users u
  WHERE u.auth_id = auth.uid();

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE user_notification_settings
  SET
    in_app_enabled = COALESCE((p_settings->>'in_app_enabled')::BOOLEAN, in_app_enabled),
    in_app_promise_updates = COALESCE((p_settings->>'in_app_promise_updates')::BOOLEAN, in_app_promise_updates),
    in_app_verification_updates = COALESCE((p_settings->>'in_app_verification_updates')::BOOLEAN, in_app_verification_updates),
    in_app_new_promises = COALESCE((p_settings->>'in_app_new_promises')::BOOLEAN, in_app_new_promises),
    in_app_discussion_replies = COALESCE((p_settings->>'in_app_discussion_replies')::BOOLEAN, in_app_discussion_replies),
    in_app_mentions = COALESCE((p_settings->>'in_app_mentions')::BOOLEAN, in_app_mentions),
    email_enabled = COALESCE((p_settings->>'email_enabled')::BOOLEAN, email_enabled),
    email_address = COALESCE(p_settings->>'email_address', email_address),
    email_frequency = COALESCE(p_settings->>'email_frequency', email_frequency),
    email_promise_updates = COALESCE((p_settings->>'email_promise_updates')::BOOLEAN, email_promise_updates),
    email_verification_updates = COALESCE((p_settings->>'email_verification_updates')::BOOLEAN, email_verification_updates),
    email_new_promises = COALESCE((p_settings->>'email_new_promises')::BOOLEAN, email_new_promises),
    email_weekly_digest = COALESCE((p_settings->>'email_weekly_digest')::BOOLEAN, email_weekly_digest),
    quiet_hours_enabled = COALESCE((p_settings->>'quiet_hours_enabled')::BOOLEAN, quiet_hours_enabled),
    quiet_hours_start = COALESCE((p_settings->>'quiet_hours_start')::TIME, quiet_hours_start),
    quiet_hours_end = COALESCE((p_settings->>'quiet_hours_end')::TIME, quiet_hours_end),
    timezone = COALESCE(p_settings->>'timezone', timezone),
    updated_at = NOW()
  WHERE user_id = v_user_id;

  RETURN true;
END;
$$;

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON user_notification_settings TO authenticated;
GRANT EXECUTE ON FUNCTION get_notification_settings TO authenticated;
GRANT EXECUTE ON FUNCTION update_notification_settings TO authenticated;
