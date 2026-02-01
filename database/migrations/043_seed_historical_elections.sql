-- Migration: Seed Historical Indian Elections Data
-- Data sourced from public records and datameet/india-election-data

-- Get the manual source ID
DO $$
DECLARE
  v_source_id UUID;
  v_india_id UUID;
BEGIN
  -- Get manual source
  SELECT id INTO v_source_id FROM election_data_sources WHERE source_type = 'manual' LIMIT 1;

  -- Get India country ID
  SELECT id INTO v_india_id FROM countries WHERE iso_alpha2 = 'IN' LIMIT 1;

  -- ============================================
  -- LOK SABHA (NATIONAL) ELECTIONS
  -- ============================================

  INSERT INTO elections (
    name, election_type, election_level, country_id,
    start_date, end_date, status, total_seats,
    description, data_source_id, source_reference
  ) VALUES
  -- 2024 General Election (18th Lok Sabha)
  (
    '2024 Indian General Election',
    'general',
    'national',
    v_india_id,
    '2024-04-19',
    '2024-06-01',
    'completed',
    543,
    '18th Lok Sabha elections held in 7 phases across India. BJP-led NDA won with reduced majority.',
    v_source_id,
    'LS-2024'
  ),
  -- 2019 General Election (17th Lok Sabha)
  (
    '2019 Indian General Election',
    'general',
    'national',
    v_india_id,
    '2019-04-11',
    '2019-05-19',
    'completed',
    543,
    '17th Lok Sabha elections. BJP won 303 seats, NDA secured 353 seats total.',
    v_source_id,
    'LS-2019'
  ),
  -- 2014 General Election (16th Lok Sabha)
  (
    '2014 Indian General Election',
    'general',
    'national',
    v_india_id,
    '2014-04-07',
    '2014-05-12',
    'completed',
    543,
    '16th Lok Sabha elections. Historic mandate for BJP with 282 seats.',
    v_source_id,
    'LS-2014'
  ),
  -- 2009 General Election (15th Lok Sabha)
  (
    '2009 Indian General Election',
    'general',
    'national',
    v_india_id,
    '2009-04-16',
    '2009-05-13',
    'completed',
    543,
    '15th Lok Sabha elections. Congress-led UPA returned to power.',
    v_source_id,
    'LS-2009'
  )
  ON CONFLICT DO NOTHING;

END $$;

-- ============================================
-- STATE ASSEMBLY ELECTIONS (2023-2025)
-- ============================================

DO $$
DECLARE
  v_source_id UUID;
  v_india_id UUID;
  v_state_id UUID;
