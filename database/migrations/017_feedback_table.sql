-- Migration: 017_feedback_table.sql
-- Description: Creates feedback table for user feedback submissions
-- Author: Claude Code + Prithvi Putta
-- Date: 2025-11-27

-- ============================================================================
-- FEEDBACK TABLE
-- ============================================================================
-- Stores user feedback submissions from the contact page

CREATE TABLE IF NOT EXISTS feedback (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add constraint for status
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_status_check;
ALTER TABLE feedback ADD CONSTRAINT feedback_status_check
    CHECK (status IN ('pending', 'in_review', 'resolved', 'archived'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_email ON feedback(email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_feedback_updated_at ON feedback;
CREATE TRIGGER trigger_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
    ON feedback FOR SELECT
    USING (is_admin());

-- Admins can update feedback (resolve, add notes)
CREATE POLICY "Admins can update feedback"
    ON feedback FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- Anyone can submit feedback (no authentication required)
CREATE POLICY "Anyone can submit feedback"
    ON feedback FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE feedback IS 'Stores user feedback submissions from contact page';
COMMENT ON COLUMN feedback.id IS 'Unique feedback identifier';
COMMENT ON COLUMN feedback.name IS 'Name of person submitting feedback';
COMMENT ON COLUMN feedback.email IS 'Email address for follow-up';
COMMENT ON COLUMN feedback.subject IS 'Brief subject line';
COMMENT ON COLUMN feedback.message IS 'Detailed feedback message';
COMMENT ON COLUMN feedback.status IS 'Current status: pending, in_review, resolved, archived';
COMMENT ON COLUMN feedback.admin_notes IS 'Internal notes from admin reviewing feedback';
COMMENT ON COLUMN feedback.resolved_by IS 'Admin user who resolved the feedback';
COMMENT ON COLUMN feedback.resolved_at IS 'Timestamp when feedback was resolved';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✓ Created feedback table';
    RAISE NOTICE '✓ Added status constraint (pending, in_review, resolved, archived)';
    RAISE NOTICE '✓ Created indexes on status, created_at, email';
    RAISE NOTICE '✓ Added updated_at trigger';
    RAISE NOTICE '✓ Configured RLS policies';
    RAISE NOTICE '';
    RAISE NOTICE '=== FEEDBACK TABLE READY ===';\
    RAISE NOTICE 'Users can now submit feedback through /contact page';
    RAISE NOTICE 'Admins can view and manage feedback submissions';
    RAISE NOTICE '';
    RAISE NOTICE 'Test with:';
    RAISE NOTICE '  SELECT * FROM feedback ORDER BY created_at DESC LIMIT 10;';
END $$;
