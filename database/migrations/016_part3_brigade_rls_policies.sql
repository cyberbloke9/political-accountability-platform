-- Migration: 016_part3_brigade_rls_policies.sql
-- Description: Row-Level Security policies for vote brigade detection
-- Author: Claude Code + Prithvi Putta
-- Date: 2025-11-27
-- Dependencies: Requires 016_vote_brigade_detection.sql and 016_part2_brigade_detection_functions.sql

-- ============================================================================
-- ROW-LEVEL SECURITY POLICIES
-- ============================================================================
-- Ensures only admins can view and manage vote brigade data
-- Regular users cannot see brigade patterns or correlations
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON TABLES
-- ============================================================================

-- Enable RLS on vote_brigade_patterns
ALTER TABLE vote_brigade_patterns ENABLE ROW LEVEL SECURITY;

-- Enable RLS on vote_correlations
ALTER TABLE vote_correlations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_admin_roles uar
        JOIN users u ON uar.user_id = u.id
        WHERE u.auth_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin IS 'Returns true if current user has admin role';

-- ============================================================================
-- POLICIES FOR: vote_brigade_patterns
-- ============================================================================

-- Admin can view all brigade patterns
CREATE POLICY "Admins can view all vote brigade patterns"
ON vote_brigade_patterns
FOR SELECT
TO authenticated
USING (is_admin());

-- Admin can insert brigade patterns (for manual flagging)
CREATE POLICY "Admins can insert vote brigade patterns"
ON vote_brigade_patterns
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Admin can update brigade patterns (mark as reviewed, resolved, etc.)
CREATE POLICY "Admins can update vote brigade patterns"
ON vote_brigade_patterns
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Admin can delete false positive brigade patterns
CREATE POLICY "Admins can delete vote brigade patterns"
ON vote_brigade_patterns
FOR DELETE
TO authenticated
USING (is_admin());

-- Service role (backend functions) can do everything
CREATE POLICY "Service role can manage vote brigade patterns"
ON vote_brigade_patterns
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- POLICIES FOR: vote_correlations
-- ============================================================================

-- Admin can view all correlations
CREATE POLICY "Admins can view vote correlations"
ON vote_correlations
FOR SELECT
TO authenticated
USING (is_admin());

-- Service role (backend functions) can manage correlations
CREATE POLICY "Service role can manage vote correlations"
ON vote_correlations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- System functions can insert/update correlations
CREATE POLICY "System can insert vote correlations"
ON vote_correlations
FOR INSERT
TO authenticated
WITH CHECK (
    -- Allow if called from detection functions (SECURITY DEFINER)
    current_setting('role') = 'authenticated'
);

CREATE POLICY "System can update vote correlations"
ON vote_correlations
FOR UPDATE
TO authenticated
USING (
    -- Allow if called from detection functions (SECURITY DEFINER)
    current_setting('role') = 'authenticated'
);

-- ============================================================================
-- ADDITIONAL SECURITY FUNCTIONS
-- ============================================================================