BEGIN
  SELECT id INTO v_source_id FROM election_data_sources WHERE source_type = 'manual' LIMIT 1;
  SELECT id INTO v_india_id FROM countries WHERE iso_alpha2 = 'IN' LIMIT 1;

  -- Maharashtra 2024
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'MH' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Maharashtra Legislative Assembly Election 2024', 'state_assembly', 'state', v_india_id, v_state_id, 'Maharashtra', '2024-11-20', '2024-11-20', 'completed', 288, 'Maharashtra Vidhan Sabha elections. Mahayuti alliance (BJP, Shiv Sena, NCP) won landslide victory.', v_source_id, 'MH-2024')
  ON CONFLICT DO NOTHING;

  -- Jharkhand 2024
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'JH' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Jharkhand Legislative Assembly Election 2024', 'state_assembly', 'state', v_india_id, v_state_id, 'Jharkhand', '2024-11-13', '2024-11-20', 'completed', 81, 'Jharkhand Vidhan Sabha elections held in 2 phases.', v_source_id, 'JH-2024')
  ON CONFLICT DO NOTHING;

  -- Haryana 2024
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'HR' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Haryana Legislative Assembly Election 2024', 'state_assembly', 'state', v_india_id, v_state_id, 'Haryana', '2024-10-05', '2024-10-05', 'completed', 90, 'Haryana Vidhan Sabha elections. BJP won third consecutive term.', v_source_id, 'HR-2024')
  ON CONFLICT DO NOTHING;

  -- Jammu & Kashmir 2024
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'JK' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Jammu & Kashmir Legislative Assembly Election 2024', 'state_assembly', 'state', v_india_id, v_state_id, 'Jammu and Kashmir', '2024-09-18', '2024-10-01', 'completed', 90, 'First assembly elections in J&K after Article 370 abrogation.', v_source_id, 'JK-2024')
  ON CONFLICT DO NOTHING;

  -- Rajasthan 2023
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'RJ' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Rajasthan Legislative Assembly Election 2023', 'state_assembly', 'state', v_india_id, v_state_id, 'Rajasthan', '2023-11-25', '2023-11-25', 'completed', 200, 'Rajasthan Vidhan Sabha elections. BJP won with 115 seats.', v_source_id, 'RJ-2023')
  ON CONFLICT DO NOTHING;

  -- Madhya Pradesh 2023
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'MP' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Madhya Pradesh Legislative Assembly Election 2023', 'state_assembly', 'state', v_india_id, v_state_id, 'Madhya Pradesh', '2023-11-17', '2023-11-17', 'completed', 230, 'MP Vidhan Sabha elections. BJP retained power with 163 seats.', v_source_id, 'MP-2023')
  ON CONFLICT DO NOTHING;

  -- Chhattisgarh 2023
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'CT' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Chhattisgarh Legislative Assembly Election 2023', 'state_assembly', 'state', v_india_id, v_state_id, 'Chhattisgarh', '2023-11-07', '2023-11-17', 'completed', 90, 'Chhattisgarh Vidhan Sabha elections in 2 phases. BJP won with 54 seats.', v_source_id, 'CT-2023')
  ON CONFLICT DO NOTHING;

  -- Telangana 2023
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'TG' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Telangana Legislative Assembly Election 2023', 'state_assembly', 'state', v_india_id, v_state_id, 'Telangana', '2023-11-30', '2023-11-30', 'completed', 119, 'Telangana Vidhan Sabha elections. Congress won with 64 seats, ending BRS rule.', v_source_id, 'TG-2023')
  ON CONFLICT DO NOTHING;

  -- Mizoram 2023
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'MZ' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Mizoram Legislative Assembly Election 2023', 'state_assembly', 'state', v_india_id, v_state_id, 'Mizoram', '2023-11-07', '2023-11-07', 'completed', 40, 'Mizoram Vidhan Sabha elections. ZPM won with 27 seats.', v_source_id, 'MZ-2023')
  ON CONFLICT DO NOTHING;

  -- Karnataka 2023
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'KA' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Karnataka Legislative Assembly Election 2023', 'state_assembly', 'state', v_india_id, v_state_id, 'Karnataka', '2023-05-10', '2023-05-10', 'completed', 224, 'Karnataka Vidhan Sabha elections. Congress won with 135 seats.', v_source_id, 'KA-2023')
  ON CONFLICT DO NOTHING;

  -- Tripura 2023
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'TR' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Tripura Legislative Assembly Election 2023', 'state_assembly', 'state', v_india_id, v_state_id, 'Tripura', '2023-02-16', '2023-02-16', 'completed', 60, 'Tripura Vidhan Sabha elections. BJP won with 32 seats.', v_source_id, 'TR-2023')
  ON CONFLICT DO NOTHING;

  -- Meghalaya 2023
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'ML' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Meghalaya Legislative Assembly Election 2023', 'state_assembly', 'state', v_india_id, v_state_id, 'Meghalaya', '2023-02-27', '2023-02-27', 'completed', 60, 'Meghalaya Vidhan Sabha elections. NPP won with 26 seats.', v_source_id, 'ML-2023')
  ON CONFLICT DO NOTHING;

  -- Nagaland 2023
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'NL' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Nagaland Legislative Assembly Election 2023', 'state_assembly', 'state', v_india_id, v_state_id, 'Nagaland', '2023-02-27', '2023-02-27', 'completed', 60, 'Nagaland Vidhan Sabha elections. NDPP-BJP alliance retained power.', v_source_id, 'NL-2023')
  ON CONFLICT DO NOTHING;

END $$;

-- ============================================
-- UPCOMING ELECTIONS (2025-2026)
-- ============================================

DO $$
DECLARE
  v_source_id UUID;
  v_india_id UUID;
  v_state_id UUID;
