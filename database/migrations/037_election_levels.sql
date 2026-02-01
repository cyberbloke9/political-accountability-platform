-- =====================================================
-- MIGRATION 037: ELECTION LEVELS & TYPES EXPANSION
-- Add election level categorization and expand types
-- =====================================================

-- =====================================================
-- ADD ELECTION LEVEL COLUMN
-- =====================================================

-- Add election_level to categorize elections
ALTER TABLE elections
  ADD COLUMN IF NOT EXISTS election_level VARCHAR(50);

-- Add constraint for valid levels
ALTER TABLE elections
  DROP CONSTRAINT IF EXISTS elections_election_level_check;

ALTER TABLE elections
  ADD CONSTRAINT elections_election_level_check
  CHECK (election_level IN (
    'national',      -- Country-wide elections (President, Parliament, Prime Minister)
    'state',         -- State/Province level (Governor, State Assembly, State Senate)
    'regional',      -- Region/Zone level (Regional councils)
    'district',      -- District level (Zilla Parishad, District Council)
    'municipal',     -- City/Town level (Mayor, Municipal Corporation, City Council)
    'local',         -- Local level (Panchayat, Ward, Village Council)
    'special'        -- By-elections, Referendums, Special elections
  ));

-- Create index on election_level
CREATE INDEX IF NOT EXISTS idx_elections_level ON elections(election_level);

-- =====================================================
-- EXPAND ELECTION TYPES
-- =====================================================

-- Drop old constraint
ALTER TABLE elections
  DROP CONSTRAINT IF EXISTS elections_election_type_check;

-- Add new expanded constraint
ALTER TABLE elections
  ADD CONSTRAINT elections_election_type_check
  CHECK (election_type IN (
    -- National level
    'presidential',
    'parliamentary',         -- General elections for parliament/congress
    'lok_sabha',             -- India: Lower house
    'rajya_sabha',           -- India: Upper house
    'senate',                -- Upper house elections
    'house_of_representatives',

    -- State level
    'gubernatorial',         -- Governor elections
    'state_assembly',        -- State legislature lower house
    'state_senate',          -- State legislature upper house
    'state_legislative',     -- Generic state legislature

    -- Regional/District level
    'regional_council',
    'district_council',
    'zilla_parishad',        -- India: District council

    -- Municipal level
    'mayoral',               -- Mayor elections
    'municipal_corporation', -- Large city corporation
    'municipal_council',     -- Medium city council
    'town_council',          -- Small town council
    'municipal',             -- Generic municipal

    -- Local level
    'panchayat',             -- India: Village council
    'gram_sabha',            -- India: Village assembly
    'ward_council',          -- Ward-level council
    'block_council',         -- Block-level council

    -- Special
    'by_election',           -- Mid-term election for vacant seat
    'referendum',            -- Public vote on specific issue
    'recall',                -- Election to remove elected official
    'primary',               -- Party primary election
    'runoff'                 -- Second round election
  ));

-- =====================================================
-- BACKFILL ELECTION LEVELS
-- =====================================================

-- Backfill election_level based on election_type
UPDATE elections
SET election_level = CASE
  -- National level
  WHEN election_type IN ('lok_sabha', 'rajya_sabha', 'presidential', 'parliamentary', 'senate', 'house_of_representatives') THEN 'national'

  -- State level
  WHEN election_type IN ('state_assembly', 'gubernatorial', 'state_senate', 'state_legislative') THEN 'state'

  -- District level
  WHEN election_type IN ('district_council', 'zilla_parishad', 'regional_council') THEN 'district'

  -- Municipal level
  WHEN election_type IN ('municipal', 'municipal_corporation', 'municipal_council', 'town_council', 'mayoral') THEN 'municipal'

  -- Local level
  WHEN election_type IN ('panchayat', 'gram_sabha', 'ward_council', 'block_council') THEN 'local'

  -- Special
  WHEN election_type IN ('by_election', 'referendum', 'recall', 'primary', 'runoff') THEN 'special'

  -- Default
  ELSE 'national'
END
WHERE election_level IS NULL;

-- =====================================================
-- ELECTION LEVEL DESCRIPTIONS VIEW
-- =====================================================

CREATE OR REPLACE VIEW election_level_info AS
SELECT
  level,
  description,
  example_types
