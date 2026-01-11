-- Migration 024: View Tracking System
-- Tracks unique views on promises to prevent gaming

-- =====================================================
-- 1. CREATE PROMISE VIEWS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS promise_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promise_id UUID NOT NULL REFERENCES promises(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT, -- For anonymous users, track by session
  ip_hash TEXT, -- Hashed IP for additional deduplication
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  view_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Partial unique indexes for deduplication (works with PostgreSQL < 15)
-- For authenticated users: one view per user per promise per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_view_per_day
  ON promise_views(promise_id, viewer_id, view_date)
  WHERE viewer_id IS NOT NULL;

-- For anonymous users: one view per session per promise
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_session_view
  ON promise_views(promise_id, session_id)
  WHERE session_id IS NOT NULL AND viewer_id IS NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_promise_views_promise_id ON promise_views(promise_id);
CREATE INDEX IF NOT EXISTS idx_promise_views_viewer_id ON promise_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_promise_views_viewed_at ON promise_views(viewed_at);

-- =====================================================
-- 2. CREATE VIEW TRACKING FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION record_promise_view(
  p_promise_id UUID,
  p_session_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_view_recorded BOOLEAN := FALSE;
BEGIN
  -- Get current user's database ID (if authenticated)
  SELECT u.id INTO v_user_id
  FROM users u
  WHERE u.auth_id = auth.uid();

  -- Try to insert a new view record
  BEGIN
    INSERT INTO promise_views (promise_id, viewer_id, session_id)
    VALUES (p_promise_id, v_user_id, p_session_id);

    -- If insert succeeded, increment view count
    UPDATE promises
    SET view_count = view_count + 1
    WHERE id = p_promise_id;

    v_view_recorded := TRUE;
  EXCEPTION
    WHEN unique_violation THEN
      -- View already recorded for this user/session today
      v_view_recorded := FALSE;
  END;

  RETURN v_view_recorded;
END;
$$;

-- =====================================================
-- 3. RECALCULATE VIEW COUNTS (one-time sync)
-- =====================================================

-- Function to sync view counts from promise_views table
CREATE OR REPLACE FUNCTION sync_promise_view_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE promises p
  SET view_count = COALESCE(
    (SELECT COUNT(*) FROM promise_views pv WHERE pv.promise_id = p.id),
    0
  );
END;
$$;

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

ALTER TABLE promise_views ENABLE ROW LEVEL SECURITY;

-- Anyone can view statistics (aggregated)
CREATE POLICY "Promise views are readable by all"
  ON promise_views FOR SELECT
  USING (true);

-- Views are recorded via the function (SECURITY DEFINER)
-- Direct inserts are blocked
CREATE POLICY "Views are created via function only"
  ON promise_views FOR INSERT
  WITH CHECK (false);

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION record_promise_view TO authenticated;
GRANT EXECUTE ON FUNCTION record_promise_view TO anon;
