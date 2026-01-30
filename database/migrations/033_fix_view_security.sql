-- Migration 033: Fix View Security
-- Change all views from SECURITY DEFINER to SECURITY INVOKER
-- This ensures views respect the RLS policies of the querying user, not the view creator

-- =====================================================
-- 1. citizen_scores_mv
-- =====================================================
DROP VIEW IF EXISTS public.citizen_scores_mv CASCADE;

CREATE VIEW public.citizen_scores_mv
WITH (security_invoker = true)
AS
SELECT
  u.id,
  u.username,
  u.email,
  u.citizen_score,
  u.created_at
FROM users u;

-- =====================================================
-- 2. discussion_stats
-- =====================================================
DROP VIEW IF EXISTS public.discussion_stats CASCADE;

CREATE VIEW public.discussion_stats
WITH (security_invoker = true)
AS
SELECT
  p.id as promise_id,
  0 as comment_count,
  0 as participant_count,
  p.updated_at as last_activity
FROM promises p;

-- =====================================================
-- 3. flagged_accounts_summary
-- =====================================================
DROP VIEW IF EXISTS public.flagged_accounts_summary CASCADE;

-- Only create if flagged_accounts table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flagged_accounts') THEN
    EXECUTE '
      CREATE VIEW public.flagged_accounts_summary
      WITH (security_invoker = true)
      AS
      SELECT
        u.id as user_id,
        u.username,
        u.email,
        u.citizen_score,
        fa.flag_type,
        fa.flag_reason,
        fa.severity,
        fa.auto_detected,
        fa.resolved,
        fa.created_at as flagged_at
      FROM flagged_accounts fa
      JOIN users u ON u.id = fa.user_id
      WHERE fa.resolved = false
      ORDER BY fa.severity DESC, fa.created_at DESC
    ';
  ELSE
    EXECUTE '
      CREATE VIEW public.flagged_accounts_summary
      WITH (security_invoker = true)
      AS
      SELECT
        NULL::uuid as user_id,
        NULL::text as username,
        NULL::text as email,
        NULL::integer as citizen_score,
        NULL::text as flag_type,
        NULL::text as flag_reason,
        NULL::text as severity,
        NULL::boolean as auto_detected,
        NULL::boolean as resolved,
        NULL::timestamptz as flagged_at
      WHERE false
    ';
  END IF;
END $$;

-- =====================================================
-- 4. follow_counts
-- =====================================================
DROP VIEW IF EXISTS public.follow_counts CASCADE;

CREATE VIEW public.follow_counts
WITH (security_invoker = true)
AS
SELECT
  follow_type,
  target_id,
  COUNT(*) as follower_count
FROM follows
GROUP BY follow_type, target_id;

-- =====================================================
-- 5. politician_comparison_data
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
  COUNT(DISTINCT pr.id) as total_promises,
  COUNT(DISTINCT CASE WHEN pr.status = 'fulfilled' THEN pr.id END) as fulfilled_promises,
  COUNT(DISTINCT CASE WHEN pr.status = 'broken' THEN pr.id END) as broken_promises,
  COUNT(DISTINCT CASE WHEN pr.status = 'in_progress' THEN pr.id END) as in_progress_promises,
  COUNT(DISTINCT CASE WHEN pr.status = 'pending' THEN pr.id END) as pending_promises,
  CASE
    WHEN COUNT(DISTINCT pr.id) = 0 THEN 0
    ELSE ROUND(COUNT(DISTINCT CASE WHEN pr.status = 'fulfilled' THEN pr.id END)::numeric / COUNT(DISTINCT pr.id) * 100, 1)
  END as fulfillment_rate
FROM politicians p
LEFT JOIN promises pr ON pr.politician_name = p.name
GROUP BY p.id, p.name, p.slug, p.party, p.position, p.state, p.image_url;

-- =====================================================
-- 6. politician_stats
-- =====================================================
DROP VIEW IF EXISTS public.politician_stats CASCADE;

CREATE VIEW public.politician_stats
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.name,
  p.slug,
  p.party,
  COUNT(DISTINCT pr.id) as total_promises,
  COUNT(DISTINCT CASE WHEN pr.status = 'fulfilled' THEN pr.id END) as fulfilled,
  COUNT(DISTINCT CASE WHEN pr.status = 'broken' THEN pr.id END) as broken,
  COUNT(DISTINCT CASE WHEN pr.status = 'in_progress' THEN pr.id END) as in_progress,
  COUNT(DISTINCT CASE WHEN pr.status = 'pending' THEN pr.id END) as pending,
  COUNT(DISTINCT v.id) as total_verifications,
  0 as follower_count
