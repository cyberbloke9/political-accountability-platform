-- Migration 025: Search Enhancement
-- Full-text search, autocomplete, search analytics

-- =====================================================
-- 1. ADD FULL-TEXT SEARCH VECTORS TO PROMISES
-- =====================================================

-- Add tsvector column for full-text search
ALTER TABLE promises
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to generate search vector
CREATE OR REPLACE FUNCTION promises_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.politician_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.promise_text, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.party, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.state, '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.constituency, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS promises_search_vector_trigger ON promises;
CREATE TRIGGER promises_search_vector_trigger
  BEFORE INSERT OR UPDATE OF politician_name, promise_text, party, category, state, constituency
  ON promises
  FOR EACH ROW
  EXECUTE FUNCTION promises_search_vector_update();

-- Update existing rows
UPDATE promises SET search_vector =
  setweight(to_tsvector('english', COALESCE(politician_name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(promise_text, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(party, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(category, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(state, '')), 'D') ||
  setweight(to_tsvector('english', COALESCE(constituency, '')), 'D');

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_promises_search_vector ON promises USING GIN(search_vector);

-- =====================================================
-- 2. ADD FULL-TEXT SEARCH TO POLITICIANS
-- =====================================================

ALTER TABLE politicians
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION politicians_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.party, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.position, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.state, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.constituency, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS politicians_search_vector_trigger ON politicians;
CREATE TRIGGER politicians_search_vector_trigger
  BEFORE INSERT OR UPDATE OF name, party, position, state, constituency, bio
  ON politicians
  FOR EACH ROW
  EXECUTE FUNCTION politicians_search_vector_update();

-- Update existing politicians
UPDATE politicians SET search_vector =
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(party, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(position, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(state, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(constituency, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(bio, '')), 'D');

CREATE INDEX IF NOT EXISTS idx_politicians_search_vector ON politicians USING GIN(search_vector);

-- =====================================================
-- 3. SEARCH ANALYTICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  result_count INTEGER DEFAULT 0,
  filters JSONB DEFAULT '{}',
  searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_queries_normalized ON search_queries(normalized_query);
CREATE INDEX IF NOT EXISTS idx_search_queries_searched_at ON search_queries(searched_at);
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON search_queries(user_id);

-- =====================================================
-- 4. POPULAR SEARCHES VIEW
-- =====================================================

CREATE OR REPLACE VIEW popular_searches AS
SELECT
  normalized_query,
  COUNT(*) as search_count,
  MAX(searched_at) as last_searched
FROM search_queries
WHERE searched_at > NOW() - INTERVAL '7 days'
  AND result_count > 0
  AND LENGTH(normalized_query) >= 3
GROUP BY normalized_query
ORDER BY search_count DESC
LIMIT 20;

-- =====================================================
-- 5. UNIFIED SEARCH FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION search_all(
  search_query TEXT,
  search_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  subtitle TEXT,
  url TEXT,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tsquery_text tsquery;
BEGIN
  -- Convert search query to tsquery with prefix matching
  tsquery_text := plainto_tsquery('english', search_query);

  -- If empty query, use prefix search
  IF tsquery_text::text = '' THEN
    tsquery_text := to_tsquery('english', search_query || ':*');
  END IF;

  RETURN QUERY
  -- Search promises
  SELECT
    p.id,
    'promise'::TEXT as type,
    p.politician_name || ': ' || LEFT(p.promise_text, 80) as title,
    COALESCE(p.party, '') || ' | ' || p.status as subtitle,
    '/promises/' || p.id::TEXT as url,
    ts_rank(p.search_vector, tsquery_text) as rank
  FROM promises p
  WHERE p.search_vector @@ tsquery_text

  UNION ALL

  -- Search politicians
  SELECT
    pol.id,
    'politician'::TEXT as type,
    pol.name as title,
    COALESCE(pol.party, '') || COALESCE(' | ' || pol.position, '') as subtitle,
    '/politicians/' || pol.slug as url,
    ts_rank(pol.search_vector, tsquery_text) * 1.2 as rank -- Boost politicians
  FROM politicians pol
  WHERE pol.search_vector @@ tsquery_text

  ORDER BY rank DESC
  LIMIT search_limit;
END;
$$;

-- =====================================================
-- 6. AUTOCOMPLETE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION search_autocomplete(
  search_prefix TEXT,
  max_results INTEGER DEFAULT 8
)
RETURNS TABLE (
  suggestion TEXT,
  type TEXT,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY

  -- Politician names
  SELECT DISTINCT
    p.name as suggestion,
    'politician'::TEXT as type,
    COUNT(*) OVER (PARTITION BY p.name) as count
  FROM politicians p
  WHERE p.name ILIKE search_prefix || '%'

  UNION

  -- Party names
  SELECT DISTINCT
    pr.party as suggestion,
    'party'::TEXT as type,
    COUNT(*) as count
  FROM promises pr
  WHERE pr.party ILIKE search_prefix || '%'
    AND pr.party IS NOT NULL
  GROUP BY pr.party

  UNION

  -- Categories
  SELECT DISTINCT
    pr.category as suggestion,
    'category'::TEXT as type,
    COUNT(*) as count
  FROM promises pr
  WHERE pr.category ILIKE search_prefix || '%'
    AND pr.category IS NOT NULL
  GROUP BY pr.category

  UNION

  -- States
  SELECT DISTINCT
    pr.state as suggestion,
    'state'::TEXT as type,
    COUNT(*) as count
  FROM promises pr
  WHERE pr.state ILIKE search_prefix || '%'
    AND pr.state IS NOT NULL
  GROUP BY pr.state

  UNION

  -- Popular recent searches
  SELECT
    sq.normalized_query as suggestion,
    'recent'::TEXT as type,
    COUNT(*) as count
  FROM search_queries sq
  WHERE sq.normalized_query ILIKE search_prefix || '%'
    AND sq.searched_at > NOW() - INTERVAL '30 days'
    AND sq.result_count > 0
  GROUP BY sq.normalized_query
  HAVING COUNT(*) >= 2

  ORDER BY count DESC
  LIMIT max_results;
END;
$$;

-- =====================================================
-- 7. LOG SEARCH FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION log_search(
  p_query TEXT,
  p_result_count INTEGER DEFAULT 0,
  p_filters JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_normalized TEXT;
BEGIN
  -- Get current user
  SELECT u.id INTO v_user_id
  FROM users u
  WHERE u.auth_id = auth.uid();

  -- Normalize query (lowercase, trim, remove extra spaces)
  v_normalized := LOWER(TRIM(regexp_replace(p_query, '\s+', ' ', 'g')));

  -- Only log meaningful queries
  IF LENGTH(v_normalized) >= 2 THEN
    INSERT INTO search_queries (query, normalized_query, user_id, result_count, filters)
    VALUES (p_query, v_normalized, v_user_id, p_result_count, p_filters);
  END IF;
END;
$$;

-- =====================================================
-- 8. RLS POLICIES
-- =====================================================

ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- Users can see their own search history
CREATE POLICY "Users can view own search history"
  ON search_queries FOR SELECT
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Search queries are created via function
CREATE POLICY "Search queries created via function"
  ON search_queries FOR INSERT
  WITH CHECK (false);

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION search_all TO authenticated;
GRANT EXECUTE ON FUNCTION search_all TO anon;
GRANT EXECUTE ON FUNCTION search_autocomplete TO authenticated;
GRANT EXECUTE ON FUNCTION search_autocomplete TO anon;
GRANT EXECUTE ON FUNCTION log_search TO authenticated;
GRANT EXECUTE ON FUNCTION log_search TO anon;
GRANT SELECT ON popular_searches TO authenticated;
GRANT SELECT ON popular_searches TO anon;
