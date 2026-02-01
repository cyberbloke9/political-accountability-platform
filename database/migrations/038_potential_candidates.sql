-- =====================================================
-- MIGRATION 038: POTENTIAL CANDIDATES TABLE
-- Track politicians who could run for elections
-- =====================================================

-- =====================================================
-- POTENTIAL CANDIDATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS potential_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to existing politician (if tracked)
  politician_id UUID REFERENCES politicians(id) ON DELETE SET NULL,

  -- Basic info
  name VARCHAR(255) NOT NULL,
  photo_url TEXT,
  bio TEXT,

  -- Location eligibility
  country_id UUID REFERENCES countries(id),
  state_id UUID REFERENCES states_provinces(id),
  constituency_id UUID REFERENCES constituencies(id),
  home_district VARCHAR(255),

  -- Eligibility info
  eligible_positions TEXT[] DEFAULT '{}',         -- ['MP', 'MLA', 'Mayor', 'Councillor']
  eligible_election_types TEXT[] DEFAULT '{}',    -- ['lok_sabha', 'state_assembly', 'municipal']
  eligible_election_levels TEXT[] DEFAULT '{}',   -- ['national', 'state', 'municipal']

  -- Candidacy status
  candidacy_status VARCHAR(50) DEFAULT 'potential' CHECK (candidacy_status IN (
    'potential',      -- Could potentially run
    'speculated',     -- Media speculation
    'considering',    -- Publicly considering
    'announced',      -- Officially announced
    'filed',          -- Filed nomination
    'confirmed',      -- Nomination accepted
    'withdrawn',      -- Withdrew candidacy
    'disqualified'    -- Disqualified by election commission
  )),

  -- Party affiliation
  party_id UUID REFERENCES parties(id),
  party_name VARCHAR(255),                        -- Fallback if party not in system
  is_independent BOOLEAN DEFAULT false,

  -- Current position
  current_position VARCHAR(255),                  -- Current role (e.g., "MLA", "Former CM")
  current_constituency VARCHAR(255),

  -- Political experience
  political_experience_years INTEGER DEFAULT 0,
  previous_elections_contested INTEGER DEFAULT 0,
  previous_elections_won INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN previous_elections_contested > 0
      THEN (previous_elections_won::DECIMAL / previous_elections_contested * 100)
      ELSE 0
    END
  ) STORED,

  -- If announced for specific election
  announced_for_election_id UUID REFERENCES elections(id),
  announced_for_constituency_id UUID REFERENCES constituencies(id),
  announcement_date DATE,
  announcement_source TEXT,                       -- URL or source of announcement

  -- Filing info (once filed)
  nomination_filing_date DATE,
  affidavit_url TEXT,

  -- Social media
  social_media JSONB DEFAULT '{}',                -- {twitter, facebook, instagram, youtube, linkedin}

  -- Contact info
  contact_info JSONB DEFAULT '{}',                -- {email, phone, office_address, website}

  -- Popularity/Influence metrics
  social_followers_count INTEGER DEFAULT 0,
  news_mentions_count INTEGER DEFAULT 0,
  last_news_mention_date DATE,

  -- Tags and notes
  tags TEXT[] DEFAULT '{}',
  notes TEXT,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_potential_candidates_politician ON potential_candidates(politician_id);
CREATE INDEX IF NOT EXISTS idx_potential_candidates_country ON potential_candidates(country_id);
CREATE INDEX IF NOT EXISTS idx_potential_candidates_state ON potential_candidates(state_id);
CREATE INDEX IF NOT EXISTS idx_potential_candidates_constituency ON potential_candidates(constituency_id);
CREATE INDEX IF NOT EXISTS idx_potential_candidates_status ON potential_candidates(candidacy_status);
CREATE INDEX IF NOT EXISTS idx_potential_candidates_party ON potential_candidates(party_id);
CREATE INDEX IF NOT EXISTS idx_potential_candidates_announced ON potential_candidates(announced_for_election_id);
CREATE INDEX IF NOT EXISTS idx_potential_candidates_active ON potential_candidates(is_active) WHERE is_active = true;

-- Full-text search on name
CREATE INDEX IF NOT EXISTS idx_potential_candidates_name_search ON potential_candidates USING gin(to_tsvector('english', name));

-- GIN index on arrays
CREATE INDEX IF NOT EXISTS idx_potential_candidates_positions ON potential_candidates USING gin(eligible_positions);
CREATE INDEX IF NOT EXISTS idx_potential_candidates_election_types ON potential_candidates USING gin(eligible_election_types);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE potential_candidates ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view potential candidates" ON potential_candidates
  FOR SELECT USING (true);

