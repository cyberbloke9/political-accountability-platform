-- Migration: 016_vote_brigade_detection.sql
-- Description: Detect coordinated voting groups (vote brigades)
-- Author: Claude Code + Prithvi Putta
-- Date: 2025-11-27
-- Dependencies: Requires migrations 001-015

-- ============================================================================
-- VOTE BRIGADE DETECTION SYSTEM
-- ============================================================================
-- Detects coordinated voting patterns where multiple accounts vote identically
-- on the same verifications within suspicious time windows.
--
-- Detection Patterns:
-- 1. Identical voting (same users voting same way on same verifications)
-- 2. Time correlation (votes within 1 minute window)
-- 3. High frequency (> 5 verifications with identical votes)
-- 4. Confidence scoring (0.0 - 1.0 based on pattern strength)
-- ============================================================================

-- ============================================================================
-- TABLE: vote_brigade_patterns
-- ============================================================================
-- Stores detected vote brigade patterns for admin review
-- ============================================================================

CREATE TABLE IF NOT EXISTS vote_brigade_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Involved parties
    user_ids UUID[] NOT NULL,
    verification_ids UUID[] NOT NULL,

    -- Pattern metadata
    detection_timestamp TIMESTAMPTZ DEFAULT NOW(),
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    pattern_type TEXT NOT NULL CHECK (pattern_type IN (
        'identical_voting',
        'time_correlation',
        'coordinated_activity',
        'suspicious_velocity'
    )),

    -- Pattern details (JSONB for flexibility)
    pattern_details JSONB DEFAULT '{}'::jsonb,

    -- Status tracking
    flagged BOOLEAN DEFAULT TRUE,
    reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    resolution TEXT CHECK (resolution IN ('confirmed', 'false_positive', 'pending')),
    admin_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE vote_brigade_patterns IS 'Detected vote brigade patterns for coordinated voting detection';
COMMENT ON COLUMN vote_brigade_patterns.user_ids IS 'Array of user IDs involved in the brigade';
COMMENT ON COLUMN vote_brigade_patterns.verification_ids IS 'Array of verification IDs targeted by the brigade';
COMMENT ON COLUMN vote_brigade_patterns.confidence_score IS 'Confidence score 0.0-1.0 indicating pattern strength';
COMMENT ON COLUMN vote_brigade_patterns.pattern_type IS 'Type of brigade pattern detected';
COMMENT ON COLUMN vote_brigade_patterns.pattern_details IS 'JSONB containing detailed pattern analysis';

-- ============================================================================
-- TABLE: vote_correlations
-- ============================================================================
-- Tracks individual vote correlations between users for pattern analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS vote_correlations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User pair
    user_id_1 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id_2 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Correlation metrics
    total_same_votes INTEGER DEFAULT 0,
    total_compared_votes INTEGER DEFAULT 0,
    correlation_percentage DECIMAL(5,2) DEFAULT 0.00,

    -- Time window analysis
    avg_vote_time_diff_seconds INTEGER DEFAULT 0,
    votes_within_1min INTEGER DEFAULT 0,
    votes_within_5min INTEGER DEFAULT 0,

    -- Last analysis
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure user_id_1 < user_id_2 to avoid duplicates
    CHECK (user_id_1 < user_id_2),
    UNIQUE(user_id_1, user_id_2)
);

-- Add comments
COMMENT ON TABLE vote_correlations IS 'Tracks voting correlation between user pairs for brigade detection';
COMMENT ON COLUMN vote_correlations.correlation_percentage IS 'Percentage of votes that match between two users';
COMMENT ON COLUMN vote_correlations.avg_vote_time_diff_seconds IS 'Average time difference in seconds between correlated votes';
COMMENT ON COLUMN vote_correlations.votes_within_1min IS 'Count of votes cast within 1 minute of each other';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- vote_brigade_patterns indexes
CREATE INDEX idx_brigade_patterns_flagged
ON vote_brigade_patterns(flagged, detection_timestamp DESC)
WHERE flagged = TRUE;

