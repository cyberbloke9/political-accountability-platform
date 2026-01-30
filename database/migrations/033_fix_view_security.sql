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
  u.created_at,
  COALESCE(v.verification_count, 0) as verification_count,
  COALESCE(vt.vote_count, 0) as vote_count
FROM users u
LEFT JOIN (
  SELECT submitted_by, COUNT(*) as verification_count
  FROM verifications
  WHERE status = 'approved'
  GROUP BY submitted_by
) v ON v.submitted_by = u.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as vote_count
  FROM verification_votes
  GROUP BY user_id
) vt ON vt.user_id = u.id;

-- =====================================================
-- 2. discussion_stats
-- =====================================================
DROP VIEW IF EXISTS public.discussion_stats CASCADE;

CREATE VIEW public.discussion_stats
WITH (security_invoker = true)
AS
SELECT
  p.id as promise_id,
  COUNT(DISTINCT c.id) as comment_count,
  COUNT(DISTINCT c.user_id) as participant_count,
  MAX(c.created_at) as last_activity
FROM promises p
LEFT JOIN comments c ON c.promise_id = p.id AND c.deleted_at IS NULL
GROUP BY p.id;

-- =====================================================
-- 3. flagged_accounts_summary
-- =====================================================
DROP VIEW IF EXISTS public.flagged_accounts_summary CASCADE;

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
ORDER BY fa.severity DESC, fa.created_at DESC;

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
  COALESCE(fc.follower_count, 0) as follower_count
FROM politicians p
LEFT JOIN promises pr ON pr.politician_name = p.name
LEFT JOIN verifications v ON v.promise_id = pr.id
LEFT JOIN follow_counts fc ON fc.target_id = p.id AND fc.follow_type = 'politician'
GROUP BY p.id, p.name, p.slug, p.party, fc.follower_count;

-- =====================================================
-- 7. promise_timeline
-- =====================================================
DROP VIEW IF EXISTS public.promise_timeline CASCADE;

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
ORDER BY psh.created_at DESC;

-- =====================================================
-- 8. recent_suspicious_activity
-- =====================================================
DROP VIEW IF EXISTS public.recent_suspicious_activity CASCADE;

CREATE VIEW public.recent_suspicious_activity
WITH (security_invoker = true)
AS
SELECT
  'flagged_account' as activity_type,
  fa.user_id,
  u.username,
  fa.flag_type as detail_type,
  fa.flag_reason as detail,
  fa.severity,
  fa.created_at
FROM flagged_accounts fa
JOIN users u ON u.id = fa.user_id
WHERE fa.created_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT
  'vote_brigade' as activity_type,
  NULL as user_id,
  NULL as username,
  'brigade_detected' as detail_type,
  'Vote brigade with ' || member_count || ' members' as detail,
  CASE WHEN confidence_score > 0.8 THEN 'high' ELSE 'medium' END as severity,
  detected_at as created_at
FROM vote_brigades
WHERE detected_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 50;

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
  COALESCE(v.approved_count, 0) as approved_verifications,
  COALESCE(v.rejected_count, 0) as rejected_verifications,
  COALESCE(vt.vote_count, 0) as total_votes
FROM users u
LEFT JOIN (
  SELECT
    submitted_by,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count
  FROM verifications
  GROUP BY submitted_by
) v ON v.submitted_by = u.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as vote_count
  FROM verification_votes
  GROUP BY user_id
) vt ON vt.user_id = u.id;

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
  COUNT(DISTINCT vv.id) as vote_count,
  COUNT(DISTINCT CASE WHEN vv.vote_type = 'upvote' THEN vv.id END) as upvotes,
  COUNT(DISTINCT CASE WHEN vv.vote_type = 'downvote' THEN vv.id END) as downvotes
FROM verifications v
JOIN users u ON u.id = v.submitted_by
LEFT JOIN verification_votes vv ON vv.verification_id = v.id
GROUP BY v.id, v.promise_id, v.submitted_by, u.username, u.citizen_score, v.status, v.created_at;

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
