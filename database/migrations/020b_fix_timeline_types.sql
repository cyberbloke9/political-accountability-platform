-- =====================================================
-- PATCH: Fix Timeline View Type Mismatches
-- Run this if you already ran 020_promise_timeline.sql
-- =====================================================

-- Drop the existing function first (required to change return type)
DROP FUNCTION IF EXISTS get_promise_timeline(UUID);

-- Drop and recreate the view with proper type casting
DROP VIEW IF EXISTS promise_timeline;

CREATE OR REPLACE VIEW promise_timeline AS
SELECT
  p.id as promise_id,
  'status_change'::TEXT as event_type,
  psh.id as event_id,
  psh.old_status::TEXT as old_status,
  psh.new_status::TEXT as status,
  psh.change_source::TEXT as change_source,
  psh.reason::TEXT as reason,
  psh.created_at,
  u.username::TEXT as actor_name,
  NULL::TEXT as verdict,
  NULL::TEXT as evidence_preview
FROM promises p
JOIN promise_status_history psh ON p.id = psh.promise_id
LEFT JOIN users u ON psh.changed_by = u.id

UNION ALL

SELECT
  p.id as promise_id,
  'verification'::TEXT as event_type,
  v.id as event_id,
  NULL::TEXT as old_status,
  v.status::TEXT as status,
  'verification'::TEXT as change_source,
  NULL::TEXT as reason,
  v.created_at,
  u.username::TEXT as actor_name,
  v.verdict::TEXT as verdict,
  LEFT(v.evidence_text, 100)::TEXT as evidence_preview
FROM promises p
JOIN verifications v ON p.id = v.promise_id
LEFT JOIN users u ON v.submitted_by = u.id

ORDER BY created_at ASC;

-- Recreate the function with correct return types
CREATE OR REPLACE FUNCTION get_promise_timeline(p_promise_id UUID)
RETURNS TABLE (
  event_type TEXT,
  event_id UUID,
  old_status TEXT,
  new_status TEXT,
  change_source TEXT,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  actor_name TEXT,
  verdict TEXT,
  evidence_preview TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pt.event_type,
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

-- Grant permissions
GRANT SELECT ON promise_timeline TO authenticated;
GRANT SELECT ON promise_timeline TO anon;
GRANT EXECUTE ON FUNCTION get_promise_timeline(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_promise_timeline(UUID) TO anon;