-- Function: Check if user can review brigades (Moderator or SuperAdmin)
CREATE OR REPLACE FUNCTION can_review_brigades()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_admin_roles uar
        JOIN admin_roles ar ON uar.role_id = ar.id
        JOIN users u ON uar.user_id = u.id
        WHERE u.auth_id = auth.uid()
        AND ar.name IN ('moderator', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_review_brigades IS 'Returns true if user can review brigade patterns';

-- Function: Get user's admin level (for frontend)
CREATE OR REPLACE FUNCTION get_user_admin_level()
RETURNS TEXT AS $$
DECLARE
    v_role_name TEXT;
BEGIN
    SELECT ar.name INTO v_role_name
    FROM user_admin_roles uar
    JOIN admin_roles ar ON uar.role_id = ar.id
    JOIN users u ON uar.user_id = u.id
    WHERE u.auth_id = auth.uid()
    ORDER BY
        CASE ar.name
            WHEN 'super_admin' THEN 3
            WHEN 'moderator' THEN 2
            WHEN 'reviewer' THEN 1
            ELSE 0
        END DESC
    LIMIT 1;

    RETURN COALESCE(v_role_name, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_admin_level IS 'Returns current user admin role name or none';

-- ============================================================================
-- FUNCTION: Mark brigade as reviewed
-- ============================================================================
-- Secure function for admins to mark brigades as reviewed
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_brigade_reviewed(
    p_brigade_id UUID,
    p_resolution TEXT,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Check if user is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can mark brigades as reviewed';
    END IF;

    -- Validate resolution
    IF p_resolution NOT IN ('confirmed', 'false_positive', 'pending') THEN
        RAISE EXCEPTION 'Invalid resolution. Must be confirmed, false_positive, or pending';
    END IF;

    -- Get current user's database ID
    SELECT id INTO v_user_id
    FROM users
    WHERE auth_id = auth.uid();

    -- Update brigade pattern
    UPDATE vote_brigade_patterns
    SET
        reviewed = TRUE,
        reviewed_by = v_user_id,
        reviewed_at = NOW(),
        resolution = p_resolution,
        admin_notes = p_admin_notes,
        flagged = CASE WHEN p_resolution = 'false_positive' THEN FALSE ELSE flagged END
    WHERE id = p_brigade_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_brigade_reviewed IS 'Allows admins to mark brigade patterns as reviewed with resolution';

-- ============================================================================
-- FUNCTION: Get pending brigades for review (Admin dashboard)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_pending_brigades(
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    brigade_id UUID,
    user_ids UUID[],
    usernames TEXT[],
    verification_count INTEGER,
    confidence_score DECIMAL,
    pattern_type TEXT,
    detection_timestamp TIMESTAMPTZ,
    pattern_details JSONB
) AS $$
BEGIN
    -- Check if user is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can view pending brigades';
    END IF;

    RETURN QUERY
    SELECT
        vbp.id,
        vbp.user_ids,
        ARRAY(
            SELECT u.username
            FROM unnest(vbp.user_ids) uid
            JOIN users u ON u.id = uid
        ) as usernames,
        array_length(vbp.verification_ids, 1) as verification_count,
        vbp.confidence_score,
        vbp.pattern_type,
        vbp.detection_timestamp,
        vbp.pattern_details
    FROM vote_brigade_patterns vbp
    WHERE vbp.resolution = 'pending'
    AND vbp.flagged = TRUE
    ORDER BY vbp.confidence_score DESC, vbp.detection_timestamp DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_pending_brigades IS 'Returns pending brigade patterns for admin review';

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================

-- Grant execute on admin functions to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION can_review_brigades() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_admin_level() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_brigade_reviewed(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_brigades(INTEGER, INTEGER) TO authenticated;

-- Grant execute on detection functions to service role
GRANT EXECUTE ON FUNCTION detect_vote_brigades() TO service_role;
GRANT EXECUTE ON FUNCTION calculate_vote_correlations() TO service_role;
GRANT EXECUTE ON FUNCTION detect_rapid_voting_brigade(INTEGER, INTEGER) TO service_role;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

DO $$
DECLARE
    v_rls_enabled_brigades BOOLEAN;
    v_rls_enabled_correlations BOOLEAN;
BEGIN
    -- Check if RLS is enabled
    SELECT relrowsecurity INTO v_rls_enabled_brigades
    FROM pg_class
    WHERE relname = 'vote_brigade_patterns';

    SELECT relrowsecurity INTO v_rls_enabled_correlations
    FROM pg_class
    WHERE relname = 'vote_correlations';

    IF NOT v_rls_enabled_brigades THEN
        RAISE EXCEPTION 'RLS not enabled on vote_brigade_patterns';
    END IF;

    IF NOT v_rls_enabled_correlations THEN
        RAISE EXCEPTION 'RLS not enabled on vote_correlations';
    END IF;

    -- Verify policies exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'vote_brigade_patterns'
        AND policyname = 'Admins can view all vote brigade patterns'
    ) THEN
        RAISE EXCEPTION 'Admin view policy not created for vote_brigade_patterns';
    END IF;

    RAISE NOTICE 'Migration 016 Part 3: RLS Policies created successfully';
    RAISE NOTICE 'Only admins can now view and manage brigade data';
    RAISE NOTICE 'Test with: SELECT * FROM get_pending_brigades();';
END $$;
