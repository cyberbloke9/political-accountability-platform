-- =====================================================
-- SPRINT 8: ELECTION INTEGRATION
-- Elections, constituencies, candidates, and manifestos
-- =====================================================

-- =====================================================
-- ELECTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Election identification
  name VARCHAR(200) NOT NULL,
  election_type VARCHAR(50) NOT NULL CHECK (election_type IN (
    'lok_sabha', 'rajya_sabha', 'state_assembly',
    'municipal', 'panchayat', 'by_election'
  )),

  -- Geography
  country VARCHAR(100) DEFAULT 'India',
  state VARCHAR(100), -- NULL for national elections

  -- Timeline
  announcement_date DATE,
  nomination_start DATE,
  nomination_end DATE,
  polling_start DATE NOT NULL,
  polling_end DATE NOT NULL,
  counting_date DATE,
  results_date DATE,

  -- Status
  status VARCHAR(30) DEFAULT 'upcoming' CHECK (status IN (
    'announced', 'nominations_open', 'campaigning',
    'polling', 'counting', 'completed', 'cancelled'
  )),

  -- Statistics (updated after results)
  total_constituencies INTEGER DEFAULT 0,
  total_voters_registered BIGINT DEFAULT 0,
  total_votes_cast BIGINT DEFAULT 0,
  voter_turnout_percent DECIMAL(5,2),

  -- Metadata
  official_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_elections_type ON elections(election_type);
CREATE INDEX IF NOT EXISTS idx_elections_status ON elections(status);
CREATE INDEX IF NOT EXISTS idx_elections_state ON elections(state);
CREATE INDEX IF NOT EXISTS idx_elections_dates ON elections(polling_start, polling_end);

-- =====================================================
-- CONSTITUENCIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS constituencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  name VARCHAR(200) NOT NULL,
  code VARCHAR(20), -- Official EC code
  constituency_type VARCHAR(50) NOT NULL CHECK (constituency_type IN (
    'lok_sabha', 'state_assembly', 'municipal_ward',
    'panchayat', 'rajya_sabha_state'
  )),

  -- Geography
  state VARCHAR(100) NOT NULL,
  district VARCHAR(100),

  -- Reservation status
  reservation_type VARCHAR(30) CHECK (reservation_type IN (
    'general', 'sc', 'st', 'obc', 'women', NULL
  )),

  -- Demographics (for context)
  total_voters_registered BIGINT,
  area_sq_km DECIMAL(10,2),

  -- Parent constituency (for assembly under LS)
  parent_constituency_id UUID REFERENCES constituencies(id),

  -- GeoJSON boundary (optional)
  boundary_geojson JSONB,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(code, constituency_type)
);

CREATE INDEX IF NOT EXISTS idx_constituencies_type ON constituencies(constituency_type);
CREATE INDEX IF NOT EXISTS idx_constituencies_state ON constituencies(state);
CREATE INDEX IF NOT EXISTS idx_constituencies_district ON constituencies(state, district);
CREATE INDEX IF NOT EXISTS idx_constituencies_parent ON constituencies(parent_constituency_id);

-- =====================================================
-- PARTIES TABLE (must be before candidates)
-- =====================================================

CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  name VARCHAR(200) NOT NULL,
  short_name VARCHAR(20) NOT NULL, -- e.g., BJP, INC, AAP
  symbol_name VARCHAR(100), -- e.g., "Lotus", "Hand"

  -- Classification
  party_type VARCHAR(30) CHECK (party_type IN (
    'national', 'state', 'registered_unrecognized'
  )),

  -- Branding
  logo_url TEXT,
  primary_color VARCHAR(7), -- Hex color
  secondary_color VARCHAR(7),

  -- Leadership
  president_name VARCHAR(200),
  founded_year INTEGER,
  headquarters VARCHAR(200),

  -- Online presence
  website_url TEXT,
  twitter_handle VARCHAR(100),
  facebook_url TEXT,

  -- Statistics (computed)
  total_politicians_tracked INTEGER DEFAULT 0,
  total_promises_tracked INTEGER DEFAULT 0,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(short_name)
);

