-- =====================================================
-- MIGRATION 035: COUNTRIES TABLE
-- Global elections support with ISO country codes
-- =====================================================

-- =====================================================
-- COUNTRIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  name VARCHAR(255) NOT NULL,
  code VARCHAR(3) NOT NULL UNIQUE,           -- ISO 3166-1 alpha-3 (e.g., IND, USA, GBR)
  code_2 VARCHAR(2) NOT NULL UNIQUE,         -- ISO 3166-1 alpha-2 (e.g., IN, US, GB)

  -- Geography
  continent VARCHAR(50) CHECK (continent IN (
    'Africa', 'Asia', 'Europe', 'North America',
    'South America', 'Oceania', 'Antarctica'
  )),

  -- Government
  government_type VARCHAR(100),               -- democracy, republic, constitutional_monarchy, etc.

  -- Basic info
  capital VARCHAR(255),
  population BIGINT,
  flag_emoji VARCHAR(10),                     -- e.g., 🇮🇳, 🇺🇸, 🇬🇧

  -- Election system
  election_system VARCHAR(100),               -- parliamentary, presidential, mixed, etc.
  voting_age INTEGER DEFAULT 18,
  has_compulsory_voting BOOLEAN DEFAULT false,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);
CREATE INDEX IF NOT EXISTS idx_countries_code_2 ON countries(code_2);
CREATE INDEX IF NOT EXISTS idx_countries_continent ON countries(continent);
CREATE INDEX IF NOT EXISTS idx_countries_active ON countries(is_active) WHERE is_active = true;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view countries" ON countries
  FOR SELECT USING (true);

-- Admin write access (service role bypasses RLS)

-- =====================================================
-- UPDATE TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_countries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_countries_updated_at
  BEFORE UPDATE ON countries
  FOR EACH ROW
  EXECUTE FUNCTION update_countries_updated_at();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get all active countries
CREATE OR REPLACE FUNCTION get_countries(
  p_continent VARCHAR(50) DEFAULT NULL,
  p_search VARCHAR(255) DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  code TEXT,
  code_2 TEXT,
  continent TEXT,
  capital TEXT,
  flag_emoji TEXT,
  government_type TEXT,
  election_system TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name::TEXT,
    c.code::TEXT,
    c.code_2::TEXT,
    c.continent::TEXT,
    c.capital::TEXT,
    c.flag_emoji::TEXT,
    c.government_type::TEXT,
    c.election_system::TEXT
  FROM countries c
  WHERE c.is_active = true
    AND (p_continent IS NULL OR c.continent = p_continent)
    AND (p_search IS NULL OR c.name ILIKE '%' || p_search || '%')
  ORDER BY c.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get country by code
CREATE OR REPLACE FUNCTION get_country_by_code(p_code VARCHAR(3))
RETURNS TABLE (
  id UUID,
  name TEXT,
  code TEXT,
  code_2 TEXT,
  continent TEXT,
  capital TEXT,
  population BIGINT,
  flag_emoji TEXT,
  government_type TEXT,
  election_system TEXT,
  voting_age INTEGER,
  has_compulsory_voting BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name::TEXT,
    c.code::TEXT,
    c.code_2::TEXT,
    c.continent::TEXT,
    c.capital::TEXT,
    c.population,
    c.flag_emoji::TEXT,
    c.government_type::TEXT,
    c.election_system::TEXT,
    c.voting_age,
    c.has_compulsory_voting
  FROM countries c
  WHERE (c.code = UPPER(p_code) OR c.code_2 = UPPER(p_code))
    AND c.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ADD COUNTRY REFERENCE TO ELECTIONS
-- =====================================================

-- Add country_id to elections table
ALTER TABLE elections
  ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id);

-- Create index for country-based queries
CREATE INDEX IF NOT EXISTS idx_elections_country_id ON elections(country_id);

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON countries TO authenticated;
GRANT SELECT ON countries TO anon;

GRANT EXECUTE ON FUNCTION get_countries(VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_countries(VARCHAR, VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION get_country_by_code(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_country_by_code(VARCHAR) TO anon;
