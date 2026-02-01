-- =====================================================
-- MIGRATION 039: ELECTION CALENDAR TABLE
-- Track election events and milestones
-- =====================================================

-- =====================================================
-- ELECTION CALENDAR TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS election_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Election reference
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,

  -- Event details
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'announcement',           -- Election announced
    'notification',           -- Official notification issued
    'nomination_start',       -- Nomination filing begins
    'nomination_end',         -- Nomination filing ends
    'scrutiny',               -- Nomination scrutiny
    'withdrawal_deadline',    -- Last date to withdraw
    'campaign_start',         -- Campaigning begins
    'campaign_end',           -- Campaigning ends (silence period)
    'polling_day',            -- Voting day
    'polling_phase',          -- Multi-phase polling
    'counting_day',           -- Vote counting
    'results_day',            -- Results announcement
    'oath_ceremony',          -- Winner swearing-in
    'recount',                -- Recount if any
    'by_poll_notification',   -- By-poll specific
    'model_code_start',       -- Model Code of Conduct begins
    'model_code_end'          -- Model Code of Conduct ends
  )),

  -- Timing
  event_date DATE NOT NULL,
  event_time TIME,                            -- Optional time for events
  event_end_date DATE,                        -- For multi-day events
  event_end_time TIME,

  -- For phased elections
  phase_number INTEGER,                       -- Phase 1, 2, 3, etc.
  total_phases INTEGER,                       -- Total number of phases

  -- Affected areas (for phased elections)
  constituencies_affected UUID[],             -- Array of constituency IDs
  states_affected UUID[],                     -- Array of state IDs
  districts_affected TEXT[],                  -- Array of district names

  -- Event details
  title VARCHAR(255),                         -- Custom title if needed
  description TEXT,
  venue VARCHAR(255),                         -- Location/venue if applicable

  -- Status
  is_tentative BOOLEAN DEFAULT false,         -- Date not yet confirmed
  is_completed BOOLEAN DEFAULT false,         -- Event has occurred
  was_postponed BOOLEAN DEFAULT false,
  original_date DATE,                         -- Original date if postponed

  -- Source
  source_url TEXT,
  official_notification_number VARCHAR(100),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_election_calendar_election ON election_calendar(election_id);
CREATE INDEX IF NOT EXISTS idx_election_calendar_date ON election_calendar(event_date);
CREATE INDEX IF NOT EXISTS idx_election_calendar_type ON election_calendar(event_type);
CREATE INDEX IF NOT EXISTS idx_election_calendar_phase ON election_calendar(phase_number);
CREATE INDEX IF NOT EXISTS idx_election_calendar_completed ON election_calendar(is_completed);

-- GIN indexes for array columns
CREATE INDEX IF NOT EXISTS idx_election_calendar_constituencies ON election_calendar USING gin(constituencies_affected);
CREATE INDEX IF NOT EXISTS idx_election_calendar_states ON election_calendar USING gin(states_affected);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE election_calendar ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view election calendar" ON election_calendar
  FOR SELECT USING (true);

-- =====================================================
-- UPDATE TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_election_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_election_calendar_updated_at
  BEFORE UPDATE ON election_calendar
  FOR EACH ROW
  EXECUTE FUNCTION update_election_calendar_updated_at();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get upcoming election events
