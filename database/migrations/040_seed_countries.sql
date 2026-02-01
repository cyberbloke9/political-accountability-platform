-- =====================================================
-- MIGRATION 040: SEED COUNTRIES DATA
-- Initial seed of major democratic countries
-- =====================================================

-- =====================================================
-- INSERT COUNTRIES
-- Focus on democracies with regular elections
-- =====================================================

INSERT INTO countries (name, code, code_2, continent, government_type, capital, population, flag_emoji, election_system, voting_age, has_compulsory_voting)
VALUES
  -- Asia
  ('India', 'IND', 'IN', 'Asia', 'Parliamentary Republic', 'New Delhi', 1428627663, '🇮🇳', 'parliamentary', 18, false),
  ('Japan', 'JPN', 'JP', 'Asia', 'Constitutional Monarchy', 'Tokyo', 125124989, '🇯🇵', 'parliamentary', 18, false),
  ('South Korea', 'KOR', 'KR', 'Asia', 'Presidential Republic', 'Seoul', 51784059, '🇰🇷', 'presidential', 18, false),
  ('Indonesia', 'IDN', 'ID', 'Asia', 'Presidential Republic', 'Jakarta', 277534122, '🇮🇩', 'presidential', 17, false),
  ('Philippines', 'PHL', 'PH', 'Asia', 'Presidential Republic', 'Manila', 117337368, '🇵🇭', 'presidential', 18, false),
  ('Malaysia', 'MYS', 'MY', 'Asia', 'Constitutional Monarchy', 'Kuala Lumpur', 34308525, '🇲🇾', 'parliamentary', 18, false),
  ('Thailand', 'THA', 'TH', 'Asia', 'Constitutional Monarchy', 'Bangkok', 71801279, '🇹🇭', 'parliamentary', 18, true),
  ('Israel', 'ISR', 'IL', 'Asia', 'Parliamentary Republic', 'Jerusalem', 9364000, '🇮🇱', 'parliamentary', 18, false),
  ('Taiwan', 'TWN', 'TW', 'Asia', 'Semi-Presidential Republic', 'Taipei', 23894394, '🇹🇼', 'mixed', 20, false),
  ('Singapore', 'SGP', 'SG', 'Asia', 'Parliamentary Republic', 'Singapore', 5453600, '🇸🇬', 'parliamentary', 21, true),
  ('Bangladesh', 'BGD', 'BD', 'Asia', 'Parliamentary Republic', 'Dhaka', 172954319, '🇧🇩', 'parliamentary', 18, false),
  ('Pakistan', 'PAK', 'PK', 'Asia', 'Parliamentary Republic', 'Islamabad', 240485658, '🇵🇰', 'parliamentary', 18, false),
  ('Sri Lanka', 'LKA', 'LK', 'Asia', 'Semi-Presidential Republic', 'Sri Jayawardenepura Kotte', 21893579, '🇱🇰', 'mixed', 18, false),
  ('Nepal', 'NPL', 'NP', 'Asia', 'Parliamentary Republic', 'Kathmandu', 30896590, '🇳🇵', 'parliamentary', 18, false),

  -- North America
  ('United States', 'USA', 'US', 'North America', 'Presidential Republic', 'Washington, D.C.', 339996563, '🇺🇸', 'presidential', 18, false),
  ('Canada', 'CAN', 'CA', 'North America', 'Parliamentary Monarchy', 'Ottawa', 40097761, '🇨🇦', 'parliamentary', 18, false),
  ('Mexico', 'MEX', 'MX', 'North America', 'Presidential Republic', 'Mexico City', 128455567, '🇲🇽', 'presidential', 18, true),

  -- Europe
  ('United Kingdom', 'GBR', 'GB', 'Europe', 'Constitutional Monarchy', 'London', 67736802, '🇬🇧', 'parliamentary', 18, false),
  ('Germany', 'DEU', 'DE', 'Europe', 'Parliamentary Republic', 'Berlin', 84482267, '🇩🇪', 'parliamentary', 18, false),
  ('France', 'FRA', 'FR', 'Europe', 'Semi-Presidential Republic', 'Paris', 64756584, '🇫🇷', 'mixed', 18, false),
  ('Italy', 'ITA', 'IT', 'Europe', 'Parliamentary Republic', 'Rome', 58870762, '🇮🇹', 'parliamentary', 18, false),
  ('Spain', 'ESP', 'ES', 'Europe', 'Parliamentary Monarchy', 'Madrid', 47519628, '🇪🇸', 'parliamentary', 18, false),
  ('Poland', 'POL', 'PL', 'Europe', 'Parliamentary Republic', 'Warsaw', 41026067, '🇵🇱', 'mixed', 18, false),
  ('Netherlands', 'NLD', 'NL', 'Europe', 'Constitutional Monarchy', 'Amsterdam', 17618299, '🇳🇱', 'parliamentary', 18, false),
  ('Belgium', 'BEL', 'BE', 'Europe', 'Constitutional Monarchy', 'Brussels', 11686140, '🇧🇪', 'parliamentary', 18, true),
  ('Sweden', 'SWE', 'SE', 'Europe', 'Constitutional Monarchy', 'Stockholm', 10551707, '🇸🇪', 'parliamentary', 18, false),
  ('Norway', 'NOR', 'NO', 'Europe', 'Constitutional Monarchy', 'Oslo', 5474360, '🇳🇴', 'parliamentary', 18, false),
  ('Denmark', 'DNK', 'DK', 'Europe', 'Constitutional Monarchy', 'Copenhagen', 5910913, '🇩🇰', 'parliamentary', 18, false),
  ('Finland', 'FIN', 'FI', 'Europe', 'Parliamentary Republic', 'Helsinki', 5545475, '🇫🇮', 'parliamentary', 18, false),
  ('Ireland', 'IRL', 'IE', 'Europe', 'Parliamentary Republic', 'Dublin', 5056935, '🇮🇪', 'parliamentary', 18, false),
  ('Portugal', 'PRT', 'PT', 'Europe', 'Semi-Presidential Republic', 'Lisbon', 10247605, '🇵🇹', 'mixed', 18, false),
  ('Austria', 'AUT', 'AT', 'Europe', 'Parliamentary Republic', 'Vienna', 9104772, '🇦🇹', 'parliamentary', 16, false),
  ('Switzerland', 'CHE', 'CH', 'Europe', 'Federal Republic', 'Bern', 8796669, '🇨🇭', 'mixed', 18, false),
  ('Greece', 'GRC', 'GR', 'Europe', 'Parliamentary Republic', 'Athens', 10341277, '🇬🇷', 'parliamentary', 17, true),
  ('Czech Republic', 'CZE', 'CZ', 'Europe', 'Parliamentary Republic', 'Prague', 10827529, '🇨🇿', 'parliamentary', 18, false),
  ('Romania', 'ROU', 'RO', 'Europe', 'Semi-Presidential Republic', 'Bucharest', 19051562, '🇷🇴', 'mixed', 18, false),
  ('Hungary', 'HUN', 'HU', 'Europe', 'Parliamentary Republic', 'Budapest', 9597085, '🇭🇺', 'parliamentary', 18, false),
  ('Ukraine', 'UKR', 'UA', 'Europe', 'Semi-Presidential Republic', 'Kyiv', 37000000, '🇺🇦', 'mixed', 18, false),

  -- South America
  ('Brazil', 'BRA', 'BR', 'South America', 'Presidential Republic', 'Brasília', 216422446, '🇧🇷', 'presidential', 16, true),
  ('Argentina', 'ARG', 'AR', 'South America', 'Presidential Republic', 'Buenos Aires', 45773884, '🇦🇷', 'presidential', 16, true),
  ('Colombia', 'COL', 'CO', 'South America', 'Presidential Republic', 'Bogotá', 52085168, '🇨🇴', 'presidential', 18, false),
  ('Chile', 'CHL', 'CL', 'South America', 'Presidential Republic', 'Santiago', 19629590, '🇨🇱', 'presidential', 18, true),
  ('Peru', 'PER', 'PE', 'South America', 'Presidential Republic', 'Lima', 34352719, '🇵🇪', 'presidential', 18, true),
  ('Uruguay', 'URY', 'UY', 'South America', 'Presidential Republic', 'Montevideo', 3423108, '🇺🇾', 'presidential', 18, true),
  ('Ecuador', 'ECU', 'EC', 'South America', 'Presidential Republic', 'Quito', 18190484, '🇪🇨', 'presidential', 16, true),

  -- Oceania
  ('Australia', 'AUS', 'AU', 'Oceania', 'Parliamentary Monarchy', 'Canberra', 26461166, '🇦🇺', 'parliamentary', 18, true),
  ('New Zealand', 'NZL', 'NZ', 'Oceania', 'Parliamentary Monarchy', 'Wellington', 5185288, '🇳🇿', 'parliamentary', 18, false),

  -- Africa
  ('South Africa', 'ZAF', 'ZA', 'Africa', 'Parliamentary Republic', 'Pretoria', 60414495, '🇿🇦', 'parliamentary', 18, false),
  ('Nigeria', 'NGA', 'NG', 'Africa', 'Presidential Republic', 'Abuja', 223804632, '🇳🇬', 'presidential', 18, false),
  ('Kenya', 'KEN', 'KE', 'Africa', 'Presidential Republic', 'Nairobi', 55100586, '🇰🇪', 'presidential', 18, false),
  ('Ghana', 'GHA', 'GH', 'Africa', 'Presidential Republic', 'Accra', 34121985, '🇬🇭', 'presidential', 18, false),
  ('Senegal', 'SEN', 'SN', 'Africa', 'Presidential Republic', 'Dakar', 18032473, '🇸🇳', 'presidential', 18, false),
  ('Botswana', 'BWA', 'BW', 'Africa', 'Parliamentary Republic', 'Gaborone', 2675352, '🇧🇼', 'parliamentary', 18, false),
  ('Mauritius', 'MUS', 'MU', 'Africa', 'Parliamentary Republic', 'Port Louis', 1300557, '🇲🇺', 'parliamentary', 18, false),
  ('Tunisia', 'TUN', 'TN', 'Africa', 'Presidential Republic', 'Tunis', 12356117, '🇹🇳', 'presidential', 18, false)

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  continent = EXCLUDED.continent,
  government_type = EXCLUDED.government_type,
  capital = EXCLUDED.capital,
  population = EXCLUDED.population,
  flag_emoji = EXCLUDED.flag_emoji,
  election_system = EXCLUDED.election_system,
  voting_age = EXCLUDED.voting_age,
  has_compulsory_voting = EXCLUDED.has_compulsory_voting,
  updated_at = NOW();

-- =====================================================
-- LINK EXISTING ELECTIONS TO INDIA
-- =====================================================

-- Update existing elections to link to India
UPDATE elections
SET country_id = (SELECT id FROM countries WHERE code = 'IND')
WHERE country = 'India' AND country_id IS NULL;