CREATE INDEX IF NOT EXISTS idx_parties_type ON parties(party_type);
CREATE INDEX IF NOT EXISTS idx_parties_short ON parties(short_name);

-- =====================================================
-- CANDIDATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to existing politician (if tracked)
  politician_id UUID REFERENCES politicians(id),

  -- Candidate info (if politician not in system)
  name VARCHAR(200) NOT NULL,
  photo_url TEXT,

  -- Election and constituency
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  constituency_id UUID NOT NULL REFERENCES constituencies(id),

  -- Party affiliation
  party_id UUID REFERENCES parties(id),
  party_name VARCHAR(200), -- Fallback if party not in system
  is_independent BOOLEAN DEFAULT false,

  -- Nomination
  nomination_date DATE,
  nomination_status VARCHAR(30) DEFAULT 'filed' CHECK (nomination_status IN (
    'filed', 'accepted', 'rejected', 'withdrawn'
  )),

  -- Results (filled after counting)
  votes_received INTEGER,
  vote_share_percent DECIMAL(5,2),
  rank_in_constituency INTEGER,
  is_winner BOOLEAN DEFAULT false,
  margin_of_victory INTEGER, -- Only for winner

  -- Criminal records (as per EC affidavit)
  criminal_cases_count INTEGER DEFAULT 0,
  has_serious_charges BOOLEAN DEFAULT false,

  -- Assets & liabilities (from affidavit)
  declared_assets_inr BIGINT,
  declared_liabilities_inr BIGINT,

  -- Education
  education_level VARCHAR(100),

  -- Metadata
  affidavit_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(election_id, constituency_id, politician_id),
  UNIQUE(election_id, constituency_id, name, party_name)
);

CREATE INDEX IF NOT EXISTS idx_candidates_election ON candidates(election_id);
CREATE INDEX IF NOT EXISTS idx_candidates_constituency ON candidates(constituency_id);
CREATE INDEX IF NOT EXISTS idx_candidates_politician ON candidates(politician_id);
CREATE INDEX IF NOT EXISTS idx_candidates_party ON candidates(party_id);
CREATE INDEX IF NOT EXISTS idx_candidates_winner ON candidates(is_winner) WHERE is_winner = true;

-- =====================================================
-- MANIFESTOS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS manifestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Association
  party_id UUID NOT NULL REFERENCES parties(id),
  election_id UUID NOT NULL REFERENCES elections(id),

  -- Document info
  title VARCHAR(300) NOT NULL,
  language VARCHAR(50) DEFAULT 'English',

  -- Content
  summary TEXT, -- AI-generated summary
  full_text TEXT, -- Full manifesto text (if available)

  -- Document
  document_url TEXT,
  document_hash VARCHAR(64), -- SHA-256 for verification
  page_count INTEGER,

  -- Processing status
  processing_status VARCHAR(30) DEFAULT 'pending' CHECK (processing_status IN (
    'pending', 'processing', 'completed', 'failed'
  )),
  promises_extracted INTEGER DEFAULT 0,

  -- Metadata
  release_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(party_id, election_id, language)
);

CREATE INDEX IF NOT EXISTS idx_manifestos_party ON manifestos(party_id);
CREATE INDEX IF NOT EXISTS idx_manifestos_election ON manifestos(election_id);
CREATE INDEX IF NOT EXISTS idx_manifestos_status ON manifestos(processing_status);

-- =====================================================
-- MANIFESTO PROMISES TABLE
-- Links extracted promises to manifestos
-- =====================================================