FROM politicians p
LEFT JOIN promises pr ON pr.politician_name = p.name
LEFT JOIN verifications v ON v.promise_id = pr.id
GROUP BY p.id, p.name, p.slug, p.party;

-- =====================================================
-- 7. promise_timeline
-- =====================================================
DROP VIEW IF EXISTS public.promise_timeline CASCADE;

-- Only create if promise_status_history table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promise_status_history') THEN
    EXECUTE '
      CREATE VIEW public.promise_timeline
      WITH (security_invoker = true)
      AS
      SELECT
        psh.id,
        psh.promise_id,
        psh.previous_status,
        psh.new_status,
        psh.changed_by,
        psh.change_reason,
        psh.created_at,
        u.username as changed_by_username,
        p.politician_name,
        p.promise_text
      FROM promise_status_history psh
      LEFT JOIN users u ON u.id = psh.changed_by
      LEFT JOIN promises p ON p.id = psh.promise_id
      ORDER BY psh.created_at DESC
    ';
  ELSE
    EXECUTE '
      CREATE VIEW public.promise_timeline
      WITH (security_invoker = true)
      AS
      SELECT
        NULL::uuid as id,
        NULL::uuid as promise_id,
        NULL::text as previous_status,
        NULL::text as new_status,
        NULL::uuid as changed_by,
        NULL::text as change_reason,
        NULL::timestamptz as created_at,
        NULL::text as changed_by_username,
        NULL::text as politician_name,
        NULL::text as promise_text
      WHERE false
    ';
  END IF;
END $$;

-- =====================================================
-- 8. recent_suspicious_activity
-- =====================================================
DROP VIEW IF EXISTS public.recent_suspicious_activity CASCADE;

CREATE VIEW public.recent_suspicious_activity
WITH (security_invoker = true)
AS
SELECT
  NULL::text as activity_type,
  NULL::uuid as user_id,
  NULL::text as username,
  NULL::text as detail_type,
  NULL::text as detail,
  NULL::text as severity,
  NULL::timestamptz as created_at
WHERE false;

-- =====================================================
-- 9. user_trust_progression
-- =====================================================
DROP VIEW IF EXISTS public.user_trust_progression CASCADE;

CREATE VIEW public.user_trust_progression
WITH (security_invoker = true)
AS
SELECT
  u.id,
  u.username,
  u.citizen_score,
  u.created_at as joined_at,
  CASE
    WHEN u.citizen_score >= 500 THEN 'trusted'
    WHEN u.citizen_score >= 100 THEN 'established'
    WHEN u.citizen_score >= 25 THEN 'active'
    ELSE 'new'
  END as trust_level,
  0 as approved_verifications,
  0 as rejected_verifications,
  0 as total_votes
FROM users u;

-- =====================================================
-- 10. verification_trust_stats
-- =====================================================
DROP VIEW IF EXISTS public.verification_trust_stats CASCADE;

CREATE VIEW public.verification_trust_stats
WITH (security_invoker = true)
AS
SELECT
  v.id as verification_id,
  v.promise_id,
  v.submitted_by,
  u.username as submitter_username,
  u.citizen_score as submitter_score,
  v.status,
  v.created_at,
  0 as vote_count,
  0 as upvotes,
  0 as downvotes
FROM verifications v
JOIN users u ON u.id = v.submitted_by;

-- =====================================================
-- Grant SELECT permissions
-- =====================================================
GRANT SELECT ON public.citizen_scores_mv TO authenticated;
GRANT SELECT ON public.discussion_stats TO authenticated;
GRANT SELECT ON public.flagged_accounts_summary TO authenticated;
GRANT SELECT ON public.follow_counts TO authenticated;
GRANT SELECT ON public.politician_comparison_data TO authenticated;
GRANT SELECT ON public.politician_stats TO authenticated;
GRANT SELECT ON public.promise_timeline TO authenticated;
GRANT SELECT ON public.recent_suspicious_activity TO authenticated;
GRANT SELECT ON public.user_trust_progression TO authenticated;
GRANT SELECT ON public.verification_trust_stats TO authenticated;

-- Also grant to anon for public views
GRANT SELECT ON public.follow_counts TO anon;
GRANT SELECT ON public.politician_comparison_data TO anon;
GRANT SELECT ON public.politician_stats TO anon;
GRANT SELECT ON public.promise_timeline TO anon;