CREATE INDEX idx_brigade_patterns_confidence
ON vote_brigade_patterns(confidence_score DESC, detection_timestamp DESC);

CREATE INDEX idx_brigade_patterns_reviewed
ON vote_brigade_patterns(reviewed, detection_timestamp DESC);

CREATE INDEX idx_brigade_patterns_pattern_type
ON vote_brigade_patterns(pattern_type, detection_timestamp DESC);

-- GIN index for array searches
CREATE INDEX idx_brigade_patterns_user_ids
ON vote_brigade_patterns USING GIN(user_ids);

CREATE INDEX idx_brigade_patterns_verification_ids
ON vote_brigade_patterns USING GIN(verification_ids);

-- vote_correlations indexes
CREATE INDEX idx_vote_correlations_user1
ON vote_correlations(user_id_1, correlation_percentage DESC);

CREATE INDEX idx_vote_correlations_user2
ON vote_correlations(user_id_2, correlation_percentage DESC);

CREATE INDEX idx_vote_correlations_percentage
ON vote_correlations(correlation_percentage DESC)
WHERE correlation_percentage > 70.0;

CREATE INDEX idx_vote_correlations_time_proximity
ON vote_correlations(votes_within_1min DESC)
WHERE votes_within_1min > 5;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on vote_brigade_patterns
CREATE OR REPLACE FUNCTION update_brigade_pattern_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_brigade_pattern_timestamp
BEFORE UPDATE ON vote_brigade_patterns
FOR EACH ROW
EXECUTE FUNCTION update_brigade_pattern_timestamp();

-- Update updated_at timestamp on vote_correlations
CREATE OR REPLACE FUNCTION update_vote_correlation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vote_correlation_timestamp
BEFORE UPDATE ON vote_correlations
FOR EACH ROW
EXECUTE FUNCTION update_vote_correlation_timestamp();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get users involved in brigades
CREATE OR REPLACE FUNCTION get_brigade_involved_users(p_user_id UUID)
RETURNS TABLE (
    brigade_id UUID,
    user_ids UUID[],
    verification_ids UUID[],
    confidence_score DECIMAL,
    pattern_type TEXT,
    detection_timestamp TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        vbp.id,
        vbp.user_ids,
        vbp.verification_ids,
        vbp.confidence_score,
        vbp.pattern_type,
        vbp.detection_timestamp
    FROM vote_brigade_patterns vbp
    WHERE p_user_id = ANY(vbp.user_ids)
    AND vbp.flagged = TRUE
    ORDER BY vbp.detection_timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_brigade_involved_users IS 'Get all brigade patterns involving a specific user';

-- Function: Get highly correlated user pairs
CREATE OR REPLACE FUNCTION get_suspicious_correlations(p_min_percentage DECIMAL DEFAULT 80.0)
RETURNS TABLE (
    user_id_1 UUID,
    user_id_2 UUID,
    username_1 TEXT,
    username_2 TEXT,
    correlation_percentage DECIMAL,
    total_same_votes INTEGER,
    votes_within_1min INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        vc.user_id_1,
        vc.user_id_2,
        u1.username,
        u2.username,
        vc.correlation_percentage,
        vc.total_same_votes,
        vc.votes_within_1min
    FROM vote_correlations vc
    JOIN users u1 ON vc.user_id_1 = u1.id
    JOIN users u2 ON vc.user_id_2 = u2.id
    WHERE vc.correlation_percentage >= p_min_percentage
    AND vc.total_compared_votes >= 5
    ORDER BY vc.correlation_percentage DESC, vc.votes_within_1min DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_suspicious_correlations IS 'Get user pairs with suspiciously high voting correlation';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Admins have full access to brigade data
GRANT ALL ON vote_brigade_patterns TO authenticated;
GRANT ALL ON vote_correlations TO authenticated;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vote_brigade_patterns') THEN
        RAISE EXCEPTION 'Table vote_brigade_patterns was not created';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vote_correlations') THEN
        RAISE EXCEPTION 'Table vote_correlations was not created';
    END IF;

    RAISE NOTICE 'Migration 016: Vote Brigade Detection - Schema created successfully';
END $$;
