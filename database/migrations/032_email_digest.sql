-- Migration 032: Email Digest System
-- Weekly/daily email summaries for followed politicians and promises

-- Email digest preferences (extends user_notification_settings)
ALTER TABLE user_notification_settings
ADD COLUMN IF NOT EXISTS digest_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS digest_frequency VARCHAR(20) DEFAULT 'weekly' CHECK (digest_frequency IN ('daily', 'weekly', 'monthly')),
ADD COLUMN IF NOT EXISTS digest_day INTEGER DEFAULT 0 CHECK (digest_day >= 0 AND digest_day <= 6), -- 0 = Sunday
ADD COLUMN IF NOT EXISTS digest_time TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS last_digest_sent TIMESTAMP WITH TIME ZONE;

-- Email digest log (track sent digests)
CREATE TABLE IF NOT EXISTS email_digest_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  digest_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_address TEXT NOT NULL,
  promise_count INTEGER DEFAULT 0,
  politician_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'failed', 'bounced'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_digest_log_user ON email_digest_log(user_id);
CREATE INDEX IF NOT EXISTS idx_digest_log_sent ON email_digest_log(sent_at DESC);

-- Promise reminders table
CREATE TABLE IF NOT EXISTS promise_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  promise_id UUID NOT NULL REFERENCES promises(id) ON DELETE CASCADE,
  remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
  note TEXT,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, promise_id, remind_at)
);

CREATE INDEX IF NOT EXISTS idx_reminders_user ON promise_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON promise_reminders(remind_at) WHERE sent = false;

-- Function to get digest data for a user
CREATE OR REPLACE FUNCTION get_user_digest_data(p_user_id UUID, p_since TIMESTAMP WITH TIME ZONE)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'followed_politicians', (
      SELECT json_agg(json_build_object(
        'id', p.id,
        'name', p.name,
        'party', p.party,
        'image_url', p.image_url,
        'promises_updated', (
          SELECT COUNT(*) FROM promises pr
          WHERE pr.politician_name = p.name
          AND pr.updated_at > p_since
        )
      ))
      FROM politicians p
      JOIN follows f ON f.target_id = p.id AND f.follow_type = 'politician'
      WHERE f.user_id = p_user_id
    ),
    'promise_updates', (
      SELECT json_agg(json_build_object(
        'id', pr.id,
        'politician_name', pr.politician_name,
        'promise_text', LEFT(pr.promise_text, 200),
        'status', pr.status,
        'previous_status', pr.previous_status,
        'updated_at', pr.updated_at
      ))
      FROM promises pr
      WHERE pr.updated_at > p_since
      AND (
        pr.id IN (SELECT target_id FROM follows WHERE user_id = p_user_id AND follow_type = 'promise')
        OR pr.politician_name IN (
          SELECT p.name FROM politicians p
          JOIN follows f ON f.target_id = p.id AND f.follow_type = 'politician'
          WHERE f.user_id = p_user_id
        )
      )
      ORDER BY pr.updated_at DESC
      LIMIT 20
    ),
    'new_verifications', (
      SELECT COUNT(*)
      FROM verifications v
      JOIN promises pr ON pr.id = v.promise_id
      WHERE v.created_at > p_since
      AND (
        pr.id IN (SELECT target_id FROM follows WHERE user_id = p_user_id AND follow_type = 'promise')
        OR pr.politician_name IN (
          SELECT p.name FROM politicians p
          JOIN follows f ON f.target_id = p.id AND f.follow_type = 'politician'
          WHERE f.user_id = p_user_id
        )
      )
    ),
    'period_start', p_since,
    'period_end', NOW()
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get users due for digest
CREATE OR REPLACE FUNCTION get_users_due_for_digest(p_digest_type VARCHAR(20))
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  username TEXT,
  last_sent TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.username,
    uns.last_digest_sent
  FROM users u
  JOIN user_notification_settings uns ON uns.user_id = u.id
  WHERE uns.digest_enabled = true
  AND uns.digest_frequency = p_digest_type
  AND uns.email_enabled = true
  AND (
    uns.last_digest_sent IS NULL
    OR (p_digest_type = 'daily' AND uns.last_digest_sent < NOW() - INTERVAL '1 day')
    OR (p_digest_type = 'weekly' AND uns.last_digest_sent < NOW() - INTERVAL '7 days')
    OR (p_digest_type = 'monthly' AND uns.last_digest_sent < NOW() - INTERVAL '30 days')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark digest as sent
CREATE OR REPLACE FUNCTION mark_digest_sent(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_notification_settings
  SET last_digest_sent = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE email_digest_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE promise_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own digest log" ON email_digest_log
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can view own reminders" ON promise_reminders
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can create own reminders" ON promise_reminders
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete own reminders" ON promise_reminders
  FOR DELETE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Grants
GRANT SELECT ON email_digest_log TO authenticated;
GRANT SELECT, INSERT, DELETE ON promise_reminders TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_digest_data TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_due_for_digest TO service_role;
GRANT EXECUTE ON FUNCTION mark_digest_sent TO service_role;