CREATE TABLE IF NOT EXISTS manifesto_promises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source
  manifesto_id UUID NOT NULL REFERENCES manifestos(id) ON DELETE CASCADE,

  -- Link to tracked promise (once created)
  promise_id UUID REFERENCES promises(id),

  -- Extracted content
  promise_text TEXT NOT NULL,
  category VARCHAR(100),
  page_number INTEGER,
  section_title VARCHAR(200),

  -- Classification
  promise_type VARCHAR(50) CHECK (promise_type IN (
    'policy', 'infrastructure', 'welfare', 'governance',
    'economic', 'social', 'environmental', 'defense', 'other'
  )),

  -- AI analysis
  ai_confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  ai_extracted BOOLEAN DEFAULT false,

  -- Verification link
  is_tracked BOOLEAN DEFAULT false, -- When added to main promises table

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manifesto_promises_manifesto ON manifesto_promises(manifesto_id);
CREATE INDEX IF NOT EXISTS idx_manifesto_promises_promise ON manifesto_promises(promise_id);
CREATE INDEX IF NOT EXISTS idx_manifesto_promises_category ON manifesto_promises(category);
CREATE INDEX IF NOT EXISTS idx_manifesto_promises_tracked ON manifesto_promises(is_tracked);

-- =====================================================
-- ELECTION RESULTS TABLE
-- Detailed constituency-wise results
-- =====================================================

CREATE TABLE IF NOT EXISTS election_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  constituency_id UUID NOT NULL REFERENCES constituencies(id),

  -- Winner
  winning_candidate_id UUID REFERENCES candidates(id),
  winning_party_id UUID REFERENCES parties(id),

  -- Voting stats
  total_voters_registered BIGINT,
  total_votes_cast BIGINT,
  valid_votes BIGINT,
  rejected_votes BIGINT,
  nota_votes INTEGER, -- None of the Above

  -- Turnout
  voter_turnout_percent DECIMAL(5,2),

  -- Margins
  winning_margin INTEGER,
  winning_margin_percent DECIMAL(5,2),

  -- Metadata
  result_declared_at TIMESTAMP WITH TIME ZONE,
  official_result_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(election_id, constituency_id)
);