FROM (VALUES
  ('national', 'Country-wide elections for national government', ARRAY['presidential', 'parliamentary', 'lok_sabha', 'senate']),
  ('state', 'State or province level elections', ARRAY['gubernatorial', 'state_assembly', 'state_senate']),
  ('regional', 'Regional or zone level elections', ARRAY['regional_council']),
  ('district', 'District level elections', ARRAY['district_council', 'zilla_parishad']),
  ('municipal', 'City and town level elections', ARRAY['mayoral', 'municipal_corporation', 'town_council']),
  ('local', 'Village and ward level elections', ARRAY['panchayat', 'gram_sabha', 'ward_council']),
  ('special', 'By-elections, referendums, and special elections', ARRAY['by_election', 'referendum', 'recall'])
) AS t(level, description, example_types);

-- =====================================================
-- UPDATED HELPER FUNCTIONS
-- =====================================================

-- Get elections by level
CREATE OR REPLACE FUNCTION get_elections_by_level(
  p_level VARCHAR(50),
  p_country_code VARCHAR(3) DEFAULT NULL,
  p_state_code VARCHAR(10) DEFAULT NULL,
  p_status VARCHAR(30) DEFAULT NULL,
  p_year INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  election_type TEXT,
  election_level TEXT,
  country TEXT,
  state TEXT,
  polling_start DATE,
  polling_end DATE,
  status TEXT,
  total_constituencies INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name::TEXT,
    e.election_type::TEXT,
    e.election_level::TEXT,
    COALESCE(c.name, e.country)::TEXT as country,
    COALESCE(sp.name, e.state)::TEXT as state,
    e.polling_start,
    e.polling_end,
    e.status::TEXT,
    e.total_constituencies
  FROM elections e
  LEFT JOIN countries c ON e.country_id = c.id
  LEFT JOIN states_provinces sp ON e.state_id = sp.id
  WHERE e.election_level = p_level
    AND (p_country_code IS NULL OR c.code = UPPER(p_country_code) OR c.code_2 = UPPER(p_country_code) OR e.country ILIKE '%' || p_country_code || '%')
    AND (p_state_code IS NULL OR sp.code = UPPER(p_state_code) OR e.state ILIKE '%' || p_state_code || '%')
    AND (p_status IS NULL OR e.status = p_status)
    AND (p_year IS NULL OR EXTRACT(YEAR FROM e.polling_start) = p_year)
  ORDER BY e.polling_start DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get elections by country with level filter
CREATE OR REPLACE FUNCTION get_elections_by_country(
  p_country_code VARCHAR(3),
  p_level VARCHAR(50) DEFAULT NULL,
  p_status VARCHAR(30) DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  election_type TEXT,
  election_level TEXT,
  state TEXT,
  polling_start DATE,
  polling_end DATE,
  status TEXT,
  total_constituencies INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name::TEXT,
    e.election_type::TEXT,
    e.election_level::TEXT,
    COALESCE(sp.name, e.state)::TEXT as state,
    e.polling_start,
    e.polling_end,
    e.status::TEXT,
    e.total_constituencies
  FROM elections e
  LEFT JOIN countries c ON e.country_id = c.id
  LEFT JOIN states_provinces sp ON e.state_id = sp.id
  WHERE (c.code = UPPER(p_country_code) OR c.code_2 = UPPER(p_country_code) OR e.country ILIKE '%' || p_country_code || '%')
    AND (p_level IS NULL OR e.election_level = p_level)
    AND (p_status IS NULL OR e.status = p_status)
  ORDER BY e.polling_start DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get municipal elections by state
CREATE OR REPLACE FUNCTION get_municipal_elections_by_state(
  p_state_code VARCHAR(10),
  p_country_code VARCHAR(3) DEFAULT 'IND',
  p_status VARCHAR(30) DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  election_type TEXT,
  city TEXT,
  polling_start DATE,
  polling_end DATE,
  status TEXT,
  total_constituencies INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name::TEXT,
    e.election_type::TEXT,
    e.state::TEXT as city,  -- Often contains city name for municipal
    e.polling_start,
    e.polling_end,
    e.status::TEXT,
    e.total_constituencies
  FROM elections e
  LEFT JOIN countries c ON e.country_id = c.id
  LEFT JOIN states_provinces sp ON e.state_id = sp.id
  WHERE e.election_level = 'municipal'
    AND (sp.code = UPPER(p_state_code) OR e.state ILIKE '%' || p_state_code || '%')
    AND (c.code = UPPER(p_country_code) OR c.code_2 = UPPER(p_country_code) OR p_country_code IS NULL)
    AND (p_status IS NULL OR e.status = p_status)
  ORDER BY e.polling_start DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get local elections by state (panchayat, block, ward)
CREATE OR REPLACE FUNCTION get_local_elections_by_state(
  p_state_code VARCHAR(10),
  p_country_code VARCHAR(3) DEFAULT 'IND',
  p_election_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  election_type TEXT,
  district TEXT,
  polling_start DATE,
  polling_end DATE,
  status TEXT,
  total_constituencies INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name::TEXT,
    e.election_type::TEXT,
    e.state::TEXT as district,
    e.polling_start,
    e.polling_end,
    e.status::TEXT,
    e.total_constituencies
  FROM elections e
  LEFT JOIN countries c ON e.country_id = c.id
  LEFT JOIN states_provinces sp ON e.state_id = sp.id
  WHERE e.election_level IN ('local', 'district')
    AND (sp.code = UPPER(p_state_code) OR e.state ILIKE '%' || p_state_code || '%')
    AND (c.code = UPPER(p_country_code) OR c.code_2 = UPPER(p_country_code) OR p_country_code IS NULL)
    AND (p_election_types IS NULL OR e.election_type = ANY(p_election_types))
  ORDER BY e.polling_start DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get upcoming elections with levels
CREATE OR REPLACE FUNCTION get_upcoming_elections_by_level(
  p_level VARCHAR(50) DEFAULT NULL,
  p_country_code VARCHAR(3) DEFAULT NULL,
  p_state_code VARCHAR(10) DEFAULT NULL,
  p_months_ahead INTEGER DEFAULT 12,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  election_type TEXT,
  election_level TEXT,
  country TEXT,
  state TEXT,
  polling_start DATE,
  polling_end DATE,
  status TEXT,
  days_until INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name::TEXT,
    e.election_type::TEXT,
    e.election_level::TEXT,
    COALESCE(c.name, e.country)::TEXT as country,
    COALESCE(sp.name, e.state)::TEXT as state,
    e.polling_start,
    e.polling_end,
    e.status::TEXT,
    (e.polling_start - CURRENT_DATE)::INTEGER as days_until
  FROM elections e
  LEFT JOIN countries c ON e.country_id = c.id
  LEFT JOIN states_provinces sp ON e.state_id = sp.id
  WHERE e.polling_start >= CURRENT_DATE
    AND e.polling_start <= CURRENT_DATE + (p_months_ahead || ' months')::INTERVAL
    AND e.status NOT IN ('completed', 'cancelled')
    AND (p_level IS NULL OR e.election_level = p_level)
    AND (p_country_code IS NULL OR c.code = UPPER(p_country_code) OR c.code_2 = UPPER(p_country_code))
    AND (p_state_code IS NULL OR sp.code = UPPER(p_state_code) OR e.state ILIKE '%' || p_state_code || '%')
  ORDER BY e.polling_start ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON election_level_info TO authenticated;
GRANT SELECT ON election_level_info TO anon;

GRANT EXECUTE ON FUNCTION get_elections_by_level(VARCHAR, VARCHAR, VARCHAR, VARCHAR, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_elections_by_level(VARCHAR, VARCHAR, VARCHAR, VARCHAR, INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_elections_by_country(VARCHAR, VARCHAR, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_elections_by_country(VARCHAR, VARCHAR, VARCHAR, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_municipal_elections_by_state(VARCHAR, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_municipal_elections_by_state(VARCHAR, VARCHAR, VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION get_local_elections_by_state(VARCHAR, VARCHAR, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_local_elections_by_state(VARCHAR, VARCHAR, TEXT[]) TO anon;
GRANT EXECUTE ON FUNCTION get_upcoming_elections_by_level(VARCHAR, VARCHAR, VARCHAR, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_elections_by_level(VARCHAR, VARCHAR, VARCHAR, INTEGER, INTEGER) TO anon;
