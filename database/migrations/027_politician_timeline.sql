-- Migration 027: Politician Timeline
-- Timeline view for all events across a politician's promises

-- =====================================================
-- 1. GET POLITICIAN TIMELINE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_politician_timeline(
  p_politician_name TEXT,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_event_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  event_type TEXT,
  event_id UUID,
  promise_id UUID,
  promise_text TEXT,
  old_status TEXT,
  new_status TEXT,
  change_source TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ,
  actor_name TEXT,
  verdict TEXT,
  evidence_preview TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pt.event_type::TEXT,
    pt.event_id,
    pt.promise_id,
    LEFT(p.promise_text, 150)::TEXT as promise_text,
    pt.old_status::TEXT,
    pt.status::TEXT as new_status,
    pt.change_source::TEXT,
    pt.reason::TEXT,
    pt.created_at,
    pt.actor_name::TEXT,
    pt.verdict::TEXT,
    pt.evidence_preview::TEXT
  FROM promise_timeline pt
  JOIN promises p ON pt.promise_id = p.id
  WHERE p.politician_name ILIKE p_politician_name
    AND (p_event_types IS NULL OR pt.event_type = ANY(p_event_types))
  ORDER BY pt.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- =====================================================
-- 2. GET POLITICIAN TIMELINE STATS
-- =====================================================

CREATE OR REPLACE FUNCTION get_politician_timeline_stats(
  p_politician_name TEXT
)
RETURNS TABLE (
  total_events BIGINT,
  status_changes BIGINT,
  verifications BIGINT,
  first_event_at TIMESTAMPTZ,
  last_event_at TIMESTAMPTZ,
  avg_days_between_events NUMERIC,
  most_active_month TEXT,
  events_this_month BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH timeline_events AS (
    SELECT
      pt.event_type,
      pt.created_at,
      LAG(pt.created_at) OVER (ORDER BY pt.created_at) as prev_event_at
    FROM promise_timeline pt
    JOIN promises p ON pt.promise_id = p.id
    WHERE p.politician_name ILIKE p_politician_name
  ),
  monthly_counts AS (
    SELECT
      TO_CHAR(created_at, 'YYYY-MM') as month,
      COUNT(*) as event_count
    FROM timeline_events
    GROUP BY TO_CHAR(created_at, 'YYYY-MM')
    ORDER BY event_count DESC
    LIMIT 1
  )
  SELECT
    COUNT(*)::BIGINT as total_events,
    COUNT(*) FILTER (WHERE te.event_type = 'status_change')::BIGINT as status_changes,
    COUNT(*) FILTER (WHERE te.event_type = 'verification')::BIGINT as verifications,
    MIN(te.created_at) as first_event_at,
    MAX(te.created_at) as last_event_at,
    ROUND(AVG(EXTRACT(EPOCH FROM (te.created_at - te.prev_event_at)) / 86400)::NUMERIC, 1) as avg_days_between_events,
    (SELECT month FROM monthly_counts)::TEXT as most_active_month,
    COUNT(*) FILTER (
      WHERE te.created_at >= DATE_TRUNC('month', CURRENT_DATE)
    )::BIGINT as events_this_month
  FROM timeline_events te;
END;
$$;

-- =====================================================
-- 3. GET TIMELINE BY MONTH (GROUPED)
-- =====================================================

CREATE OR REPLACE FUNCTION get_politician_timeline_grouped(
  p_politician_name TEXT,
  p_months INTEGER DEFAULT 12
)
RETURNS TABLE (
  month TEXT,
  month_start DATE,
  event_count BIGINT,
  status_changes BIGINT,
  verifications BIGINT,
  promises_fulfilled BIGINT,
  promises_broken BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('month', pt.created_at), 'Mon YYYY')::TEXT as month,
    DATE_TRUNC('month', pt.created_at)::DATE as month_start,
    COUNT(*)::BIGINT as event_count,
    COUNT(*) FILTER (WHERE pt.event_type = 'status_change')::BIGINT as status_changes,
    COUNT(*) FILTER (WHERE pt.event_type = 'verification')::BIGINT as verifications,
    COUNT(*) FILTER (WHERE pt.status = 'fulfilled')::BIGINT as promises_fulfilled,
    COUNT(*) FILTER (WHERE pt.status = 'broken')::BIGINT as promises_broken
  FROM promise_timeline pt
  JOIN promises p ON pt.promise_id = p.id
  WHERE p.politician_name ILIKE p_politician_name
    AND pt.created_at >= (CURRENT_DATE - (p_months || ' months')::INTERVAL)
  GROUP BY DATE_TRUNC('month', pt.created_at)
  ORDER BY month_start DESC;
END;
$$;

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_politician_timeline TO authenticated;
GRANT EXECUTE ON FUNCTION get_politician_timeline TO anon;
GRANT EXECUTE ON FUNCTION get_politician_timeline_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_politician_timeline_stats TO anon;
GRANT EXECUTE ON FUNCTION get_politician_timeline_grouped TO authenticated;
GRANT EXECUTE ON FUNCTION get_politician_timeline_grouped TO anon;
