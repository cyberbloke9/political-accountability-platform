-- Step 1: Create missing tables                                                                                                                             CREATE TABLE IF NOT EXISTS verification_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                                                                                               verification_id UUID REFERENCES verifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(verification_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS promise_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promise_id UUID REFERENCES promises(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by UUID REFERENCES users(id),
    change_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS flagged_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    flag_type VARCHAR(50),
    flag_reason TEXT,
    severity VARCHAR(20) DEFAULT 'low',
    auto_detected BOOLEAN DEFAULT false,
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Step 2: Drop ALL views
  DROP VIEW IF EXISTS public.verification_trust_stats CASCADE;
  DROP VIEW IF EXISTS public.user_trust_progression CASCADE;
  DROP VIEW IF EXISTS public.recent_suspicious_activity CASCADE;
  DROP VIEW IF EXISTS public.promise_timeline CASCADE;
  DROP VIEW IF EXISTS public.politician_stats CASCADE;
  DROP VIEW IF EXISTS public.politician_comparison_data CASCADE;
  DROP VIEW IF EXISTS public.follow_counts CASCADE;
  DROP VIEW IF EXISTS public.flagged_accounts_summary CASCADE;
  DROP VIEW IF EXISTS public.discussion_stats CASCADE;
  DROP VIEW IF EXISTS public.citizen_scores_mv CASCADE;
  DROP MATERIALIZED VIEW IF EXISTS public.citizen_scores_mv CASCADE;

  -- Step 3: Recreate all views with security_invoker
  CREATE VIEW public.citizen_scores_mv WITH (security_invoker = true) AS
  SELECT u.id, u.username, u.email, u.citizen_score, u.created_at FROM users u;

  CREATE VIEW public.discussion_stats WITH (security_invoker = true) AS
  SELECT p.id as promise_id, 0 as comment_count, 0 as participant_count, p.updated_at as last_activity FROM promises p;

  CREATE VIEW public.flagged_accounts_summary WITH (security_invoker = true) AS
  SELECT u.id as user_id, u.username, u.email, u.citizen_score, fa.flag_type, fa.flag_reason, fa.severity, fa.auto_detected, fa.resolved, fa.created_at as
  flagged_at
  FROM flagged_accounts fa JOIN users u ON u.id = fa.user_id WHERE fa.resolved = false ORDER BY fa.severity DESC, fa.created_at DESC;

  CREATE VIEW public.follow_counts WITH (security_invoker = true) AS
  SELECT follow_type, target_id, COUNT(*) as follower_count FROM follows GROUP BY follow_type, target_id;

  CREATE VIEW public.politician_comparison_data WITH (security_invoker = true) AS
  SELECT p.id, p.name, p.slug, p.party, p.position, p.state, p.image_url,
    COUNT(DISTINCT pr.id) as total_promises,
    COUNT(DISTINCT CASE WHEN pr.status = 'fulfilled' THEN pr.id END) as fulfilled_promises,
    COUNT(DISTINCT CASE WHEN pr.status = 'broken' THEN pr.id END) as broken_promises,
    COUNT(DISTINCT CASE WHEN pr.status = 'in_progress' THEN pr.id END) as in_progress_promises,
    COUNT(DISTINCT CASE WHEN pr.status = 'pending' THEN pr.id END) as pending_promises,
    CASE WHEN COUNT(DISTINCT pr.id) = 0 THEN 0 ELSE ROUND(COUNT(DISTINCT CASE WHEN pr.status = 'fulfilled' THEN pr.id END)::numeric / COUNT(DISTINCT pr.id) *
   100, 1) END as fulfillment_rate
  FROM politicians p LEFT JOIN promises pr ON pr.politician_name = p.name GROUP BY p.id, p.name, p.slug, p.party, p.position, p.state, p.image_url;

  CREATE VIEW public.politician_stats WITH (security_invoker = true) AS
  SELECT p.id, p.name, p.slug, p.party,
    COUNT(DISTINCT pr.id) as total_promises,
    COUNT(DISTINCT CASE WHEN pr.status = 'fulfilled' THEN pr.id END) as fulfilled,
    COUNT(DISTINCT CASE WHEN pr.status = 'broken' THEN pr.id END) as broken,
    COUNT(DISTINCT CASE WHEN pr.status = 'in_progress' THEN pr.id END) as in_progress,
    COUNT(DISTINCT CASE WHEN pr.status = 'pending' THEN pr.id END) as pending,
    COUNT(DISTINCT v.id) as total_verifications, 0 as follower_count
  FROM politicians p LEFT JOIN promises pr ON pr.politician_name = p.name LEFT JOIN verifications v ON v.promise_id = pr.id GROUP BY p.id, p.name, p.slug,
  p.party;

  CREATE VIEW public.promise_timeline WITH (security_invoker = true) AS
  SELECT psh.id, psh.promise_id, psh.previous_status, psh.new_status, psh.changed_by, psh.change_reason, psh.created_at, u.username as changed_by_username,
  p.politician_name, p.promise_text
  FROM promise_status_history psh LEFT JOIN users u ON u.id = psh.changed_by LEFT JOIN promises p ON p.id = psh.promise_id ORDER BY psh.created_at DESC;

  CREATE VIEW public.recent_suspicious_activity WITH (security_invoker = true) AS
  SELECT NULL::text as activity_type, NULL::uuid as user_id, NULL::text as username, NULL::text as detail_type, NULL::text as detail, NULL::text as severity,
   NULL::timestamptz as created_at WHERE false;

  CREATE VIEW public.user_trust_progression WITH (security_invoker = true) AS
  SELECT u.id, u.username, u.citizen_score, u.created_at as joined_at,
    CASE WHEN u.citizen_score >= 500 THEN 'trusted' WHEN u.citizen_score >= 100 THEN 'established' WHEN u.citizen_score >= 25 THEN 'active' ELSE 'new' END as
   trust_level,
    COUNT(DISTINCT CASE WHEN v.status = 'approved' THEN v.id END) as approved_verifications,
    COUNT(DISTINCT CASE WHEN v.status = 'rejected' THEN v.id END) as rejected_verifications,
    COUNT(DISTINCT vv.id) as total_votes
  FROM users u LEFT JOIN verifications v ON v.submitted_by = u.id LEFT JOIN verification_votes vv ON vv.user_id = u.id GROUP BY u.id, u.username,
  u.citizen_score, u.created_at;

  CREATE VIEW public.verification_trust_stats WITH (security_invoker = true) AS
  SELECT v.id as verification_id, v.promise_id, v.submitted_by, u.username as submitter_username, u.citizen_score as submitter_score, v.status, v.created_at,
    COUNT(vv.id) as vote_count, COUNT(CASE WHEN vv.vote_type = 'up' THEN 1 END) as upvotes, COUNT(CASE WHEN vv.vote_type = 'down' THEN 1 END) as downvotes
  FROM verifications v JOIN users u ON u.id = v.submitted_by LEFT JOIN verification_votes vv ON vv.verification_id = v.id GROUP BY v.id, v.promise_id,
  v.submitted_by, u.username, u.citizen_score, v.status, v.created_at;

  -- Step 4: Grant permissions
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
  GRANT SELECT ON public.follow_counts TO anon;
  GRANT SELECT ON public.politician_comparison_data TO anon;
  GRANT SELECT ON public.politician_stats TO anon;
  GRANT SELECT ON public.promise_timeline TO anon;