BEGIN
  SELECT id INTO v_source_id FROM election_data_sources WHERE source_type = 'manual' LIMIT 1;
  SELECT id INTO v_india_id FROM countries WHERE iso_alpha2 = 'IN' LIMIT 1;

  -- Delhi 2025
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'DL' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Delhi Legislative Assembly Election 2025', 'state_assembly', 'state', v_india_id, v_state_id, 'Delhi', '2025-02-05', '2025-02-05', 'announced', 70, 'Delhi Vidhan Sabha elections. AAP vs BJP vs Congress contest expected.', v_source_id, 'DL-2025')
  ON CONFLICT DO NOTHING;

  -- Bihar 2025
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'BR' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Bihar Legislative Assembly Election 2025', 'state_assembly', 'state', v_india_id, v_state_id, 'Bihar', '2025-10-01', '2025-11-30', 'announced', 243, 'Bihar Vidhan Sabha elections expected in Oct-Nov 2025.', v_source_id, 'BR-2025')
  ON CONFLICT DO NOTHING;

  -- West Bengal 2026
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'WB' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('West Bengal Legislative Assembly Election 2026', 'state_assembly', 'state', v_india_id, v_state_id, 'West Bengal', '2026-04-01', '2026-05-31', 'announced', 294, 'West Bengal Vidhan Sabha elections expected in Apr-May 2026.', v_source_id, 'WB-2026')
  ON CONFLICT DO NOTHING;

  -- Tamil Nadu 2026
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'TN' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Tamil Nadu Legislative Assembly Election 2026', 'state_assembly', 'state', v_india_id, v_state_id, 'Tamil Nadu', '2026-04-01', '2026-05-31', 'announced', 234, 'Tamil Nadu Vidhan Sabha elections expected in Apr-May 2026.', v_source_id, 'TN-2026')
  ON CONFLICT DO NOTHING;

  -- Kerala 2026
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'KL' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Kerala Legislative Assembly Election 2026', 'state_assembly', 'state', v_india_id, v_state_id, 'Kerala', '2026-04-01', '2026-05-31', 'announced', 140, 'Kerala Vidhan Sabha elections expected in Apr-May 2026.', v_source_id, 'KL-2026')
  ON CONFLICT DO NOTHING;

  -- Assam 2026
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'AS' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Assam Legislative Assembly Election 2026', 'state_assembly', 'state', v_india_id, v_state_id, 'Assam', '2026-04-01', '2026-05-31', 'announced', 126, 'Assam Vidhan Sabha elections expected in Apr-May 2026.', v_source_id, 'AS-2026')
  ON CONFLICT DO NOTHING;

  -- Puducherry 2026
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'PY' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Puducherry Legislative Assembly Election 2026', 'state_assembly', 'state', v_india_id, v_state_id, 'Puducherry', '2026-04-01', '2026-05-31', 'announced', 33, 'Puducherry Vidhan Sabha elections expected in 2026.', v_source_id, 'PY-2026')
  ON CONFLICT DO NOTHING;

END $$;

-- ============================================
-- MUNICIPAL ELECTIONS
-- ============================================

DO $$
DECLARE
  v_source_id UUID;
  v_india_id UUID;
  v_state_id UUID;
BEGIN
  SELECT id INTO v_source_id FROM election_data_sources WHERE source_type = 'manual' LIMIT 1;
  SELECT id INTO v_india_id FROM countries WHERE iso_alpha2 = 'IN' LIMIT 1;

  -- BMC Mumbai 2025
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'MH' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Brihanmumbai Municipal Corporation Election 2025', 'municipal_corporation', 'municipal', v_india_id, v_state_id, 'Maharashtra', '2025-03-01', '2025-03-31', 'announced', 227, 'BMC elections for Indias richest municipal corporation. Delayed since 2022.', v_source_id, 'BMC-2025')
  ON CONFLICT DO NOTHING;

  -- GHMC Hyderabad
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'TG' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Greater Hyderabad Municipal Corporation Election 2025', 'municipal_corporation', 'municipal', v_india_id, v_state_id, 'Telangana', '2025-06-01', '2025-06-30', 'announced', 150, 'GHMC elections for Greater Hyderabad area.', v_source_id, 'GHMC-2025')
  ON CONFLICT DO NOTHING;

  -- Chennai Corporation
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'TN' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Greater Chennai Corporation Election 2026', 'municipal_corporation', 'municipal', v_india_id, v_state_id, 'Tamil Nadu', '2026-01-01', '2026-02-28', 'announced', 200, 'Chennai Corporation elections.', v_source_id, 'GCC-2026')
  ON CONFLICT DO NOTHING;

  -- BBMP Bangalore
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'KA' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Bruhat Bengaluru Mahanagara Palike Election 2025', 'municipal_corporation', 'municipal', v_india_id, v_state_id, 'Karnataka', '2025-04-01', '2025-05-31', 'announced', 243, 'BBMP elections for Bangalore. Long-delayed election.', v_source_id, 'BBMP-2025')
  ON CONFLICT DO NOTHING;

  -- Delhi MCD
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'DL' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Municipal Corporation of Delhi Election 2022', 'municipal_corporation', 'municipal', v_india_id, v_state_id, 'Delhi', '2022-12-04', '2022-12-04', 'completed', 250, 'MCD elections after unification of 3 municipal corporations. AAP won.', v_source_id, 'MCD-2022')
  ON CONFLICT DO NOTHING;

