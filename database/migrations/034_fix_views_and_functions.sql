-- Migration 034: Fix Views and Functions for Leaderboard, Stats, and Comparison
-- This fixes the issues caused by simplified views in migration 033

-- =====================================================
-- 0. Drop existing functions first (required to change return types)
-- =====================================================
DROP FUNCTION IF EXISTS get_politician_comparison(TEXT[]);
DROP FUNCTION IF EXISTS search_politicians_for_comparison(TEXT, TEXT[], INTEGER);

-- =====================================================
-- 1. Fix citizen_scores_mv for Leaderboard
-- =====================================================
DROP VIEW IF EXISTS public.citizen_scores_mv CASCADE;

CREATE VIEW public.citizen_scores_mv
WITH (security_invoker = true)
AS
SELECT
  u.id as user_id,
  u.username,
  u.citizen_score as total_score,
  CASE
    WHEN u.citizen_score >= 1000 THEN 'Legend'
    WHEN u.citizen_score >= 500 THEN 'Expert'
    WHEN u.citizen_score >= 250 THEN 'Veteran'
    WHEN u.citizen_score >= 100 THEN 'Contributor'
    WHEN u.citizen_score >= 50 THEN 'Active'
    ELSE 'Newcomer'
  END as title,
  u.citizen_score as reputation,
  COALESCE((SELECT COUNT(*) FROM promises WHERE created_by = u.id), 0)::integer as total_promises_created,
  COALESCE((SELECT COUNT(*) FROM verifications WHERE submitted_by = u.id), 0)::integer as total_verifications_submitted,
  COALESCE((SELECT COUNT(*) FROM verification_votes WHERE user_id = u.id), 0)::integer as total_votes_cast,
  u.created_at as member_since
FROM users u
WHERE u.citizen_score > 0
ORDER BY u.citizen_score DESC;

-- =====================================================
-- 2. Fix politician_stats view to avoid NaN
-- =====================================================
DROP VIEW IF EXISTS public.politician_stats CASCADE;

CREATE VIEW public.politician_stats
WITH (security_invoker = true)
AS
SELECT
  p.id as politician_id,
  p.name as politician_name,
  p.slug,
  p.party,
  p.position,
  p.state,
  p.image_url,
  COALESCE(COUNT(DISTINCT pr.id), 0)::integer as total_promises,
  COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'fulfilled' THEN pr.id END), 0)::integer as fulfilled_count,
  COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'broken' THEN pr.id END), 0)::integer as broken_count,
  COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'in_progress' THEN pr.id END), 0)::integer as in_progress_count,
  COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'pending' THEN pr.id END), 0)::integer as pending_count,
  COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'stalled' THEN pr.id END), 0)::integer as stalled_count,
  CASE
    WHEN COUNT(DISTINCT pr.id) = 0 THEN 0::numeric
    ELSE ROUND(
      (COUNT(DISTINCT CASE WHEN pr.status = 'fulfilled' THEN pr.id END)::numeric /
       NULLIF(COUNT(DISTINCT pr.id), 0) * 100), 1
    )
  END as fulfillment_rate,
  COALESCE(COUNT(DISTINCT v.id), 0)::integer as total_verifications,
  MAX(pr.promise_date) as latest_promise_date
FROM politicians p
LEFT JOIN promises pr ON pr.politician_name = p.name
LEFT JOIN verifications v ON v.promise_id = pr.id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.slug, p.party, p.position, p.state, p.image_url;

-- =====================================================
-- 3. Fix politician_comparison_data view
-- =====================================================
DROP VIEW IF EXISTS public.politician_comparison_data CASCADE;

CREATE VIEW public.politician_comparison_data
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.name,
  p.slug,
  p.party,
  p.position,
  p.state,
  p.image_url,
  COALESCE(COUNT(DISTINCT pr.id), 0)::integer as total_promises,
  COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'fulfilled' THEN pr.id END), 0)::integer as fulfilled_promises,
  COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'broken' THEN pr.id END), 0)::integer as broken_promises,
  COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'in_progress' THEN pr.id END), 0)::integer as in_progress_promises,
  COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'pending' THEN pr.id END), 0)::integer as pending_promises,
  COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'stalled' THEN pr.id END), 0)::integer as stalled_promises,
  CASE
    WHEN COUNT(DISTINCT pr.id) = 0 THEN 0
    ELSE ROUND(
      (COUNT(DISTINCT CASE WHEN pr.status = 'fulfilled' THEN pr.id END)::numeric /
       NULLIF(COUNT(DISTINCT pr.id), 0) * 100), 1
    )
  END as fulfillment_rate
FROM politicians p
LEFT JOIN promises pr ON pr.politician_name = p.name
WHERE p.is_active = true
GROUP BY p.id, p.name, p.slug, p.party, p.position, p.state, p.image_url;

