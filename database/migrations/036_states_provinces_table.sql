-- =====================================================
-- MIGRATION 036: STATES/PROVINCES TABLE
-- Generic states/provinces linked to countries
-- =====================================================

-- =====================================================
-- STATES/PROVINCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS states_provinces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Country reference
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,

  -- Identification
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10),                           -- State code (e.g., CA, TX, MH, KA)
  local_name VARCHAR(255),                    -- Name in local language

  -- Classification
  state_type VARCHAR(50) CHECK (state_type IN (
    'state', 'province', 'territory', 'union_territory',
    'federal_district', 'autonomous_region', 'prefecture',
    'canton', 'emirate', 'county', 'region'
  )),

  -- Geography
  capital VARCHAR(255),
  largest_city VARCHAR(255),
  area_sq_km DECIMAL(12,2),

  -- Demographics
  population BIGINT,
  population_year INTEGER,                    -- Year of population data

  -- Political info
  official_languages TEXT[],
  time_zone VARCHAR(50),

  -- Election info
  total_constituencies INTEGER DEFAULT 0,     -- Number of electoral constituencies
  assembly_seats INTEGER DEFAULT 0,           -- State assembly seats

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(country_id, code),
  UNIQUE(country_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_states_provinces_country ON states_provinces(country_id);
CREATE INDEX IF NOT EXISTS idx_states_provinces_code ON states_provinces(code);
CREATE INDEX IF NOT EXISTS idx_states_provinces_type ON states_provinces(state_type);
CREATE INDEX IF NOT EXISTS idx_states_provinces_active ON states_provinces(is_active) WHERE is_active = true;

-- Full-text search on name
CREATE INDEX IF NOT EXISTS idx_states_provinces_name_search ON states_provinces USING gin(to_tsvector('english', name));

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE states_provinces ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view states/provinces" ON states_provinces
  FOR SELECT USING (true);

-- =====================================================
-- UPDATE TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_states_provinces_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_states_provinces_updated_at
  BEFORE UPDATE ON states_provinces
  FOR EACH ROW
  EXECUTE FUNCTION update_states_provinces_updated_at();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get states/provinces by country
CREATE OR REPLACE FUNCTION get_states_by_country(
  p_country_code VARCHAR(3),
  p_state_type VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  code TEXT,
  state_type TEXT,
  capital TEXT,
  population BIGINT,
  total_constituencies INTEGER,
  assembly_seats INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.name::TEXT,
    sp.code::TEXT,
    sp.state_type::TEXT,
    sp.capital::TEXT,
    sp.population,
    sp.total_constituencies,
    sp.assembly_seats
  FROM states_provinces sp
  JOIN countries c ON sp.country_id = c.id
  WHERE (c.code = UPPER(p_country_code) OR c.code_2 = UPPER(p_country_code))
    AND sp.is_active = true
    AND (p_state_type IS NULL OR sp.state_type = p_state_type)
  ORDER BY sp.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get state by code within country
CREATE OR REPLACE FUNCTION get_state_by_code(
  p_country_code VARCHAR(3),
  p_state_code VARCHAR(10)
)
RETURNS TABLE (
  id UUID,
  country_id UUID,
  country_name TEXT,
  name TEXT,
  code TEXT,
  local_name TEXT,
  state_type TEXT,
  capital TEXT,
  largest_city TEXT,
  population BIGINT,
  total_constituencies INTEGER,
  assembly_seats INTEGER,
  official_languages TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.country_id,
    c.name::TEXT as country_name,
    sp.name::TEXT,
    sp.code::TEXT,
    sp.local_name::TEXT,
    sp.state_type::TEXT,
    sp.capital::TEXT,
    sp.largest_city::TEXT,
    sp.population,
    sp.total_constituencies,
    sp.assembly_seats,
    sp.official_languages
  FROM states_provinces sp
  JOIN countries c ON sp.country_id = c.id
  WHERE (c.code = UPPER(p_country_code) OR c.code_2 = UPPER(p_country_code))
    AND UPPER(sp.code) = UPPER(p_state_code)
    AND sp.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search states/provinces
CREATE OR REPLACE FUNCTION search_states(
  p_search VARCHAR(255),
  p_country_code VARCHAR(3) DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  code TEXT,
  country_name TEXT,
  country_code TEXT,
  state_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.name::TEXT,
    sp.code::TEXT,
    c.name::TEXT as country_name,
    c.code::TEXT as country_code,
    sp.state_type::TEXT
  FROM states_provinces sp
  JOIN countries c ON sp.country_id = c.id
  WHERE sp.is_active = true
    AND c.is_active = true
    AND (sp.name ILIKE '%' || p_search || '%' OR sp.code ILIKE '%' || p_search || '%')
    AND (p_country_code IS NULL OR c.code = UPPER(p_country_code) OR c.code_2 = UPPER(p_country_code))
  ORDER BY sp.name ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ADD STATE REFERENCE TO ELECTIONS
-- =====================================================

-- Add state_id to elections table
ALTER TABLE elections
  ADD COLUMN IF NOT EXISTS state_id UUID REFERENCES states_provinces(id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_elections_state_id ON elections(state_id);

-- =====================================================
-- ADD STATE REFERENCE TO CONSTITUENCIES
-- =====================================================

-- Add state_id to constituencies table
ALTER TABLE constituencies
  ADD COLUMN IF NOT EXISTS state_id UUID REFERENCES states_provinces(id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_constituencies_state_id ON constituencies(state_id);

-- =====================================================
-- ADD STATE REFERENCE TO POLITICIANS
-- =====================================================

-- Add state_id to politicians table
ALTER TABLE politicians
  ADD COLUMN IF NOT EXISTS state_id UUID REFERENCES states_provinces(id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_politicians_state_id ON politicians(state_id);

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON states_provinces TO authenticated;
GRANT SELECT ON states_provinces TO anon;

GRANT EXECUTE ON FUNCTION get_states_by_country(VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_states_by_country(VARCHAR, VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION get_state_by_code(VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_state_by_code(VARCHAR, VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION search_states(VARCHAR, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_states(VARCHAR, VARCHAR, INTEGER) TO anon;