CREATE OR REPLACE FUNCTION get_upcoming_election_events(
  p_country_code VARCHAR(3) DEFAULT NULL,
  p_state_code VARCHAR(10) DEFAULT NULL,
  p_election_level VARCHAR(50) DEFAULT NULL,
  p_event_types TEXT[] DEFAULT NULL,
  p_days_ahead INTEGER DEFAULT 90,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  election_id UUID,
  election_name TEXT,
  election_type TEXT,
  election_level TEXT,
  event_type TEXT,
  event_date DATE,
  event_time TIME,
  phase_number INTEGER,
  title TEXT,
  description TEXT,
  is_tentative BOOLEAN,
  days_until INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.id,
    ec.election_id,
    e.name::TEXT as election_name,
    e.election_type::TEXT,
    e.election_level::TEXT,
    ec.event_type::TEXT,
    ec.event_date,
    ec.event_time,
    ec.phase_number,
    ec.title::TEXT,
    ec.description::TEXT,
    ec.is_tentative,
    (ec.event_date - CURRENT_DATE)::INTEGER as days_until
  FROM election_calendar ec
  JOIN elections e ON ec.election_id = e.id
  LEFT JOIN countries c ON e.country_id = c.id
  LEFT JOIN states_provinces sp ON e.state_id = sp.id
  WHERE ec.event_date >= CURRENT_DATE
    AND ec.event_date <= CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL
    AND ec.is_completed = false
    AND (p_country_code IS NULL OR c.code = UPPER(p_country_code) OR c.code_2 = UPPER(p_country_code))
    AND (p_state_code IS NULL OR sp.code = UPPER(p_state_code) OR e.state ILIKE '%' || p_state_code || '%')
    AND (p_election_level IS NULL OR e.election_level = p_election_level)
    AND (p_event_types IS NULL OR ec.event_type = ANY(p_event_types))
  ORDER BY ec.event_date ASC, ec.event_time ASC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get election calendar by election
CREATE OR REPLACE FUNCTION get_election_calendar(p_election_id UUID)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  event_date DATE,
  event_time TIME,
  event_end_date DATE,
  phase_number INTEGER,
  title TEXT,
  description TEXT,
  is_tentative BOOLEAN,
  is_completed BOOLEAN,
  was_postponed BOOLEAN,
  original_date DATE,
  constituencies_count INTEGER,
  states_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.id,
    ec.event_type::TEXT,
    ec.event_date,
    ec.event_time,
    ec.event_end_date,
    ec.phase_number,
    COALESCE(ec.title, initcap(replace(ec.event_type, '_', ' ')))::TEXT as title,
    ec.description::TEXT,
    ec.is_tentative,
    ec.is_completed,
    ec.was_postponed,
    ec.original_date,
    COALESCE(array_length(ec.constituencies_affected, 1), 0) as constituencies_count,
    COALESCE(array_length(ec.states_affected, 1), 0) as states_count
  FROM election_calendar ec
  WHERE ec.election_id = p_election_id
  ORDER BY ec.event_date ASC, ec.phase_number ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get election events by month (for calendar view)
CREATE OR REPLACE FUNCTION get_election_events_by_month(
  p_year INTEGER,
  p_month INTEGER,
  p_country_code VARCHAR(3) DEFAULT NULL,
  p_election_level VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  election_id UUID,
  election_name TEXT,
  event_type TEXT,
  event_date DATE,
  phase_number INTEGER,
  is_tentative BOOLEAN,
  election_level TEXT,
  state TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.id,
    ec.election_id,
    e.name::TEXT as election_name,
    ec.event_type::TEXT,
    ec.event_date,
    ec.phase_number,
    ec.is_tentative,
    e.election_level::TEXT,
    COALESCE(sp.name, e.state)::TEXT as state
  FROM election_calendar ec
  JOIN elections e ON ec.election_id = e.id
  LEFT JOIN countries c ON e.country_id = c.id
  LEFT JOIN states_provinces sp ON e.state_id = sp.id
  WHERE EXTRACT(YEAR FROM ec.event_date) = p_year
    AND EXTRACT(MONTH FROM ec.event_date) = p_month
    AND (p_country_code IS NULL OR c.code = UPPER(p_country_code) OR c.code_2 = UPPER(p_country_code))
    AND (p_election_level IS NULL OR e.election_level = p_election_level)
  ORDER BY ec.event_date ASC, ec.event_time ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get polling dates for phased elections
CREATE OR REPLACE FUNCTION get_polling_phases(p_election_id UUID)
RETURNS TABLE (
  phase_number INTEGER,
  polling_date DATE,
  polling_time TIME,
  constituencies_count INTEGER,
  states_count INTEGER,
  districts TEXT[],
  is_completed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.phase_number,
    ec.event_date as polling_date,
    ec.event_time as polling_time,
    COALESCE(array_length(ec.constituencies_affected, 1), 0) as constituencies_count,
    COALESCE(array_length(ec.states_affected, 1), 0) as states_count,
    ec.districts_affected as districts,
    ec.is_completed
  FROM election_calendar ec
  WHERE ec.election_id = p_election_id
    AND ec.event_type IN ('polling_day', 'polling_phase')
  ORDER BY ec.phase_number ASC NULLS LAST, ec.event_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get next important event for an election
CREATE OR REPLACE FUNCTION get_next_election_event(p_election_id UUID)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  event_date DATE,
  days_until INTEGER,
  title TEXT,
  is_tentative BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.id,
    ec.event_type::TEXT,
    ec.event_date,
    (ec.event_date - CURRENT_DATE)::INTEGER as days_until,
    COALESCE(ec.title, initcap(replace(ec.event_type, '_', ' ')))::TEXT as title,
    ec.is_tentative
  FROM election_calendar ec
  WHERE ec.election_id = p_election_id
    AND ec.event_date >= CURRENT_DATE
    AND ec.is_completed = false
  ORDER BY ec.event_date ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AUTO-CREATE CALENDAR FROM ELECTION DATES
-- =====================================================

CREATE OR REPLACE FUNCTION auto_create_election_calendar()
RETURNS TRIGGER AS $$
BEGIN
  -- Create basic calendar events from election dates
  IF NEW.announcement_date IS NOT NULL THEN
    INSERT INTO election_calendar (election_id, event_type, event_date, title)
    VALUES (NEW.id, 'announcement', NEW.announcement_date, 'Election Announced')
    ON CONFLICT DO NOTHING;
  END IF;

  IF NEW.nomination_start IS NOT NULL THEN
    INSERT INTO election_calendar (election_id, event_type, event_date, title)
    VALUES (NEW.id, 'nomination_start', NEW.nomination_start, 'Nomination Filing Begins')
    ON CONFLICT DO NOTHING;
  END IF;

  IF NEW.nomination_end IS NOT NULL THEN
    INSERT INTO election_calendar (election_id, event_type, event_date, title)
    VALUES (NEW.id, 'nomination_end', NEW.nomination_end, 'Nomination Filing Ends')
    ON CONFLICT DO NOTHING;
  END IF;

  IF NEW.polling_start IS NOT NULL THEN
    INSERT INTO election_calendar (election_id, event_type, event_date, title)
    VALUES (NEW.id, 'polling_day', NEW.polling_start,
      CASE
        WHEN NEW.polling_start = NEW.polling_end THEN 'Polling Day'
        ELSE 'Polling Begins'
      END
    )
    ON CONFLICT DO NOTHING;
  END IF;

  IF NEW.counting_date IS NOT NULL THEN
    INSERT INTO election_calendar (election_id, event_type, event_date, title)
    VALUES (NEW.id, 'counting_day', NEW.counting_date, 'Vote Counting')
    ON CONFLICT DO NOTHING;
  END IF;

  IF NEW.results_date IS NOT NULL THEN
    INSERT INTO election_calendar (election_id, event_type, event_date, title)
    VALUES (NEW.id, 'results_day', NEW.results_date, 'Results Announcement')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create calendar on election insert
CREATE TRIGGER trigger_auto_create_election_calendar
  AFTER INSERT ON elections
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_election_calendar();

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON election_calendar TO authenticated;
GRANT SELECT ON election_calendar TO anon;

GRANT EXECUTE ON FUNCTION get_upcoming_election_events(VARCHAR, VARCHAR, VARCHAR, TEXT[], INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_election_events(VARCHAR, VARCHAR, VARCHAR, TEXT[], INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_election_calendar(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_election_calendar(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_election_events_by_month(INTEGER, INTEGER, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_election_events_by_month(INTEGER, INTEGER, VARCHAR, VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION get_polling_phases(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_polling_phases(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_next_election_event(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_election_event(UUID) TO anon;
