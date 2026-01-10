-- =====================================================
-- SPRINT 6: DISCUSSION THREADS
-- Comments and replies on promises and verifications
-- =====================================================

-- =====================================================
-- COMMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What is being commented on
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('promise', 'verification', 'politician')),
  target_id UUID NOT NULL,

  -- Comment content
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),

  -- Threading support
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  thread_depth INTEGER DEFAULT 0 CHECK (thread_depth <= 5), -- Max 5 levels deep

  -- Author
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Engagement metrics
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,

  -- Moderation
  status VARCHAR(20) DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'flagged', 'removed')),
  flagged_count INTEGER DEFAULT 0,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderated_by UUID REFERENCES users(id),
  moderation_reason TEXT,

  -- Metadata
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status) WHERE status = 'visible';

-- =====================================================
-- COMMENT VOTES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_votes_comment ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user ON comment_votes(user_id);

-- =====================================================
-- COMMENT FLAGS TABLE (for moderation)
-- =====================================================

CREATE TABLE IF NOT EXISTS comment_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'harassment', 'misinformation', 'off_topic', 'other')),
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_flags_comment ON comment_flags(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_flags_status ON comment_flags(status) WHERE status = 'pending';

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_flags ENABLE ROW LEVEL SECURITY;

-- Comments: Public can view visible comments
CREATE POLICY "Public can view visible comments" ON comments
  FOR SELECT USING (status = 'visible');

-- Comments: Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Comments: Users can update their own comments
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Comments: Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE TO authenticated
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Comment Votes: Authenticated can vote
CREATE POLICY "Authenticated can vote on comments" ON comment_votes
  FOR ALL TO authenticated
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Comment Flags: Authenticated can flag
CREATE POLICY "Authenticated can flag comments" ON comment_flags
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Add a comment
CREATE OR REPLACE FUNCTION add_comment(
  p_target_type VARCHAR(50),
  p_target_id UUID,
  p_content TEXT,
  p_parent_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_comment_id UUID;
  v_thread_depth INTEGER := 0;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Calculate thread depth
  IF p_parent_id IS NOT NULL THEN
    SELECT thread_depth + 1 INTO v_thread_depth FROM comments WHERE id = p_parent_id;
    IF v_thread_depth > 5 THEN
      RAISE EXCEPTION 'Maximum thread depth exceeded';
    END IF;
  END IF;

  -- Insert comment
  INSERT INTO comments (target_type, target_id, content, parent_id, thread_depth, user_id)
  VALUES (p_target_type, p_target_id, p_content, p_parent_id, v_thread_depth, v_user_id)
  RETURNING id INTO v_comment_id;

  -- Update parent reply count
  IF p_parent_id IS NOT NULL THEN
    UPDATE comments SET reply_count = reply_count + 1 WHERE id = p_parent_id;
  END IF;

  -- Award citizen score for commenting
  UPDATE users SET citizen_score = citizen_score + 1 WHERE id = v_user_id;

  RETURN v_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vote on a comment
CREATE OR REPLACE FUNCTION vote_on_comment(
  p_comment_id UUID,
  p_vote_type VARCHAR(10)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_existing_vote VARCHAR(10);
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Check existing vote
  SELECT vote_type INTO v_existing_vote
  FROM comment_votes
  WHERE comment_id = p_comment_id AND user_id = v_user_id;

  IF v_existing_vote IS NOT NULL THEN
    IF v_existing_vote = p_vote_type THEN
      -- Remove vote (toggle off)
      DELETE FROM comment_votes WHERE comment_id = p_comment_id AND user_id = v_user_id;

      IF p_vote_type = 'up' THEN
        UPDATE comments SET upvotes = upvotes - 1 WHERE id = p_comment_id;
      ELSE
        UPDATE comments SET downvotes = downvotes - 1 WHERE id = p_comment_id;
      END IF;
    ELSE
      -- Change vote
      UPDATE comment_votes SET vote_type = p_vote_type WHERE comment_id = p_comment_id AND user_id = v_user_id;

      IF p_vote_type = 'up' THEN
        UPDATE comments SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = p_comment_id;
      ELSE
        UPDATE comments SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = p_comment_id;
      END IF;
    END IF;
  ELSE
    -- New vote
    INSERT INTO comment_votes (comment_id, user_id, vote_type) VALUES (p_comment_id, v_user_id, p_vote_type);

    IF p_vote_type = 'up' THEN
      UPDATE comments SET upvotes = upvotes + 1 WHERE id = p_comment_id;
    ELSE
      UPDATE comments SET downvotes = downvotes + 1 WHERE id = p_comment_id;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get comments for a target
CREATE OR REPLACE FUNCTION get_comments(
  p_target_type VARCHAR(50),
  p_target_id UUID,
  p_parent_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  parent_id UUID,
  thread_depth INTEGER,
  user_id UUID,
  username TEXT,
  user_avatar TEXT,
  upvotes INTEGER,
  downvotes INTEGER,
  reply_count INTEGER,
  is_edited BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  user_vote TEXT
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user ID (may be null for anon)
  SELECT users.id INTO v_user_id FROM users WHERE auth_id = auth.uid();

  RETURN QUERY
  SELECT
    c.id,
    c.content,
    c.parent_id,
    c.thread_depth,
    c.user_id,
    u.username::TEXT,
    u.avatar_url::TEXT as user_avatar,
    c.upvotes,
    c.downvotes,
    c.reply_count,
    c.is_edited,
    c.created_at,
    cv.vote_type::TEXT as user_vote
  FROM comments c
  JOIN users u ON c.user_id = u.id
  LEFT JOIN comment_votes cv ON c.id = cv.comment_id AND cv.user_id = v_user_id
  WHERE c.target_type = p_target_type
    AND c.target_id = p_target_id
    AND c.status = 'visible'
    AND (p_parent_id IS NULL AND c.parent_id IS NULL OR c.parent_id = p_parent_id)
  ORDER BY c.upvotes - c.downvotes DESC, c.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Flag a comment
CREATE OR REPLACE FUNCTION flag_comment(
  p_comment_id UUID,
  p_reason VARCHAR(50),
  p_details TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  INSERT INTO comment_flags (comment_id, user_id, reason, details)
  VALUES (p_comment_id, v_user_id, p_reason, p_details)
  ON CONFLICT (comment_id, user_id) DO NOTHING;

  -- Update flag count on comment
  UPDATE comments SET flagged_count = flagged_count + 1 WHERE id = p_comment_id;

  -- Auto-hide if flagged too many times
  UPDATE comments SET status = 'flagged' WHERE id = p_comment_id AND flagged_count >= 5;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Edit a comment
CREATE OR REPLACE FUNCTION edit_comment(
  p_comment_id UUID,
  p_content TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  UPDATE comments
  SET content = p_content, is_edited = true, edited_at = NOW(), updated_at = NOW()
  WHERE id = p_comment_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment not found or not authorized';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete a comment (soft delete)
CREATE OR REPLACE FUNCTION delete_comment(p_comment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  UPDATE comments
  SET status = 'removed', content = '[Comment deleted]', updated_at = NOW()
  WHERE id = p_comment_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment not found or not authorized';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DISCUSSION STATS VIEW
-- =====================================================

CREATE OR REPLACE VIEW discussion_stats AS
SELECT
  target_type,
  target_id,
  COUNT(*) as total_comments,
  COUNT(*) FILTER (WHERE parent_id IS NULL) as top_level_comments,
  COUNT(DISTINCT user_id) as unique_participants,
  MAX(created_at) as last_comment_at
FROM comments
WHERE status = 'visible'
GROUP BY target_type, target_id;

-- Grant permissions
GRANT SELECT ON discussion_stats TO authenticated;
GRANT SELECT ON discussion_stats TO anon;
GRANT EXECUTE ON FUNCTION add_comment(VARCHAR, UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION vote_on_comment(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_comments(VARCHAR, UUID, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_comments(VARCHAR, UUID, UUID, INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION flag_comment(UUID, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION edit_comment(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_comment(UUID) TO authenticated;
