-- Migration: 016_part5_admin_check_fix.sql
-- Description: Final fix for is_admin() using dynamic SQL
-- Author: Claude Code + Prithvi Putta
-- Date: 2025-11-27

-- ============================================================================
-- FINAL FIX: is_admin() function using dynamic SQL
-- ============================================================================
-- Uses EXECUTE to avoid column validation issues

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN := FALSE;
    v_has_admin_roles BOOLEAN;
    v_has_is_admin_col BOOLEAN;
    v_has_role_col BOOLEAN;
    v_result TEXT;
BEGIN
    -- Check which tables/columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name IN ('admin_roles', 'user_admin_roles')
        GROUP BY 1
        HAVING COUNT(*) = 2
    ) INTO v_has_admin_roles;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_admin'
    ) INTO v_has_is_admin_col;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    ) INTO v_has_role_col;

    -- Method 1: Use admin_roles system if it exists
    IF v_has_admin_roles THEN
        EXECUTE '
            SELECT EXISTS (
                SELECT 1
                FROM user_admin_roles uar
                JOIN users u ON uar.user_id = u.id
                WHERE u.auth_id = $1
            )'
        INTO v_is_admin
        USING auth.uid();

        RETURN v_is_admin;
    END IF;

    -- Method 2: Use is_admin column if it exists
    IF v_has_is_admin_col THEN
        EXECUTE '
            SELECT COALESCE(is_admin, FALSE)
            FROM users
            WHERE auth_id = $1'
        INTO v_is_admin
        USING auth.uid();

        RETURN v_is_admin;
    END IF;

    -- Method 3: Use role column if it exists
    IF v_has_role_col THEN
        EXECUTE '
            SELECT COALESCE(role IN (''admin'', ''super_admin'', ''moderator''), FALSE)
            FROM users
            WHERE auth_id = $1'
        INTO v_is_admin
        USING auth.uid();

        RETURN v_is_admin;
    END IF;

    -- Default: No admin system found
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin IS 'Returns true if current user has admin role (FINAL FIX - uses dynamic SQL)';

-- ============================================================================
-- FINAL FIX: can_review_brigades() function
-- ============================================================================

CREATE OR REPLACE FUNCTION can_review_brigades()
RETURNS BOOLEAN AS $$
DECLARE
    v_can_review BOOLEAN := FALSE;
    v_has_admin_roles BOOLEAN;
BEGIN
    -- Check if admin roles system exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name IN ('admin_roles', 'user_admin_roles')
        GROUP BY 1
        HAVING COUNT(*) = 2
    ) INTO v_has_admin_roles;

    IF v_has_admin_roles THEN
        EXECUTE '
            SELECT EXISTS (
                SELECT 1
                FROM user_admin_roles uar
                JOIN admin_roles ar ON uar.role_id = ar.id
                JOIN users u ON uar.user_id = u.id
                WHERE u.auth_id = $1
                AND ar.name IN (''moderator'', ''super_admin'')
            )'
        INTO v_can_review
        USING auth.uid();

        RETURN v_can_review;
    END IF;

    -- Fallback: Use is_admin
    RETURN is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_review_brigades IS 'Returns true if user can review brigade patterns (FINAL FIX)';

-- ============================================================================
-- FINAL FIX: get_user_admin_level() function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_admin_level()
RETURNS TEXT AS $$
DECLARE
    v_role_name TEXT := 'none';
    v_has_admin_roles BOOLEAN;
    v_has_is_admin_col BOOLEAN;
    v_has_role_col BOOLEAN;
    v_is_admin BOOLEAN;
BEGIN
    -- Check which tables/columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name IN ('admin_roles', 'user_admin_roles')
        GROUP BY 1
        HAVING COUNT(*) = 2
    ) INTO v_has_admin_roles;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_admin'
    ) INTO v_has_is_admin_col;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    ) INTO v_has_role_col;

    -- Method 1: Use admin roles system
    IF v_has_admin_roles THEN
        EXECUTE '
            SELECT ar.name
            FROM user_admin_roles uar
            JOIN admin_roles ar ON uar.role_id = ar.id
            JOIN users u ON uar.user_id = u.id
            WHERE u.auth_id = $1
            ORDER BY
                CASE ar.name
                    WHEN ''super_admin'' THEN 3
                    WHEN ''moderator'' THEN 2
                    WHEN ''reviewer'' THEN 1
                    ELSE 0
                END DESC
            LIMIT 1'
        INTO v_role_name
        USING auth.uid();

        RETURN COALESCE(v_role_name, 'none');
    END IF;

    -- Method 2: Use role column
    IF v_has_role_col THEN
        EXECUTE '
            SELECT role
            FROM users
            WHERE auth_id = $1'
        INTO v_role_name
        USING auth.uid();

        RETURN COALESCE(v_role_name, 'none');
    END IF;

    -- Method 3: Use is_admin boolean
    IF v_has_is_admin_col THEN
        EXECUTE '
            SELECT is_admin
            FROM users
            WHERE auth_id = $1'
        INTO v_is_admin
        USING auth.uid();

        IF v_is_admin THEN
            RETURN 'admin';
        ELSE
            RETURN 'none';
        END IF;
    END IF;

    RETURN 'none';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_admin_level IS 'Returns current user admin role name or none (FINAL FIX)';

-- ============================================================================
-- DIAGNOSTIC: Show what admin system you have
-- ============================================================================

CREATE OR REPLACE FUNCTION diagnose_admin_system()
RETURNS TABLE (
    system_type TEXT,
    tables_found TEXT[],
    columns_found TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name IN ('admin_roles', 'user_admin_roles') GROUP BY 1 HAVING COUNT(*) = 2) THEN 'admin_roles_system'
            WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN 'role_column_system'
            WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin') THEN 'is_admin_column_system'
            ELSE 'no_admin_system'
        END as system_type,
        ARRAY(SELECT table_name::TEXT FROM information_schema.tables WHERE table_name LIKE '%admin%' ORDER BY table_name) as tables_found,
        ARRAY(SELECT column_name::TEXT FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('role', 'is_admin', 'admin_level') ORDER BY column_name) as columns_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION diagnose_admin_system IS 'Diagnoses which admin system is in place';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    v_diagnosis RECORD;
BEGIN
    SELECT * INTO v_diagnosis FROM diagnose_admin_system();

    RAISE NOTICE '✓ Fixed is_admin() - now uses dynamic SQL';
    RAISE NOTICE '✓ Fixed can_review_brigades() - uses dynamic SQL';
    RAISE NOTICE '✓ Fixed get_user_admin_level() - uses dynamic SQL';
    RAISE NOTICE '';
    RAISE NOTICE '=== ADMIN SYSTEM DIAGNOSIS ===';
    RAISE NOTICE 'System Type: %', v_diagnosis.system_type;
    RAISE NOTICE 'Admin Tables: %', v_diagnosis.tables_found;
    RAISE NOTICE 'User Columns: %', v_diagnosis.columns_found;
    RAISE NOTICE '';
    RAISE NOTICE 'Test again with:';
    RAISE NOTICE '  SELECT * FROM diagnose_admin_system();';
    RAISE NOTICE '  SELECT is_admin();';
    RAISE NOTICE '  SELECT * FROM get_pending_brigades(10, 0);';
END $$;