CREATE INDEX IF NOT EXISTS idx_results_election ON election_results(election_id);
CREATE INDEX IF NOT EXISTS idx_results_constituency ON election_results(constituency_id);
CREATE INDEX IF NOT EXISTS idx_results_winner ON election_results(winning_candidate_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE constituencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifesto_promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_results ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view elections" ON elections FOR SELECT USING (true);
CREATE POLICY "Public can view constituencies" ON constituencies FOR SELECT USING (true);
CREATE POLICY "Public can view candidates" ON candidates FOR SELECT USING (true);
CREATE POLICY "Public can view parties" ON parties FOR SELECT USING (true);
CREATE POLICY "Public can view manifestos" ON manifestos FOR SELECT USING (true);
CREATE POLICY "Public can view manifesto promises" ON manifesto_promises FOR SELECT USING (true);
CREATE POLICY "Public can view results" ON election_results FOR SELECT USING (true);

-- Admin write access (using service role or admin check)

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get upcoming elections
CREATE OR REPLACE FUNCTION get_upcoming_elections(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  name TEXT,
  election_type TEXT,
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
    e.state::TEXT,
    e.polling_start,
    e.polling_end,
    e.status::TEXT,
    e.total_constituencies
  FROM elections e
  WHERE e.polling_start >= CURRENT_DATE
    AND e.status NOT IN ('completed', 'cancelled')
  ORDER BY e.polling_start ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get constituency by location
CREATE OR REPLACE FUNCTION get_constituencies_by_state(
  p_state VARCHAR(100),
  p_type VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  code TEXT,
  constituency_type TEXT,
  district TEXT,
  reservation_type TEXT,
  total_voters_registered BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name::TEXT,
    c.code::TEXT,
    c.constituency_type::TEXT,
    c.district::TEXT,
    c.reservation_type::TEXT,
    c.total_voters_registered
  FROM constituencies c
  WHERE c.state = p_state
    AND c.is_active = true
    AND (p_type IS NULL OR c.constituency_type = p_type)
  ORDER BY c.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get candidates for an election
CREATE OR REPLACE FUNCTION get_election_candidates(
  p_election_id UUID,
  p_constituency_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  photo_url TEXT,
  party_name TEXT,
  party_short_name TEXT,
  constituency_name TEXT,
  is_independent BOOLEAN,
  nomination_status TEXT,
  votes_received INTEGER,
  vote_share_percent DECIMAL,
  is_winner BOOLEAN,
  criminal_cases_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name::TEXT,
    c.photo_url::TEXT,
    COALESCE(p.name, c.party_name)::TEXT as party_name,
    p.short_name::TEXT as party_short_name,
    con.name::TEXT as constituency_name,
    c.is_independent,
    c.nomination_status::TEXT,
    c.votes_received,
    c.vote_share_percent,
    c.is_winner,
    c.criminal_cases_count
  FROM candidates c
  LEFT JOIN parties p ON c.party_id = p.id
  JOIN constituencies con ON c.constituency_id = con.id
  WHERE c.election_id = p_election_id
    AND (p_constituency_id IS NULL OR c.constituency_id = p_constituency_id)
  ORDER BY c.is_winner DESC, c.votes_received DESC NULLS LAST, c.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get manifesto promises by party and election
CREATE OR REPLACE FUNCTION get_manifesto_promises(
  p_party_id UUID,
  p_election_id UUID,
  p_category VARCHAR(100) DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  promise_text TEXT,
  category TEXT,
  promise_type TEXT,
  page_number INTEGER,
  section_title TEXT,
  is_tracked BOOLEAN,
  tracked_promise_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mp.id,
    mp.promise_text::TEXT,
    mp.category::TEXT,
    mp.promise_type::TEXT,
    mp.page_number,
    mp.section_title::TEXT,
    mp.is_tracked,
    mp.promise_id as tracked_promise_id
  FROM manifesto_promises mp
  JOIN manifestos m ON mp.manifesto_id = m.id
  WHERE m.party_id = p_party_id
    AND m.election_id = p_election_id
    AND (p_category IS NULL OR mp.category = p_category)
  ORDER BY mp.page_number ASC, mp.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Convert manifesto promise to tracked promise
CREATE OR REPLACE FUNCTION track_manifesto_promise(
  p_manifesto_promise_id UUID,
  p_politician_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_promise_text TEXT;
  v_category TEXT;
  v_promise_id UUID;
  v_party_name TEXT;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Get manifesto promise details
  SELECT mp.promise_text, mp.category, p.name
  INTO v_promise_text, v_category, v_party_name
  FROM manifesto_promises mp
  JOIN manifestos m ON mp.manifesto_id = m.id
  JOIN parties p ON m.party_id = p.id
  WHERE mp.id = p_manifesto_promise_id;

  IF v_promise_text IS NULL THEN
    RAISE EXCEPTION 'Manifesto promise not found';
  END IF;

  -- Create promise
  INSERT INTO promises (
    politician_id,
    politician_name,
    promise_text,
    category,
    source_type,
    created_by
  )
  SELECT
    p_politician_id,
    pol.name,
    v_promise_text,
    v_category,
    'manifesto',
    v_user_id
  FROM politicians pol
  WHERE pol.id = p_politician_id
  RETURNING id INTO v_promise_id;

  -- Update manifesto promise
  UPDATE manifesto_promises
  SET promise_id = v_promise_id, is_tracked = true, updated_at = NOW()
  WHERE id = p_manifesto_promise_id;

  RETURN v_promise_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON elections TO authenticated;
GRANT SELECT ON elections TO anon;
GRANT SELECT ON constituencies TO authenticated;
GRANT SELECT ON constituencies TO anon;
GRANT SELECT ON candidates TO authenticated;
GRANT SELECT ON candidates TO anon;
GRANT SELECT ON parties TO authenticated;
GRANT SELECT ON parties TO anon;
GRANT SELECT ON manifestos TO authenticated;
GRANT SELECT ON manifestos TO anon;
GRANT SELECT ON manifesto_promises TO authenticated;
GRANT SELECT ON manifesto_promises TO anon;
GRANT SELECT ON election_results TO authenticated;
GRANT SELECT ON election_results TO anon;

GRANT EXECUTE ON FUNCTION get_upcoming_elections(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_elections(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_constituencies_by_state(VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_constituencies_by_state(VARCHAR, VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION get_election_candidates(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_election_candidates(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_manifesto_promises(UUID, UUID, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_manifesto_promises(UUID, UUID, VARCHAR, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION track_manifesto_promise(UUID, UUID) TO authenticated;
