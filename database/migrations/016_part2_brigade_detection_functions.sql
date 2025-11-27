-- Migration: 016_part2_brigade_detection_functions.sql
-- Description: Vote brigade detection algorithms and analysis functions
-- Author: Claude Code + Prithvi Putta
-- Date: 2025-11-27
-- Dependencies: Requires 016_vote_brigade_detection.sql to be run first

-- ============================================================================
-- VOTE BRIGADE DETECTION FUNCTIONS
-- ============================================================================
-- Core algorithms for detecting coordinated voting patterns
-- ============================================================================

-- ============================================================================
-- FUNCTION: calculate_vote_correlations
-- ============================================================================
-- Analyzes voting patterns between all user pairs and calculates correlation
-- This function should be run periodically (e.g., hourly) to update correlations
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_vote_correlations()
RETURNS TABLE (
    pairs_analyzed INTEGER,
    high_correlations INTEGER,
    brigades_detected INTEGER
) AS $$
DECLARE
    v_pairs_analyzed INTEGER := 0;
    v_high_correlations INTEGER := 0;
    v_brigades_detected INTEGER := 0;
    v_user_pair RECORD;
    v_correlation_data RECORD;
BEGIN
    -- Loop through all user pairs who have voted on common verifications
    FOR v_user_pair IN
        SELECT DISTINCT
            LEAST(v1.user_id, v2.user_id) as user_id_1,
            GREATEST(v1.user_id, v2.user_id) as user_id_2
        FROM votes v1
        JOIN votes v2 ON v1.verification_id = v2.verification_id
        WHERE v1.user_id < v2.user_id
        AND v1.user_id != v2.user_id
    LOOP
        v_pairs_analyzed := v_pairs_analyzed + 1;

        -- Calculate correlation metrics for this pair
        SELECT
            COUNT(*) as total_compared,
            SUM(CASE WHEN v1.vote_type = v2.vote_type THEN 1 ELSE 0 END) as same_votes,
            AVG(EXTRACT(EPOCH FROM (v2.created_at - v1.created_at))) as avg_time_diff,
            SUM(CASE WHEN EXTRACT(EPOCH FROM (v2.created_at - v1.created_at)) BETWEEN 0 AND 60 THEN 1 ELSE 0 END) as within_1min,
            SUM(CASE WHEN EXTRACT(EPOCH FROM (v2.created_at - v1.created_at)) BETWEEN 0 AND 300 THEN 1 ELSE 0 END) as within_5min
        INTO v_correlation_data
        FROM votes v1
        JOIN votes v2 ON v1.verification_id = v2.verification_id
        WHERE v1.user_id = v_user_pair.user_id_1
        AND v2.user_id = v_user_pair.user_id_2
        AND v1.created_at <= v2.created_at;

        -- Skip if less than 3 common votes
        IF v_correlation_data.total_compared >= 3 THEN
            -- Insert or update correlation record
            INSERT INTO vote_correlations (
                user_id_1,
                user_id_2,
                total_same_votes,
                total_compared_votes,
                correlation_percentage,
                avg_vote_time_diff_seconds,
                votes_within_1min,
                votes_within_5min,
                last_calculated_at
            ) VALUES (
                v_user_pair.user_id_1,
                v_user_pair.user_id_2,
                v_correlation_data.same_votes,
                v_correlation_data.total_compared,
                ROUND((v_correlation_data.same_votes::DECIMAL / v_correlation_data.total_compared * 100), 2),
                ROUND(ABS(v_correlation_data.avg_time_diff))::INTEGER,
                v_correlation_data.within_1min,
                v_correlation_data.within_5min,
                NOW()
            )
            ON CONFLICT (user_id_1, user_id_2)
            DO UPDATE SET
                total_same_votes = EXCLUDED.total_same_votes,
                total_compared_votes = EXCLUDED.total_compared_votes,
                correlation_percentage = EXCLUDED.correlation_percentage,
                avg_vote_time_diff_seconds = EXCLUDED.avg_vote_time_diff_seconds,
                votes_within_1min = EXCLUDED.votes_within_1min,
                votes_within_5min = EXCLUDED.votes_within_5min,
                last_calculated_at = NOW();

            -- Count high correlations (> 80%)
            IF (v_correlation_data.same_votes::DECIMAL / v_correlation_data.total_compared * 100) > 80 THEN
                v_high_correlations := v_high_correlations + 1;
            END IF;
        END IF;
    END LOOP;

    -- Now detect brigades from high correlations
    v_brigades_detected := detect_vote_brigades_from_correlations();

    RETURN QUERY SELECT v_pairs_analyzed, v_high_correlations, v_brigades_detected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_vote_correlations IS 'Calculates voting correlation between all user pairs and detects brigades';