-- =====================================================
-- UPDATE TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_potential_candidates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_potential_candidates_updated_at
  BEFORE UPDATE ON potential_candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_potential_candidates_updated_at();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get potential candidates by state
CREATE OR REPLACE FUNCTION get_potential_candidates_by_state(
  p_state_code VARCHAR(10),
  p_country_code VARCHAR(3) DEFAULT 'IND',
  p_party_id UUID DEFAULT NULL,
  p_status VARCHAR(50) DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  photo_url TEXT,
  party_name TEXT,
  party_short_name TEXT,
  current_position TEXT,
  candidacy_status TEXT,
  eligible_positions TEXT[],
  announced_for_election TEXT,
  win_rate DECIMAL,
  politician_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.id,
    pc.name::TEXT,
    pc.photo_url::TEXT,
    COALESCE(p.name, pc.party_name)::TEXT as party_name,
    p.short_name::TEXT as party_short_name,
    pc.current_position::TEXT,
    pc.candidacy_status::TEXT,
    pc.eligible_positions,
    e.name::TEXT as announced_for_election,
    pc.win_rate,
    pc.politician_id
  FROM potential_candidates pc
  LEFT JOIN parties p ON pc.party_id = p.id
  LEFT JOIN states_provinces sp ON pc.state_id = sp.id
  LEFT JOIN countries c ON pc.country_id = c.id
  LEFT JOIN elections e ON pc.announced_for_election_id = e.id
  WHERE pc.is_active = true
    AND (sp.code = UPPER(p_state_code) OR p_state_code IS NULL)
    AND (c.code = UPPER(p_country_code) OR c.code_2 = UPPER(p_country_code) OR p_country_code IS NULL)
    AND (p_party_id IS NULL OR pc.party_id = p_party_id)
    AND (p_status IS NULL OR pc.candidacy_status = p_status)
  ORDER BY
    CASE pc.candidacy_status
      WHEN 'confirmed' THEN 1
      WHEN 'filed' THEN 2
      WHEN 'announced' THEN 3
      WHEN 'considering' THEN 4
      WHEN 'speculated' THEN 5
      WHEN 'potential' THEN 6
      ELSE 7
    END,
    pc.name ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get potential candidates for an election
CREATE OR REPLACE FUNCTION get_potential_candidates_for_election(
  p_election_id UUID,
  p_constituency_id UUID DEFAULT NULL,
  p_include_all_eligible BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  photo_url TEXT,
  party_name TEXT,
  party_short_name TEXT,
  current_position TEXT,
  candidacy_status TEXT,
  constituency_name TEXT,
  announcement_date DATE,
  win_rate DECIMAL,
  politician_id UUID
) AS $$
DECLARE
  v_election_type TEXT;
  v_election_level TEXT;
  v_state_id UUID;
BEGIN
  -- Get election details
  SELECT election_type, election_level, state_id
  INTO v_election_type, v_election_level, v_state_id
  FROM elections
  WHERE id = p_election_id;

  RETURN QUERY
  SELECT
    pc.id,
    pc.name::TEXT,
    pc.photo_url::TEXT,
    COALESCE(p.name, pc.party_name)::TEXT as party_name,
    p.short_name::TEXT as party_short_name,
    pc.current_position::TEXT,
    pc.candidacy_status::TEXT,
    c.name::TEXT as constituency_name,
    pc.announcement_date,
    pc.win_rate,
    pc.politician_id
  FROM potential_candidates pc
  LEFT JOIN parties p ON pc.party_id = p.id
  LEFT JOIN constituencies c ON pc.announced_for_constituency_id = c.id
  WHERE pc.is_active = true
    AND (
      -- Either announced for this election
      pc.announced_for_election_id = p_election_id
      -- Or eligible for this type of election (if including all eligible)
      OR (
        p_include_all_eligible
        AND (
          v_election_type = ANY(pc.eligible_election_types)
          OR v_election_level = ANY(pc.eligible_election_levels)
        )
        AND (pc.state_id = v_state_id OR pc.state_id IS NULL)
      )
    )
    AND (p_constituency_id IS NULL OR pc.announced_for_constituency_id = p_constituency_id)
  ORDER BY
    CASE pc.candidacy_status
      WHEN 'confirmed' THEN 1
      WHEN 'filed' THEN 2
      WHEN 'announced' THEN 3
      WHEN 'considering' THEN 4
      ELSE 5
    END,
    pc.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get announced candidates (those who have announced for any election)
CREATE OR REPLACE FUNCTION get_announced_candidates(
  p_country_code VARCHAR(3) DEFAULT NULL,
  p_state_code VARCHAR(10) DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  photo_url TEXT,
  party_name TEXT,
  candidacy_status TEXT,
  election_name TEXT,
  election_type TEXT,
  constituency_name TEXT,
  announcement_date DATE,
  days_since_announcement INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.id,
    pc.name::TEXT,
    pc.photo_url::TEXT,
    COALESCE(p.name, pc.party_name)::TEXT as party_name,
    pc.candidacy_status::TEXT,
    e.name::TEXT as election_name,
    e.election_type::TEXT,
    c.name::TEXT as constituency_name,
    pc.announcement_date,
    (CURRENT_DATE - pc.announcement_date)::INTEGER as days_since_announcement
  FROM potential_candidates pc
  LEFT JOIN parties p ON pc.party_id = p.id
  LEFT JOIN elections e ON pc.announced_for_election_id = e.id
  LEFT JOIN constituencies c ON pc.announced_for_constituency_id = c.id
  LEFT JOIN states_provinces sp ON pc.state_id = sp.id
  LEFT JOIN countries co ON pc.country_id = co.id
  WHERE pc.is_active = true
    AND pc.candidacy_status IN ('announced', 'filed', 'confirmed', 'considering')
    AND pc.announced_for_election_id IS NOT NULL
    AND (p_country_code IS NULL OR co.code = UPPER(p_country_code) OR co.code_2 = UPPER(p_country_code))
    AND (p_state_code IS NULL OR sp.code = UPPER(p_state_code))
  ORDER BY pc.announcement_date DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search potential candidates
CREATE OR REPLACE FUNCTION search_potential_candidates(
  p_search VARCHAR(255),
  p_country_code VARCHAR(3) DEFAULT NULL,
  p_state_code VARCHAR(10) DEFAULT NULL,
  p_party_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  photo_url TEXT,
  party_name TEXT,
  current_position TEXT,
  candidacy_status TEXT,
  state_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.id,
    pc.name::TEXT,
    pc.photo_url::TEXT,
    COALESCE(p.name, pc.party_name)::TEXT as party_name,
    pc.current_position::TEXT,
    pc.candidacy_status::TEXT,
    sp.name::TEXT as state_name
  FROM potential_candidates pc
  LEFT JOIN parties p ON pc.party_id = p.id
  LEFT JOIN states_provinces sp ON pc.state_id = sp.id
  LEFT JOIN countries c ON pc.country_id = c.id
  WHERE pc.is_active = true
    AND (
      pc.name ILIKE '%' || p_search || '%'
      OR pc.current_position ILIKE '%' || p_search || '%'
      OR p.name ILIKE '%' || p_search || '%'
    )
    AND (p_country_code IS NULL OR c.code = UPPER(p_country_code) OR c.code_2 = UPPER(p_country_code))
    AND (p_state_code IS NULL OR sp.code = UPPER(p_state_code))
    AND (p_party_id IS NULL OR pc.party_id = p_party_id)
  ORDER BY
    CASE WHEN pc.name ILIKE p_search || '%' THEN 0 ELSE 1 END,
    pc.name ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get candidate status summary by state
CREATE OR REPLACE FUNCTION get_candidate_status_summary_by_state(
  p_state_code VARCHAR(10),
  p_country_code VARCHAR(3) DEFAULT 'IND'
)
RETURNS TABLE (
  candidacy_status TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.candidacy_status::TEXT,
    COUNT(*)::BIGINT
  FROM potential_candidates pc
  LEFT JOIN states_provinces sp ON pc.state_id = sp.id
  LEFT JOIN countries c ON pc.country_id = c.id
  WHERE pc.is_active = true
    AND (sp.code = UPPER(p_state_code))
    AND (c.code = UPPER(p_country_code) OR c.code_2 = UPPER(p_country_code))
  GROUP BY pc.candidacy_status
  ORDER BY
    CASE pc.candidacy_status
      WHEN 'confirmed' THEN 1
      WHEN 'filed' THEN 2
      WHEN 'announced' THEN 3
      WHEN 'considering' THEN 4
      WHEN 'speculated' THEN 5
      WHEN 'potential' THEN 6
      ELSE 7
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON potential_candidates TO authenticated;
GRANT SELECT ON potential_candidates TO anon;

GRANT EXECUTE ON FUNCTION get_potential_candidates_by_state(VARCHAR, VARCHAR, UUID, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_potential_candidates_by_state(VARCHAR, VARCHAR, UUID, VARCHAR, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_potential_candidates_for_election(UUID, UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_potential_candidates_for_election(UUID, UUID, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION get_announced_candidates(VARCHAR, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_announced_candidates(VARCHAR, VARCHAR, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION search_potential_candidates(VARCHAR, VARCHAR, VARCHAR, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_potential_candidates(VARCHAR, VARCHAR, VARCHAR, UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_candidate_status_summary_by_state(VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidate_status_summary_by_state(VARCHAR, VARCHAR) TO anon;
