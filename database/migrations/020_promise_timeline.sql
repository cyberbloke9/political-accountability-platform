-- Migration 020: Promise Timeline / Status History
-- Tracks every status change for promises to enable timeline visualization
-- Provides complete audit trail of promise lifecycle

-- =====================================================
-- PROMISE STATUS HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS promise_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promise_id UUID NOT NULL REFERENCES promises(id) ON DELETE CASCADE,

  -- Status change details
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,

  -- Who/what caused the change
  changed_by UUID REFERENCES users(id),
  change_source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'verification_consensus', 'admin', 'system'

  -- Additional context
  reason TEXT,
  verification_id UUID REFERENCES verifications(id), -- If status changed due to verification

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast timeline queries
CREATE INDEX idx_promise_history_promise ON promise_status_history(promise_id);
CREATE INDEX idx_promise_history_created ON promise_status_history(created_at DESC);
CREATE INDEX idx_promise_history_status ON promise_status_history(new_status);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE promise_status_history ENABLE ROW LEVEL SECURITY;

-- Everyone can view status history (transparency!)
CREATE POLICY "Public can view status history" ON promise_status_history
  FOR SELECT USING (true);

-- Only system/admins can insert (via triggers)
CREATE POLICY "System can insert history" ON promise_status_history
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- AUTO-LOGGING TRIGGER
-- =====================================================

-- Automatically log status changes
CREATE OR REPLACE FUNCTION log_promise_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to get current user ID
  SELECT id INTO v_user_id
  FROM users
  WHERE auth_id = auth.uid();

  -- Insert history record
  INSERT INTO promise_status_history (
    promise_id,
    old_status,
    new_status,
    changed_by,
    change_source,
    metadata
  )
  VALUES (
    NEW.id,
    OLD.status,
    NEW.status,
    v_user_id,
    CASE
      WHEN v_user_id IS NULL THEN 'system'
      ELSE 'manual'
    END,
    jsonb_build_object(
      'old_updated_at', OLD.updated_at,
      'new_updated_at', NEW.updated_at
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_log_promise_status ON promises;
CREATE TRIGGER trigger_log_promise_status
  AFTER UPDATE ON promises
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_promise_status_change();

-- Also log initial status when promise is created
CREATE OR REPLACE FUNCTION log_promise_creation()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get creator's user ID
  SELECT id INTO v_user_id
  FROM users
  WHERE auth_id = auth.uid();

  INSERT INTO promise_status_history (
    promise_id,
    old_status,
    new_status,
    changed_by,
    change_source,
    reason
  )
  VALUES (
    NEW.id,
    NULL,
    NEW.status,
    COALESCE(v_user_id, NEW.created_by),
    'creation',
    'Promise created'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_promise_creation ON promises;
CREATE TRIGGER trigger_log_promise_creation
  AFTER INSERT ON promises
  FOR EACH ROW
  EXECUTE FUNCTION log_promise_creation();

-- =====================================================
-- TIMELINE VIEW
-- =====================================================

-- Complete timeline view combining status changes and verifications
CREATE OR REPLACE VIEW promise_timeline AS
SELECT
  p.id as promise_id,
  'status_change' as event_type,
  psh.id as event_id,
  psh.old_status,
  psh.new_status as status,
  psh.change_source,
  psh.reason,
  psh.created_at,
  u.username as actor_name,
  NULL as verdict,
  NULL as evidence_preview
FROM promises p
JOIN promise_status_history psh ON p.id = psh.promise_id
LEFT JOIN users u ON psh.changed_by = u.id

UNION ALL

SELECT
  p.id as promise_id,
  'verification' as event_type,
  v.id as event_id,
  NULL as old_status,
  v.status,
  'verification' as change_source,
  NULL as reason,
  v.created_at,
  u.username as actor_name,
  v.verdict,
  LEFT(v.evidence_text, 100) as evidence_preview
FROM promises p
JOIN verifications v ON p.id = v.promise_id
LEFT JOIN users u ON v.submitted_by = u.id

ORDER BY created_at ASC;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get promise timeline with all events
CREATE OR REPLACE FUNCTION get_promise_timeline(p_promise_id UUID)
RETURNS TABLE (
  event_type TEXT,
  event_id UUID,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  change_source VARCHAR(50),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  actor_name VARCHAR(100),
  verdict VARCHAR(50),
  evidence_preview TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pt.event_type::TEXT,
    pt.event_id,
    pt.old_status,
    pt.status as new_status,
    pt.change_source,
    pt.reason,
    pt.created_at,
    pt.actor_name,
    pt.verdict,
    pt.evidence_preview
  FROM promise_timeline pt
  WHERE pt.promise_id = p_promise_id
  ORDER BY pt.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get promise lifecycle summary
CREATE OR REPLACE FUNCTION get_promise_lifecycle(p_promise_id UUID)
RETURNS TABLE (
  days_since_created INTEGER,
  days_in_current_status INTEGER,
  total_status_changes INTEGER,
  total_verifications INTEGER,
  first_verification_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(DAY FROM NOW() - p.created_at)::INTEGER as days_since_created,
    EXTRACT(DAY FROM NOW() - COALESCE(
      (SELECT MAX(created_at) FROM promise_status_history WHERE promise_id = p.id),
      p.created_at
    ))::INTEGER as days_in_current_status,
    (SELECT COUNT(*)::INTEGER FROM promise_status_history WHERE promise_id = p.id) as total_status_changes,
    (SELECT COUNT(*)::INTEGER FROM verifications WHERE promise_id = p.id) as total_verifications,
    (SELECT MIN(created_at) FROM verifications WHERE promise_id = p.id) as first_verification_at,
    GREATEST(
      p.updated_at,
      (SELECT MAX(created_at) FROM verifications WHERE promise_id = p.id),
      (SELECT MAX(created_at) FROM promise_status_history WHERE promise_id = p.id)
    ) as last_activity_at
  FROM promises p
  WHERE p.id = p_promise_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- BACKFILL EXISTING PROMISES
-- =====================================================

-- Create initial history entries for existing promises that don't have any
INSERT INTO promise_status_history (promise_id, old_status, new_status, change_source, reason, created_at)
SELECT
  p.id,
  NULL,
  p.status,
  'migration',
  'Initial status from migration backfill',
  p.created_at
FROM promises p
WHERE NOT EXISTS (
  SELECT 1 FROM promise_status_history psh WHERE psh.promise_id = p.id
);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON promise_status_history TO authenticated;
GRANT SELECT ON promise_status_history TO anon;
GRANT SELECT ON promise_timeline TO authenticated;
GRANT SELECT ON promise_timeline TO anon;
GRANT EXECUTE ON FUNCTION get_promise_timeline TO authenticated;
GRANT EXECUTE ON FUNCTION get_promise_timeline TO anon;
GRANT EXECUTE ON FUNCTION get_promise_lifecycle TO authenticated;
GRANT EXECUTE ON FUNCTION get_promise_lifecycle TO anon;
