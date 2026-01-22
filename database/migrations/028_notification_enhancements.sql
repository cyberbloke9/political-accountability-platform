-- Migration 028: Notification System Enhancements
-- Additional columns, indexes, and helper functions

-- =====================================================
-- 1. ENHANCE NOTIFICATIONS TABLE
-- =====================================================

-- Add new columns for better organization
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_type VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_category
  ON notifications(user_id, category);
CREATE INDEX IF NOT EXISTS idx_notifications_related
  ON notifications(related_type, related_id);

-- =====================================================
-- 2. GET UNREAD COUNT FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM notifications
  WHERE user_id = p_user_id
    AND read = false
    AND (expires_at IS NULL OR expires_at > NOW());
$$;

-- =====================================================
-- 3. GET NOTIFICATIONS WITH PAGINATION
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_notifications(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_unread_only BOOLEAN DEFAULT false,
  p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  type VARCHAR(50),
  title VARCHAR(200),
  message TEXT,
  link VARCHAR(500),
  action_url TEXT,
  read BOOLEAN,
  category VARCHAR(50),
  priority VARCHAR(20),
  related_type VARCHAR(50),
  related_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.type,
    n.title,
    n.message,
    n.link,
    n.action_url,
    n.read,
    n.category,
    n.priority,
    n.related_type,
    n.related_id,
    n.metadata,
    n.created_at
  FROM notifications n
  WHERE n.user_id = p_user_id
    AND (NOT p_unread_only OR n.read = false)
    AND (p_category IS NULL OR n.category = p_category)
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
  ORDER BY
    CASE n.priority
      WHEN 'high' THEN 0
      WHEN 'normal' THEN 1
      ELSE 2
    END,
    n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- =====================================================
-- 4. MARK NOTIFICATIONS AS READ
-- =====================================================

CREATE OR REPLACE FUNCTION mark_notifications_read(
  p_user_id UUID,
  p_notification_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF p_notification_ids IS NULL THEN
    -- Mark all as read
    UPDATE notifications
    SET read = true
    WHERE user_id = p_user_id AND read = false;
  ELSE
    -- Mark specific ones as read
    UPDATE notifications
    SET read = true
    WHERE user_id = p_user_id
      AND id = ANY(p_notification_ids)
      AND read = false;
  END IF;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- =====================================================
-- 5. DELETE OLD NOTIFICATIONS
-- =====================================================

CREATE OR REPLACE FUNCTION delete_old_notifications(
  p_user_id UUID,
  p_older_than_days INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE user_id = p_user_id
    AND read = true
    AND created_at < NOW() - (p_older_than_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- =====================================================
-- 6. CREATE NOTIFICATION HELPER
-- =====================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(200),
  p_message TEXT,
  p_link VARCHAR(500) DEFAULT NULL,
  p_category VARCHAR(50) DEFAULT 'general',
  p_priority VARCHAR(20) DEFAULT 'normal',
  p_related_type VARCHAR(50) DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, type, title, message, link,
    category, priority, related_type, related_id, metadata
  )
  VALUES (
    p_user_id, p_type, p_title, p_message, p_link,
    p_category, p_priority, p_related_type, p_related_id, p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION delete_old_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
