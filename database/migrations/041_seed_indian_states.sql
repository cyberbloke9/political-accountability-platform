-- =====================================================
-- MIGRATION 041: SEED INDIAN STATES DATA
-- All 28 states and 8 Union Territories of India
-- =====================================================

-- =====================================================
-- INSERT INDIAN STATES
-- =====================================================

-- First, get India's country ID
DO $$
DECLARE
  india_id UUID;
BEGIN
  SELECT id INTO india_id FROM countries WHERE code = 'IND';

  IF india_id IS NULL THEN
    RAISE EXCEPTION 'India not found in countries table. Run migration 040 first.';
  END IF;

  -- Insert/Update all states
  INSERT INTO states_provinces (country_id, name, code, local_name, state_type, capital, largest_city, population, population_year, assembly_seats, official_languages)
  VALUES
    -- 28 States
    (india_id, 'Andhra Pradesh', 'AP', 'ఆంధ్ర ప్రదేశ్', 'state', 'Amaravati', 'Visakhapatnam', 53903393, 2024, 175, ARRAY['Telugu']),
    (india_id, 'Arunachal Pradesh', 'AR', 'अरुणाचल प्रदेश', 'state', 'Itanagar', 'Itanagar', 1570458, 2024, 60, ARRAY['English']),
    (india_id, 'Assam', 'AS', 'অসম', 'state', 'Dispur', 'Guwahati', 35998752, 2024, 126, ARRAY['Assamese', 'Bengali', 'Bodo']),
    (india_id, 'Bihar', 'BR', 'बिहार', 'state', 'Patna', 'Patna', 127721459, 2024, 243, ARRAY['Hindi']),
    (india_id, 'Chhattisgarh', 'CG', 'छत्तीसगढ़', 'state', 'Naya Raipur', 'Raipur', 29436231, 2024, 90, ARRAY['Hindi', 'Chhattisgarhi']),
    (india_id, 'Goa', 'GA', 'गोंय', 'state', 'Panaji', 'Vasco da Gama', 1586250, 2024, 40, ARRAY['Konkani']),
    (india_id, 'Gujarat', 'GJ', 'ગુજરાત', 'state', 'Gandhinagar', 'Ahmedabad', 70400153, 2024, 182, ARRAY['Gujarati']),
    (india_id, 'Haryana', 'HR', 'हरियाणा', 'state', 'Chandigarh', 'Faridabad', 28900667, 2024, 90, ARRAY['Hindi']),
    (india_id, 'Himachal Pradesh', 'HP', 'हिमाचल प्रदेश', 'state', 'Shimla', 'Shimla', 7503010, 2024, 68, ARRAY['Hindi']),
    (india_id, 'Jharkhand', 'JH', 'झारखण्ड', 'state', 'Ranchi', 'Jamshedpur', 38593948, 2024, 81, ARRAY['Hindi']),
    (india_id, 'Karnataka', 'KA', 'ಕರ್ನಾಟಕ', 'state', 'Bengaluru', 'Bengaluru', 67562686, 2024, 224, ARRAY['Kannada']),
    (india_id, 'Kerala', 'KL', 'കേരളം', 'state', 'Thiruvananthapuram', 'Thiruvananthapuram', 35699443, 2024, 140, ARRAY['Malayalam']),
    (india_id, 'Madhya Pradesh', 'MP', 'मध्य प्रदेश', 'state', 'Bhopal', 'Indore', 85358965, 2024, 230, ARRAY['Hindi']),
    (india_id, 'Maharashtra', 'MH', 'महाराष्ट्र', 'state', 'Mumbai', 'Mumbai', 126014470, 2024, 288, ARRAY['Marathi']),
    (india_id, 'Manipur', 'MN', 'মণিপুর', 'state', 'Imphal', 'Imphal', 3091545, 2024, 60, ARRAY['Meitei', 'English']),
    (india_id, 'Meghalaya', 'ML', 'मेघालय', 'state', 'Shillong', 'Shillong', 3366710, 2024, 60, ARRAY['English', 'Khasi', 'Garo']),
    (india_id, 'Mizoram', 'MZ', 'Mizoram', 'state', 'Aizawl', 'Aizawl', 1239244, 2024, 40, ARRAY['Mizo', 'English']),
    (india_id, 'Nagaland', 'NL', 'Nagaland', 'state', 'Kohima', 'Dimapur', 2189297, 2024, 60, ARRAY['English']),
    (india_id, 'Odisha', 'OD', 'ଓଡ଼ିଶା', 'state', 'Bhubaneswar', 'Bhubaneswar', 46356334, 2024, 147, ARRAY['Odia']),
    (india_id, 'Punjab', 'PB', 'ਪੰਜਾਬ', 'state', 'Chandigarh', 'Ludhiana', 30956600, 2024, 117, ARRAY['Punjabi']),
    (india_id, 'Rajasthan', 'RJ', 'राजस्थान', 'state', 'Jaipur', 'Jaipur', 79502477, 2024, 200, ARRAY['Hindi']),
    (india_id, 'Sikkim', 'SK', 'सिक्किम', 'state', 'Gangtok', 'Gangtok', 690251, 2024, 32, ARRAY['English', 'Nepali', 'Sikkimese']),
    (india_id, 'Tamil Nadu', 'TN', 'தமிழ்நாடு', 'state', 'Chennai', 'Chennai', 77841267, 2024, 234, ARRAY['Tamil']),
    (india_id, 'Telangana', 'TG', 'తెలంగాణ', 'state', 'Hyderabad', 'Hyderabad', 39362732, 2024, 119, ARRAY['Telugu', 'Urdu']),
    (india_id, 'Tripura', 'TR', 'ত্রিপুরা', 'state', 'Agartala', 'Agartala', 4169794, 2024, 60, ARRAY['Bengali', 'Kokborok']),
    (india_id, 'Uttar Pradesh', 'UP', 'उत्तर प्रदेश', 'state', 'Lucknow', 'Lucknow', 235687204, 2024, 403, ARRAY['Hindi']),
    (india_id, 'Uttarakhand', 'UK', 'उत्तराखण्ड', 'state', 'Dehradun', 'Dehradun', 11250858, 2024, 70, ARRAY['Hindi', 'Sanskrit']),
    (india_id, 'West Bengal', 'WB', 'পশ্চিমবঙ্গ', 'state', 'Kolkata', 'Kolkata', 99609303, 2024, 294, ARRAY['Bengali']),

    -- 8 Union Territories
    (india_id, 'Andaman and Nicobar Islands', 'AN', 'अंडमान और निकोबार द्वीपसमूह', 'union_territory', 'Port Blair', 'Port Blair', 417036, 2024, 0, ARRAY['Hindi', 'English']),
    (india_id, 'Chandigarh', 'CH', 'चंडीगढ़', 'union_territory', 'Chandigarh', 'Chandigarh', 1179089, 2024, 0, ARRAY['Hindi', 'English', 'Punjabi']),
    (india_id, 'Dadra and Nagar Haveli and Daman and Diu', 'DD', 'दादरा और नगर हवेली और दमन और दीव', 'union_territory', 'Daman', 'Silvassa', 615724, 2024, 0, ARRAY['Hindi', 'Gujarati', 'Marathi']),
    (india_id, 'Delhi', 'DL', 'दिल्ली', 'union_territory', 'New Delhi', 'Delhi', 18710922, 2024, 70, ARRAY['Hindi', 'English', 'Punjabi', 'Urdu']),
    (india_id, 'Jammu and Kashmir', 'JK', 'जम्मू और कश्मीर', 'union_territory', 'Srinagar (S), Jammu (W)', 'Srinagar', 14999397, 2024, 90, ARRAY['Urdu', 'Hindi', 'Kashmiri', 'Dogri']),
    (india_id, 'Ladakh', 'LA', 'ལ་དྭགས་', 'union_territory', 'Leh', 'Leh', 289023, 2024, 0, ARRAY['Hindi', 'Ladakhi', 'English']),
    (india_id, 'Lakshadweep', 'LD', 'ലക്ഷദ്വീപ്', 'union_territory', 'Kavaratti', 'Kavaratti', 68863, 2024, 0, ARRAY['Malayalam', 'English']),
    (india_id, 'Puducherry', 'PY', 'புதுச்சேரி', 'union_territory', 'Puducherry', 'Puducherry', 1413542, 2024, 33, ARRAY['Tamil', 'French', 'English'])

  ON CONFLICT (country_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    local_name = EXCLUDED.local_name,
    state_type = EXCLUDED.state_type,
    capital = EXCLUDED.capital,
    largest_city = EXCLUDED.largest_city,
    population = EXCLUDED.population,
    population_year = EXCLUDED.population_year,
    assembly_seats = EXCLUDED.assembly_seats,
    official_languages = EXCLUDED.official_languages,
    updated_at = NOW();

END $$;

-- =====================================================
-- LINK EXISTING DATA TO STATE IDs
-- =====================================================

-- Update existing elections to link to states
UPDATE elections e
SET state_id = sp.id
FROM states_provinces sp
JOIN countries c ON sp.country_id = c.id
WHERE c.code = 'IND'
  AND e.state IS NOT NULL
  AND e.state_id IS NULL
  AND (
    LOWER(e.state) = LOWER(sp.name)
    OR LOWER(e.state) = LOWER(sp.code)
  );

-- Update existing constituencies to link to states
UPDATE constituencies con
SET state_id = sp.id
FROM states_provinces sp
JOIN countries c ON sp.country_id = c.id
WHERE c.code = 'IND'
  AND con.state IS NOT NULL
  AND con.state_id IS NULL
  AND (
    LOWER(con.state) = LOWER(sp.name)
    OR LOWER(con.state) = LOWER(sp.code)
  );

-- Update existing politicians to link to states
UPDATE politicians pol
SET state_id = sp.id
FROM states_provinces sp
JOIN countries c ON sp.country_id = c.id
WHERE c.code = 'IND'
  AND pol.state IS NOT NULL
  AND pol.state_id IS NULL
  AND (
    LOWER(pol.state) = LOWER(sp.name)
    OR LOWER(pol.state) = LOWER(sp.code)
  );

-- =====================================================
-- HELPER FUNCTION: GET INDIAN STATES
-- =====================================================

CREATE OR REPLACE FUNCTION get_indian_states(p_include_uts BOOLEAN DEFAULT true)
RETURNS TABLE (
  id UUID,
  name TEXT,
  code TEXT,
  local_name TEXT,
  state_type TEXT,
  capital TEXT,
  population BIGINT,
  assembly_seats INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.name::TEXT,
    sp.code::TEXT,
    sp.local_name::TEXT,
    sp.state_type::TEXT,
    sp.capital::TEXT,
    sp.population,
    sp.assembly_seats
  FROM states_provinces sp
  JOIN countries c ON sp.country_id = c.id
  WHERE c.code = 'IND'
    AND sp.is_active = true
    AND (p_include_uts OR sp.state_type = 'state')
  ORDER BY sp.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_indian_states(BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_indian_states(BOOLEAN) TO anon;
