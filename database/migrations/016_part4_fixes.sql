-- Migration: 016_part4_fixes.sql
-- Description: Fixes for get_brigade_statistics and is_admin functions
-- Author: Claude Code + Prithvi Putta
-- Date: 2025-11-27

-- ============================================================================
-- FIX 1: get_brigade_statistics function
-- ============================================================================
-- Fix the unnest() aggregate issue by using subqueries properly

CREATE OR REPLACE FUNCTION get_brigade_statistics()
RETURNS TABLE (
    total_brigades INTEGER,
    pending_review INTEGER,
    confirmed_brigades INTEGER,
    false_positives INTEGER,
    avg_confidence DECIMAL,
    unique_users_flagged INTEGER,
    unique_verifications_affected INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_brigades,
        COUNT(*) FILTER (WHERE resolution = 'pending')::INTEGER as pending_review,
        COUNT(*) FILTER (WHERE resolution = 'confirmed')::INTEGER as confirmed_brigades,
        COUNT(*) FILTER (WHERE resolution = 'false_positive')::INTEGER as false_positives,
        ROUND(AVG(confidence_score), 3) as avg_confidence,
        (
            SELECT COUNT(DISTINCT user_id)::INTEGER
            FROM vote_brigade_patterns vbp,
            LATERAL unnest(vbp.user_ids) as user_id
            WHERE vbp.flagged = TRUE
        ) as unique_users_flagged,
        (
            SELECT COUNT(DISTINCT verification_id)::INTEGER
            FROM vote_brigade_patterns vbp,
            LATERAL unnest(vbp.verification_ids) as verification_id
            WHERE vbp.flagged = TRUE
        ) as unique_verifications_affected
    FROM vote_brigade_patterns;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_brigade_statistics IS 'Returns summary statistics of detected vote brigades (FIXED)';

-- ============================================================================
-- FIX 2: is_admin function - Check actual admin roles table
-- ============================================================================
-- First, let's check what admin tables actually exist

DO $$
DECLARE
    v_has_admin_roles BOOLEAN;
    v_has_user_admin_roles BOOLEAN;
BEGIN
    -- Check if admin_roles table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'admin_roles'
    ) INTO v_has_admin_roles;

    -- Check if user_admin_roles table exists (old name)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_admin_roles'
    ) INTO v_has_user_admin_roles;

    IF v_has_admin_roles THEN
        RAISE NOTICE 'Found admin_roles table';
    ELSE
        RAISE NOTICE 'admin_roles table not found';
    END IF;

    IF v_has_user_admin_roles THEN
        RAISE NOTICE 'Found user_admin_roles table';
    ELSE
        RAISE NOTICE 'user_admin_roles table not found';
    END IF;
END $$;

-- ============================================================================
-- FIX 2: is_admin function - Use correct table structure
-- ============================================================================
-- This checks the users table for admin status directly

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    -- Method 1: Check if admin_roles and user_admin_roles exist
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'admin_roles'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_admin_roles'
    ) THEN
        -- Use the admin roles system
        SELECT EXISTS (
            SELECT 1
            FROM user_admin_roles uar
            JOIN users u ON uar.user_id = u.id
            WHERE u.auth_id = auth.uid()
        ) INTO v_is_admin;

        RETURN v_is_admin;
    END IF;

    -- Method 2: Check if users table has is_admin column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_admin'
    ) THEN
        SELECT is_admin INTO v_is_admin
        FROM users
        WHERE auth_id = auth.uid();

        RETURN COALESCE(v_is_admin, FALSE);
    END IF;

    -- Method 3: Check if users table has role column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        SELECT (role IN ('admin', 'super_admin', 'moderator')) INTO v_is_admin
        FROM users
        WHERE auth_id = auth.uid();

        RETURN COALESCE(v_is_admin, FALSE);
    END IF;

    -- Default: Return false if no admin system found
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin IS 'Returns true if current user has admin role (FIXED - works with any admin system)';

-- ============================================================================
-- FIX 3: can_review_brigades function - Use correct tables
-- ============================================================================

CREATE OR REPLACE FUNCTION can_review_brigades()
RETURNS BOOLEAN AS $$
DECLARE
    v_can_review BOOLEAN;
BEGIN
    -- Method 1: Check if admin roles system exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'admin_roles'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_admin_roles'
    ) THEN
        SELECT EXISTS (
            SELECT 1
            FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            JOIN users u ON uar.user_id = u.id
            WHERE u.auth_id = auth.uid()
            AND ar.name IN ('moderator', 'super_admin')
        ) INTO v_can_review;

        RETURN v_can_review;
    END IF;

    -- Method 2: Fallback to is_admin check
    RETURN is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_review_brigades IS 'Returns true if user can review brigade patterns (FIXED)';

-- ============================================================================
-- FIX 4: get_user_admin_level function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_admin_level()
RETURNS TEXT AS $$
DECLARE
    v_role_name TEXT;
BEGIN
    -- Method 1: Check if admin roles system exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'admin_roles'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_admin_roles'
    ) THEN
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
    END IF;

    -- Method 2: Check if users table has role column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        SELECT role INTO v_role_name
        FROM users
        WHERE auth_id = auth.uid();

        RETURN COALESCE(v_role_name, 'none');
    END IF;

    -- Method 3: Check if users table has is_admin boolean
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_admin'
    ) THEN
        SELECT CASE WHEN is_admin THEN 'admin' ELSE 'none' END INTO v_role_name
        FROM users
        WHERE auth_id = auth.uid();

        RETURN COALESCE(v_role_name, 'none');
    END IF;

    RETURN 'none';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_admin_level IS 'Returns current user admin role name or none (FIXED)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✓ Fixed get_brigade_statistics() - unnest issue resolved';
    RAISE NOTICE '✓ Fixed is_admin() - works with any admin system';
    RAISE NOTICE '✓ Fixed can_review_brigades() - dynamic table checking';
    RAISE NOTICE '✓ Fixed get_user_admin_level() - multi-method support';
    RAISE NOTICE '';
    RAISE NOTICE 'Test again with:';
    RAISE NOTICE '  SELECT * FROM get_brigade_statistics();';
    RAISE NOTICE '  SELECT * FROM get_pending_brigades(10, 0);';
END $$;
