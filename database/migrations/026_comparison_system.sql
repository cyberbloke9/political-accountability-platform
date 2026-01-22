-- Migration 026: Comparison System
-- Comparison-friendly view and helper functions

-- =====================================================
-- 1. POLITICIAN COMPARISON VIEW
-- =====================================================

CREATE OR REPLACE VIEW politician_comparison_data AS
SELECT
  p.id,
  p.name,
  p.slug,
  p.party,
  p.position,
  p.state,
  p.constituency,
  p.image_url,
  p.is_active,
  COALESCE(ps.total_promises, 0) as total_promises,
  COALESCE(ps.fulfilled_count, 0) as fulfilled_count,
  COALESCE(ps.broken_count, 0) as broken_count,
  COALESCE(ps.in_progress_count, 0) as in_progress_count,
  COALESCE(ps.pending_count, 0) as pending_count,
  COALESCE(ps.stalled_count, 0) as stalled_count,
  ps.fulfillment_rate,
  ps.latest_promise_date,
  -- Calculate grade based on fulfillment rate
  CASE
    WHEN ps.fulfillment_rate >= 80 THEN 'A'
    WHEN ps.fulfillment_rate >= 60 THEN 'B'
    WHEN ps.fulfillment_rate >= 40 THEN 'C'
    WHEN ps.fulfillment_rate >= 20 THEN 'D'
    WHEN ps.fulfillment_rate IS NOT NULL THEN 'F'
    ELSE NULL
  END as grade
FROM politicians p
LEFT JOIN politician_stats ps ON ps.slug = p.slug OR ps.politician_name ILIKE p.name
WHERE p.is_active = true;

-- =====================================================
-- 2. GET COMPARISON DATA FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_politician_comparison(
  p_slugs TEXT[]
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  party TEXT,
  politician_position TEXT,
  state TEXT,
  image_url TEXT,
  total_promises BIGINT,
  fulfilled_count BIGINT,
  broken_count BIGINT,
  in_progress_count BIGINT,
  pending_count BIGINT,
  stalled_count BIGINT,
  fulfillment_rate NUMERIC,
  grade TEXT,
  category_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pcd.id,
    pcd.name::TEXT,
    pcd.slug::TEXT,
    pcd.party::TEXT,
    pcd.position::TEXT,
    pcd.state::TEXT,
    pcd.image_url::TEXT,
    pcd.total_promises,
    pcd.fulfilled_count,
    pcd.broken_count,
    pcd.in_progress_count,
    pcd.pending_count,
    pcd.stalled_count,
    pcd.fulfillment_rate,
    pcd.grade::TEXT,
    -- Category breakdown
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'category', cat_data.category,
            'total', cat_data.total,
            'fulfilled', cat_data.fulfilled,
            'broken', cat_data.broken
          )
        )
        FROM (
          SELECT
            COALESCE(pr.category, 'Uncategorized') as category,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE pr.status = 'fulfilled') as fulfilled,
            COUNT(*) FILTER (WHERE pr.status = 'broken') as broken
          FROM promises pr
          WHERE pr.politician_name ILIKE pcd.name
          GROUP BY pr.category
          ORDER BY total DESC
          LIMIT 10
        ) cat_data
      ),
      '[]'::jsonb
    ) as category_breakdown
  FROM politician_comparison_data pcd
  WHERE pcd.slug = ANY(p_slugs)
  ORDER BY array_position(p_slugs, pcd.slug);
END;
$$;

-- =====================================================
-- 3. SEARCH POLITICIANS FOR COMPARISON
-- =====================================================

CREATE OR REPLACE FUNCTION search_politicians_for_comparison(
  p_query TEXT,
  p_exclude_slugs TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  party TEXT,
  politician_position TEXT,
  state TEXT,
  image_url TEXT,
  total_promises BIGINT,
  fulfillment_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pcd.id,
    pcd.name::TEXT,
    pcd.slug::TEXT,
    pcd.party::TEXT,
    pcd.position::TEXT,
    pcd.state::TEXT,
    pcd.image_url::TEXT,
    pcd.total_promises,
    pcd.fulfillment_rate
  FROM politician_comparison_data pcd
  WHERE pcd.is_active = true
    AND (pcd.slug != ALL(p_exclude_slugs))
    AND (
      pcd.name ILIKE '%' || p_query || '%'
      OR pcd.party ILIKE '%' || p_query || '%'
      OR pcd.state ILIKE '%' || p_query || '%'
    )
  ORDER BY
    CASE WHEN pcd.name ILIKE p_query || '%' THEN 0 ELSE 1 END,
    pcd.total_promises DESC
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON politician_comparison_data TO authenticated;
GRANT SELECT ON politician_comparison_data TO anon;
GRANT EXECUTE ON FUNCTION get_politician_comparison TO authenticated;
GRANT EXECUTE ON FUNCTION get_politician_comparison TO anon;
GRANT EXECUTE ON FUNCTION search_politicians_for_comparison TO authenticated;
GRANT EXECUTE ON FUNCTION search_politicians_for_comparison TO anon;
