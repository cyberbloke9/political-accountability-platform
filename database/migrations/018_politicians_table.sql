-- Migration: Politicians Table and Profile System
-- Description: Create dedicated politicians table for profile pages
-- Date: 2024-12-23

-- =====================================================
-- PART 1: Create Politicians Table
-- =====================================================

CREATE TABLE IF NOT EXISTS politicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  party VARCHAR(100),
  position VARCHAR(200),
  state VARCHAR(100),
  constituency VARCHAR(200),
  bio TEXT,
  image_url TEXT,
  twitter_handle VARCHAR(100),
  wikipedia_url TEXT,
  official_website TEXT,
  date_of_birth DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_politicians_name ON politicians(name);
CREATE INDEX IF NOT EXISTS idx_politicians_slug ON politicians(slug);
CREATE INDEX IF NOT EXISTS idx_politicians_party ON politicians(party);
CREATE INDEX IF NOT EXISTS idx_politicians_state ON politicians(state);
CREATE INDEX IF NOT EXISTS idx_politicians_position ON politicians(position);
CREATE INDEX IF NOT EXISTS idx_politicians_active ON politicians(is_active) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE politicians ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Politicians are viewable by everyone
DROP POLICY IF EXISTS "Politicians are viewable by everyone" ON politicians;
CREATE POLICY "Politicians are viewable by everyone" ON politicians
  FOR SELECT USING (true);

-- Only admins can insert/update politicians
DROP POLICY IF EXISTS "Admins can manage politicians" ON politicians;
CREATE POLICY "Admins can manage politicians" ON politicians
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- =====================================================
-- PART 2: Add politician_id to promises (optional FK)
-- =====================================================

ALTER TABLE promises ADD COLUMN IF NOT EXISTS politician_id UUID REFERENCES politicians(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_promises_politician_id ON promises(politician_id);

-- =====================================================
-- PART 3: Create View for Politician Stats
-- =====================================================

CREATE OR REPLACE VIEW politician_stats AS
SELECT
  p.politician_name,
  COUNT(p.id) as total_promises,
  COUNT(p.id) FILTER (WHERE p.status = 'fulfilled') as fulfilled_count,
  COUNT(p.id) FILTER (WHERE p.status = 'broken') as broken_count,
  COUNT(p.id) FILTER (WHERE p.status = 'in_progress') as in_progress_count,
  COUNT(p.id) FILTER (WHERE p.status = 'pending') as pending_count,
  COUNT(p.id) FILTER (WHERE p.status = 'stalled') as stalled_count,
  CASE
    WHEN COUNT(p.id) FILTER (WHERE p.status IN ('fulfilled', 'broken')) > 0
    THEN ROUND(
      (COUNT(p.id) FILTER (WHERE p.status = 'fulfilled')::DECIMAL /
       COUNT(p.id) FILTER (WHERE p.status IN ('fulfilled', 'broken'))) * 100,
      1
    )
    ELSE NULL
  END as fulfillment_rate,
  MAX(p.created_at) as latest_promise_date,
  COALESCE(pol.id, NULL) as politician_id,
  COALESCE(pol.slug, NULL) as slug,
  COALESCE(pol.party, p.politician_party) as party,
  COALESCE(pol.position, NULL) as position,
  COALESCE(pol.state, NULL) as state,
  COALESCE(pol.image_url, NULL) as image_url
FROM promises p
LEFT JOIN politicians pol ON p.politician_id = pol.id OR LOWER(p.politician_name) = LOWER(pol.name)
GROUP BY p.politician_name, pol.id, pol.slug, pol.party, pol.position, pol.state, pol.image_url, p.politician_party;

-- Grant access to view
GRANT SELECT ON politician_stats TO authenticated;
GRANT SELECT ON politician_stats TO anon;

-- =====================================================
-- PART 4: Function to generate slug from name
-- =====================================================

CREATE OR REPLACE FUNCTION generate_politician_slug(politician_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRIM(politician_name),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 5: Auto-populate politicians from existing promises
-- =====================================================

-- Insert unique politicians from promises
INSERT INTO politicians (name, slug, party)
SELECT DISTINCT
  politician_name,
  generate_politician_slug(politician_name),
  politician_party
FROM promises
WHERE politician_name IS NOT NULL
  AND politician_name != ''
  AND politician_name != 'Unknown'
ON CONFLICT (slug) DO UPDATE SET
  party = COALESCE(EXCLUDED.party, politicians.party),
  updated_at = NOW();

-- Update promises with politician_id
UPDATE promises p
SET politician_id = pol.id
FROM politicians pol
WHERE LOWER(p.politician_name) = LOWER(pol.name)
  AND p.politician_id IS NULL;

-- =====================================================
-- PART 6: Trigger to auto-create politician on promise insert
-- =====================================================

CREATE OR REPLACE FUNCTION auto_create_politician()
RETURNS TRIGGER AS $$
DECLARE
  existing_politician_id UUID;
  new_slug TEXT;
BEGIN
  -- Check if politician already exists
  SELECT id INTO existing_politician_id
  FROM politicians
  WHERE LOWER(name) = LOWER(NEW.politician_name);

  IF existing_politician_id IS NOT NULL THEN
    -- Link to existing politician
    NEW.politician_id := existing_politician_id;
  ELSE
    -- Create new politician
    new_slug := generate_politician_slug(NEW.politician_name);

    INSERT INTO politicians (name, slug, party)
    VALUES (NEW.politician_name, new_slug, NEW.politician_party)
    ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO existing_politician_id;

    NEW.politician_id := existing_politician_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_politician ON promises;
CREATE TRIGGER trigger_auto_create_politician
  BEFORE INSERT ON promises
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_politician();

-- =====================================================
-- PART 7: Comments
-- =====================================================

COMMENT ON TABLE politicians IS 'Political figures with profile information';
COMMENT ON COLUMN politicians.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN politicians.position IS 'Current or most recent position (PM, CM, MP, etc.)';
COMMENT ON COLUMN politicians.is_active IS 'Whether politician is currently active in politics';
COMMENT ON VIEW politician_stats IS 'Aggregated promise statistics per politician';

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT
  'Politicians created' as status,
  COUNT(*) as count
FROM politicians;
