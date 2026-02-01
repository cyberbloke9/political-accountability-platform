-- Migration: Election Data Sources and Import Tracking
-- Track where election data comes from and manage imports

-- Data source types
CREATE TYPE data_source_type AS ENUM (
  'manual',           -- Admin manual entry
  'eci_website',      -- Scraped from ECI website
  'data_gov_in',      -- data.gov.in API
  'datameet_github',  -- datameet/india-election-data
  'kaggle',           -- Kaggle datasets
  'myneta',           -- MyNeta.info (ADR)
  'csep',             -- CSEP academic dataset
  'state_ec',         -- State Election Commission
  'news_media',       -- News sources
  'other'             -- Other sources
);

-- Track data sources and their reliability
CREATE TABLE IF NOT EXISTS election_data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  source_type data_source_type NOT NULL,
  url TEXT,
  description TEXT,
  license VARCHAR(100),
  reliability_score INTEGER CHECK (reliability_score BETWEEN 1 AND 10),
  last_updated TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track individual data imports
CREATE TABLE IF NOT EXISTS election_data_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES election_data_sources(id),
  import_type VARCHAR(50) NOT NULL, -- 'elections', 'candidates', 'results', 'constituencies'
  status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, failed
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  imported_by UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add source tracking to elections table
ALTER TABLE elections ADD COLUMN IF NOT EXISTS data_source_id UUID REFERENCES election_data_sources(id);
ALTER TABLE elections ADD COLUMN IF NOT EXISTS source_reference TEXT; -- Original ID from source
ALTER TABLE elections ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Add source tracking to potential_candidates
ALTER TABLE potential_candidates ADD COLUMN IF NOT EXISTS data_source_id UUID REFERENCES election_data_sources(id);
ALTER TABLE potential_candidates ADD COLUMN IF NOT EXISTS source_reference TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_data_imports_source ON election_data_imports(source_id);
CREATE INDEX IF NOT EXISTS idx_data_imports_status ON election_data_imports(status);
CREATE INDEX IF NOT EXISTS idx_elections_source ON elections(data_source_id);
CREATE INDEX IF NOT EXISTS idx_elections_source_ref ON elections(source_reference) WHERE source_reference IS NOT NULL;

-- Seed initial data sources
INSERT INTO election_data_sources (name, source_type, url, description, license, reliability_score, is_active) VALUES
  ('Manual Entry', 'manual', NULL, 'Data entered manually by administrators', NULL, 10, true),
  ('Election Commission of India', 'eci_website', 'https://eci.gov.in', 'Official ECI website - scraped data', 'Government', 10, true),
  ('DataMeet India Elections', 'datameet_github', 'https://github.com/datameet/india-election-data', 'Open dataset of Indian elections 1951-2019', 'ODbL', 9, true),
  ('Data.gov.in Electoral Statistics', 'data_gov_in', 'https://data.gov.in/catalog/electoral-statistics', 'Government open data portal', 'GODL', 9, true),
  ('Kaggle India Elections 2024', 'kaggle', 'https://www.kaggle.com/datasets/...', 'Kaggle community dataset for 2024 elections', 'CC0', 7, true),
  ('CSEP Election Dataset', 'csep', 'https://csep.org/', 'Academic dataset 1991-2023', 'Academic', 9, false),
  ('MyNeta ADR', 'myneta', 'https://myneta.info', 'Association for Democratic Reforms candidate data', 'Restricted', 10, false),
  ('State Election Commissions', 'state_ec', NULL, 'Various state EC websites', 'Government', 9, true)
ON CONFLICT DO NOTHING;

-- Function to get data sources
CREATE OR REPLACE FUNCTION get_election_data_sources(
  p_active_only BOOLEAN DEFAULT true
)
RETURNS SETOF election_data_sources
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM election_data_sources
  WHERE (NOT p_active_only OR is_active = true)
  ORDER BY reliability_score DESC, name;
END;
$$;

-- Function to log import progress
CREATE OR REPLACE FUNCTION update_import_progress(
  p_import_id UUID,
  p_records_processed INTEGER,
  p_records_created INTEGER DEFAULT 0,
  p_records_updated INTEGER DEFAULT 0,
  p_records_failed INTEGER DEFAULT 0,
  p_status VARCHAR DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE election_data_imports
  SET
    records_processed = p_records_processed,
    records_created = COALESCE(p_records_created, records_created),
    records_updated = COALESCE(p_records_updated, records_updated),
    records_failed = COALESCE(p_records_failed, records_failed),
    status = COALESCE(p_status, status),
    completed_at = CASE WHEN p_status IN ('completed', 'failed') THEN NOW() ELSE completed_at END,
    metadata = metadata || jsonb_build_object('last_update', NOW())
  WHERE id = p_import_id;
END;
$$;

-- Function to start an import
CREATE OR REPLACE FUNCTION start_data_import(
  p_source_id UUID,
  p_import_type VARCHAR,
  p_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_import_id UUID;
BEGIN
  INSERT INTO election_data_imports (source_id, import_type, status, started_at, imported_by, metadata)
  VALUES (p_source_id, p_import_type, 'running', NOW(), p_user_id, p_metadata)
  RETURNING id INTO v_import_id;

  RETURN v_import_id;
END;
$$;

-- Grant permissions
GRANT SELECT ON election_data_sources TO authenticated;
GRANT SELECT ON election_data_imports TO authenticated;
GRANT EXECUTE ON FUNCTION get_election_data_sources TO authenticated;

-- Comments
COMMENT ON TABLE election_data_sources IS 'Registry of data sources for election information';
COMMENT ON TABLE election_data_imports IS 'Track data import jobs and their status';