-- ============================================================================
-- FUNCTION: detect_vote_brigades_from_correlations
-- ============================================================================
-- Detects vote brigades from high correlation patterns
-- Returns number of new brigades detected
-- ============================================================================

CREATE OR REPLACE FUNCTION detect_vote_brigades_from_correlations()
RETURNS INTEGER AS $$
DECLARE
    v_brigades_detected INTEGER := 0;
    v_brigade_group RECORD;
    v_user_ids UUID[];
    v_verification_ids UUID[];
    v_confidence DECIMAL;
    v_pattern_details JSONB;
BEGIN
    -- Find groups of users with >80% correlation and >5 votes within 1 minute
    FOR v_brigade_group IN
        SELECT
            vc.user_id_1,
            vc.user_id_2,
            vc.correlation_percentage,
            vc.votes_within_1min,
            vc.total_compared_votes
        FROM vote_correlations vc
        WHERE vc.correlation_percentage > 80.0
        AND vc.votes_within_1min >= 5
        AND vc.last_calculated_at > NOW() - INTERVAL '1 hour'
        ORDER BY vc.correlation_percentage DESC, vc.votes_within_1min DESC
    LOOP
        -- Get the list of verifications they voted on identically
        SELECT
            ARRAY_AGG(DISTINCT v1.verification_id)
        INTO v_verification_ids
        FROM votes v1
        JOIN votes v2 ON v1.verification_id = v2.verification_id
        WHERE v1.user_id = v_brigade_group.user_id_1
        AND v2.user_id = v_brigade_group.user_id_2
        AND v1.vote_type = v2.vote_type
        AND EXTRACT(EPOCH FROM (v2.created_at - v1.created_at)) BETWEEN 0 AND 60;

        -- Only create brigade if they have at least 5 identical votes
        IF array_length(v_verification_ids, 1) >= 5 THEN
            v_user_ids := ARRAY[v_brigade_group.user_id_1, v_brigade_group.user_id_2];

            -- Calculate confidence score (0.0 - 1.0)
            -- Based on: correlation percentage, time proximity, vote count
            v_confidence := LEAST(1.0,
                (v_brigade_group.correlation_percentage / 100.0 * 0.4) +
                (LEAST(v_brigade_group.votes_within_1min, 20)::DECIMAL / 20.0 * 0.4) +
                (LEAST(v_brigade_group.total_compared_votes, 30)::DECIMAL / 30.0 * 0.2)
            );

            -- Build pattern details
            v_pattern_details := jsonb_build_object(
                'correlation_percentage', v_brigade_group.correlation_percentage,
                'votes_within_1min', v_brigade_group.votes_within_1min,
                'total_compared_votes', v_brigade_group.total_compared_votes,
                'identical_vote_count', array_length(v_verification_ids, 1),
                'detection_method', 'correlation_analysis'
            );

            -- Check if this brigade pattern already exists (avoid duplicates)
            IF NOT EXISTS (
                SELECT 1 FROM vote_brigade_patterns
                WHERE user_ids = v_user_ids
                AND verification_ids = v_verification_ids
                AND detection_timestamp > NOW() - INTERVAL '7 days'
            ) THEN
                -- Insert brigade pattern
                INSERT INTO vote_brigade_patterns (
                    user_ids,
                    verification_ids,
                    confidence_score,
                    pattern_type,
                    pattern_details,
                    flagged,
                    resolution
                ) VALUES (
                    v_user_ids,
                    v_verification_ids,
                    v_confidence,
                    'identical_voting',
                    v_pattern_details,
                    TRUE,
                    'pending'
                );

                v_brigades_detected := v_brigades_detected + 1;
            END IF;
        END IF;
    END LOOP;

    RETURN v_brigades_detected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION detect_vote_brigades_from_correlations IS 'Detects vote brigades from correlation analysis';

-- ============================================================================
-- FUNCTION: detect_vote_brigades
-- ============================================================================
-- Main entry point for brigade detection - runs full analysis pipeline
-- Returns summary of detection results
-- ============================================================================

CREATE OR REPLACE FUNCTION detect_vote_brigades()
RETURNS TABLE (
    pairs_analyzed INTEGER,
    high_correlations INTEGER,
    brigades_detected INTEGER,
    execution_time_ms INTEGER
) AS $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
    v_result RECORD;
BEGIN
    v_start_time := clock_timestamp();

    -- Run correlation calculation and brigade detection
    SELECT * INTO v_result FROM calculate_vote_correlations();

    v_end_time := clock_timestamp();

    RETURN QUERY SELECT
        v_result.pairs_analyzed,
        v_result.high_correlations,
        v_result.brigades_detected,
        EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION detect_vote_brigades IS 'Main function to detect all vote brigades - runs full analysis pipeline';

-- ============================================================================
-- FUNCTION: detect_rapid_voting_brigade
-- ============================================================================
-- Detects suspicious velocity patterns (many votes in short time)
-- Complementary to correlation-based detection
-- ============================================================================