END $$;

-- ============================================
-- LOCAL BODY ELECTIONS (PANCHAYAT)
-- ============================================

DO $$
DECLARE
  v_source_id UUID;
  v_india_id UUID;
  v_state_id UUID;
BEGIN
  SELECT id INTO v_source_id FROM election_data_sources WHERE source_type = 'manual' LIMIT 1;
  SELECT id INTO v_india_id FROM countries WHERE iso_alpha2 = 'IN' LIMIT 1;

  -- UP Panchayat Elections
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'UP' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Uttar Pradesh Panchayat Election 2025', 'panchayat', 'local', v_india_id, v_state_id, 'Uttar Pradesh', '2025-04-01', '2025-05-31', 'announced', 58000, 'UP three-tier Panchayati Raj elections - Gram Panchayat, Kshetra Panchayat, Zilla Panchayat.', v_source_id, 'UP-PAN-2025')
  ON CONFLICT DO NOTHING;

  -- MP Panchayat Elections
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'MP' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Madhya Pradesh Panchayat Election 2025', 'panchayat', 'local', v_india_id, v_state_id, 'Madhya Pradesh', '2025-01-15', '2025-02-28', 'announced', 23000, 'MP Panchayat elections at all three tiers.', v_source_id, 'MP-PAN-2025')
  ON CONFLICT DO NOTHING;

  -- Karnataka Gram Panchayat
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'KA' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Karnataka Gram Panchayat Election 2025', 'gram_sabha', 'local', v_india_id, v_state_id, 'Karnataka', '2025-12-01', '2025-12-31', 'announced', 6000, 'Karnataka Gram Panchayat elections.', v_source_id, 'KA-GP-2025')
  ON CONFLICT DO NOTHING;

  -- Gujarat Panchayat
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'GJ' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Gujarat Gram Panchayat Election 2026', 'gram_sabha', 'local', v_india_id, v_state_id, 'Gujarat', '2026-01-01', '2026-02-28', 'announced', 14000, 'Gujarat Gram Panchayat elections.', v_source_id, 'GJ-GP-2026')
  ON CONFLICT DO NOTHING;

  -- Rajasthan Panchayat
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'RJ' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Rajasthan Panchayat Samiti Election 2025', 'block_council', 'local', v_india_id, v_state_id, 'Rajasthan', '2025-08-01', '2025-09-30', 'announced', 9900, 'Rajasthan Panchayat Samiti (block level) elections.', v_source_id, 'RJ-PS-2025')
  ON CONFLICT DO NOTHING;

  -- Maharashtra Zilla Parishad
  SELECT id INTO v_state_id FROM states_provinces WHERE code = 'MH' AND country_id = v_india_id LIMIT 1;
  INSERT INTO elections (name, election_type, election_level, country_id, state_id, state, start_date, end_date, status, total_seats, description, data_source_id, source_reference)
  VALUES ('Maharashtra Zilla Parishad Election 2025', 'zilla_parishad', 'local', v_india_id, v_state_id, 'Maharashtra', '2025-03-01', '2025-04-30', 'announced', 2000, 'Maharashtra Zilla Parishad (district level) elections.', v_source_id, 'MH-ZP-2025')
  ON CONFLICT DO NOTHING;

END $$;

-- Update election statistics
SELECT COUNT(*) as total_elections FROM elections;
SELECT election_level, COUNT(*) as count FROM elections GROUP BY election_level ORDER BY count DESC;
SELECT status, COUNT(*) as count FROM elections GROUP BY status ORDER BY count DESC;