-- =====================================================
-- 4. Create/Replace get_politician_comparison function
-- =====================================================
CREATE OR REPLACE FUNCTION get_politician_comparison(p_slugs TEXT[])
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  party TEXT,
  politician_position TEXT,
  state TEXT,
  image_url TEXT,
  total_promises INTEGER,
  fulfilled_count INTEGER,
  broken_count INTEGER,
  in_progress_count INTEGER,
  pending_count INTEGER,
  stalled_count INTEGER,
  fulfillment_rate NUMERIC,
  grade TEXT,
  category_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name::TEXT,
    p.slug::TEXT,
    p.party::TEXT,
    p.position::TEXT as politician_position,
    p.state::TEXT,
    p.image_url::TEXT,
    COALESCE(COUNT(DISTINCT pr.id), 0)::INTEGER as total_promises,
    COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'fulfilled' THEN pr.id END), 0)::INTEGER as fulfilled_count,
    COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'broken' THEN pr.id END), 0)::INTEGER as broken_count,
    COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'in_progress' THEN pr.id END), 0)::INTEGER as in_progress_count,
    COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'pending' THEN pr.id END), 0)::INTEGER as pending_count,
    COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'stalled' THEN pr.id END), 0)::INTEGER as stalled_count,
    CASE
      WHEN COUNT(DISTINCT pr.id) = 0 THEN 0
      ELSE ROUND(
        (COUNT(DISTINCT CASE WHEN pr.status = 'fulfilled' THEN pr.id END)::NUMERIC /
         NULLIF(COUNT(DISTINCT pr.id), 0) * 100), 1
      )
    END as fulfillment_rate,
    CASE
      WHEN COUNT(DISTINCT pr.id) = 0 THEN 'N/A'
      WHEN (COUNT(DISTINCT CASE WHEN pr.status = 'fulfilled' THEN pr.id END)::NUMERIC / NULLIF(COUNT(DISTINCT pr.id), 0) * 100) >= 80 THEN 'A'
      WHEN (COUNT(DISTINCT CASE WHEN pr.status = 'fulfilled' THEN pr.id END)::NUMERIC / NULLIF(COUNT(DISTINCT pr.id), 0) * 100) >= 60 THEN 'B'
      WHEN (COUNT(DISTINCT CASE WHEN pr.status = 'fulfilled' THEN pr.id END)::NUMERIC / NULLIF(COUNT(DISTINCT pr.id), 0) * 100) >= 40 THEN 'C'
      WHEN (COUNT(DISTINCT CASE WHEN pr.status = 'fulfilled' THEN pr.id END)::NUMERIC / NULLIF(COUNT(DISTINCT pr.id), 0) * 100) >= 20 THEN 'D'
      ELSE 'F'
    END as grade,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'category', COALESCE(cat.category, 'Uncategorized'),
        'total', cat.total,
        'fulfilled', cat.fulfilled,
        'broken', cat.broken
      ))
      FROM (
        SELECT
          COALESCE(pr2.category, 'Uncategorized') as category,
          COUNT(*)::INTEGER as total,
          COUNT(CASE WHEN pr2.status = 'fulfilled' THEN 1 END)::INTEGER as fulfilled,
          COUNT(CASE WHEN pr2.status = 'broken' THEN 1 END)::INTEGER as broken
        FROM promises pr2
        WHERE pr2.politician_name = p.name
        GROUP BY COALESCE(pr2.category, 'Uncategorized')
      ) cat),
      '[]'::jsonb
    ) as category_breakdown
  FROM politicians p
  LEFT JOIN promises pr ON pr.politician_name = p.name
  WHERE p.slug = ANY(p_slugs)
  GROUP BY p.id, p.name, p.slug, p.party, p.position, p.state, p.image_url;
END;
$$;

-- =====================================================
-- 5. Create/Replace search_politicians_for_comparison function
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
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pcd.id,
    pcd.name::TEXT,
    pcd.slug::TEXT,
    pcd.party::TEXT,
    pcd.position::TEXT as politician_position,
    pcd.state::TEXT,
    pcd.image_url::TEXT,
    pcd.total_promises::BIGINT,
    pcd.fulfillment_rate
  FROM politician_comparison_data pcd
  WHERE (
    pcd.name ILIKE '%' || p_query || '%' OR
    pcd.party ILIKE '%' || p_query || '%' OR
    pcd.state ILIKE '%' || p_query || '%'
  )
  AND (p_exclude_slugs IS NULL OR pcd.slug != ALL(p_exclude_slugs))
  ORDER BY pcd.total_promises DESC
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- 6. Grant permissions
-- =====================================================
GRANT SELECT ON public.citizen_scores_mv TO authenticated;
GRANT SELECT ON public.citizen_scores_mv TO anon;
GRANT SELECT ON public.politician_stats TO authenticated;
GRANT SELECT ON public.politician_stats TO anon;
GRANT SELECT ON public.politician_comparison_data TO authenticated;
GRANT SELECT ON public.politician_comparison_data TO anon;

GRANT EXECUTE ON FUNCTION get_politician_comparison(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_politician_comparison(TEXT[]) TO anon;
GRANT EXECUTE ON FUNCTION search_politicians_for_comparison(TEXT, TEXT[], INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_politicians_for_comparison(TEXT, TEXT[], INTEGER) TO anon;