CREATE OR REPLACE FUNCTION detect_rapid_voting_brigade(
    p_time_window_minutes INTEGER DEFAULT 5,
    p_min_votes INTEGER DEFAULT 10
)
RETURNS INTEGER AS $$
DECLARE
    v_brigades_detected INTEGER := 0;
    v_rapid_voter RECORD;
    v_verification_ids UUID[];
    v_confidence DECIMAL;
BEGIN
    -- Find users who cast unusually many votes in a short time window
    FOR v_rapid_voter IN
        SELECT
            v.user_id,
            COUNT(*) as vote_count,
            ARRAY_AGG(v.verification_id) as verifications,
            MIN(v.created_at) as first_vote,
            MAX(v.created_at) as last_vote
        FROM votes v
        WHERE v.created_at > NOW() - INTERVAL '24 hours'
        GROUP BY v.user_id, DATE_TRUNC('hour', v.created_at)
        HAVING COUNT(*) >= p_min_votes
        AND EXTRACT(EPOCH FROM (MAX(v.created_at) - MIN(v.created_at))) <= (p_time_window_minutes * 60)
    LOOP
        -- Calculate confidence based on voting velocity
        v_confidence := LEAST(1.0,
            (v_rapid_voter.vote_count::DECIMAL / 20.0 * 0.6) +
            (1.0 - (EXTRACT(EPOCH FROM (v_rapid_voter.last_vote - v_rapid_voter.first_vote)) / (p_time_window_minutes * 60)) * 0.4)
        );

        -- Check if not already flagged
        IF NOT EXISTS (
            SELECT 1 FROM vote_brigade_patterns
            WHERE v_rapid_voter.user_id = ANY(user_ids)
            AND pattern_type = 'suspicious_velocity'
            AND detection_timestamp > NOW() - INTERVAL '24 hours'
        ) THEN
            INSERT INTO vote_brigade_patterns (
                user_ids,
                verification_ids,
                confidence_score,
                pattern_type,
                pattern_details,
                flagged,
                resolution
            ) VALUES (
                ARRAY[v_rapid_voter.user_id],
                v_rapid_voter.verifications,
                v_confidence,
                'suspicious_velocity',
                jsonb_build_object(
                    'vote_count', v_rapid_voter.vote_count,
                    'time_window_seconds', EXTRACT(EPOCH FROM (v_rapid_voter.last_vote - v_rapid_voter.first_vote)),
                    'votes_per_minute', ROUND(v_rapid_voter.vote_count::DECIMAL / (EXTRACT(EPOCH FROM (v_rapid_voter.last_vote - v_rapid_voter.first_vote)) / 60.0), 2)
                ),
                TRUE,
                'pending'
            );

            v_brigades_detected := v_brigades_detected + 1;
        END IF;
    END LOOP;

    RETURN v_brigades_detected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION detect_rapid_voting_brigade IS 'Detects suspicious rapid voting patterns (velocity-based detection)';

-- ============================================================================
-- FUNCTION: get_brigade_statistics
-- ============================================================================
-- Returns summary statistics of detected brigades
-- ============================================================================

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
        (SELECT COUNT(DISTINCT unnest(user_ids)) FROM vote_brigade_patterns WHERE flagged = TRUE)::INTEGER as unique_users_flagged,
        (SELECT COUNT(DISTINCT unnest(verification_ids)) FROM vote_brigade_patterns WHERE flagged = TRUE)::INTEGER as unique_verifications_affected
    FROM vote_brigade_patterns;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_brigade_statistics IS 'Returns summary statistics of detected vote brigades';

-- ============================================================================
-- TEST FUNCTION: Create test brigade data
-- ============================================================================
-- Helper function to create test data for brigade detection testing
-- ============================================================================

CREATE OR REPLACE FUNCTION create_test_brigade_data()
RETURNS TEXT AS $$
DECLARE
    v_message TEXT;
BEGIN
    -- This function would create test users and votes for testing
    -- Only used in development/testing environments
    v_message := 'Test brigade data creation function ready. Run with appropriate test data.';
    RETURN v_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_test_brigade_data IS 'Helper function for creating test brigade data (development only)';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

DO $$
BEGIN
    -- Verify all functions were created
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_vote_correlations') THEN
        RAISE EXCEPTION 'Function calculate_vote_correlations was not created';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'detect_vote_brigades') THEN
        RAISE EXCEPTION 'Function detect_vote_brigades was not created';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'detect_rapid_voting_brigade') THEN
        RAISE EXCEPTION 'Function detect_rapid_voting_brigade was not created';
    END IF;

    RAISE NOTICE 'Migration 016 Part 2: Vote Brigade Detection Functions created successfully';
    RAISE NOTICE 'You can now run: SELECT * FROM detect_vote_brigades();';
END $$;
