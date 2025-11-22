-- Migration: Vote Pattern Analysis (Multi-Party System) - FIXED
-- Description: Detect partisan bias, coordinated voting, and vote manipulation for India's multi-party democracy
-- Date: 2025-11-23
-- FIX: Uses promises.politician_party instead of separate politicians table

-- Add politician_party column to promises table
ALTER TABLE promises ADD COLUMN IF NOT EXISTS politician_party VARCHAR(200);

-- Create vote_history table (detailed voting records)
CREATE TABLE IF NOT EXISTS vote_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
  vote_type VARCHAR(20) NOT NULL, -- 'upvote' or 'downvote'
  promise_id UUID, -- Denormalized for faster queries
  politician_name VARCHAR(200), -- Denormalized for faster queries
  politician_party VARCHAR(200), -- Denormalized for faster queries
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, verification_id) -- One vote per user per verification
);

-- Create user_party_bias table (tracks voting patterns per party)
CREATE TABLE IF NOT EXISTS user_party_bias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  party_name VARCHAR(200) NOT NULL,
  upvotes_count INTEGER DEFAULT 0,
  downvotes_count INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  bias_score DECIMAL(3,2) DEFAULT 0.00, -- -1 (always downvote) to +1 (always upvote)
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, party_name)
);

-- Create coordinated_voting_groups table (suspected vote brigading)
CREATE TABLE IF NOT EXISTS coordinated_voting_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_members UUID[] NOT NULL, -- Array of user IDs
  verification_ids UUID[] NOT NULL, -- Verifications they voted on together
  vote_type VARCHAR(20), -- 'upvote' or 'downvote'
  coordination_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00
  time_window_minutes INTEGER, -- How quickly they all voted
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vote_history_user_id ON vote_history(user_id);
CREATE INDEX IF NOT EXISTS idx_vote_history_verification_id ON vote_history(verification_id);
CREATE INDEX IF NOT EXISTS idx_vote_history_politician_party ON vote_history(politician_party);
CREATE INDEX IF NOT EXISTS idx_vote_history_created_at ON vote_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_party_bias_user_id ON user_party_bias(user_id);
CREATE INDEX IF NOT EXISTS idx_user_party_bias_party_name ON user_party_bias(party_name);
CREATE INDEX IF NOT EXISTS idx_user_party_bias_bias_score ON user_party_bias(bias_score);
CREATE INDEX IF NOT EXISTS idx_coordinated_voting_detected_at ON coordinated_voting_groups(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_promises_politician_party ON promises(politician_party);

-- Enable RLS
ALTER TABLE vote_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_party_bias ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinated_voting_groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Vote history viewable by everyone" ON vote_history;
DROP POLICY IF EXISTS "System can insert vote history" ON vote_history;
DROP POLICY IF EXISTS "Party bias viewable by everyone" ON user_party_bias;
DROP POLICY IF EXISTS "System can manage party bias" ON user_party_bias;
DROP POLICY IF EXISTS "Admins can view coordinated voting groups" ON coordinated_voting_groups;
DROP POLICY IF EXISTS "System can create coordinated voting groups" ON coordinated_voting_groups;

-- RLS Policies: Vote history is public (transparency)
CREATE POLICY "Vote history viewable by everyone" ON vote_history
  FOR SELECT USING (true);

-- RLS Policies: System can insert vote history
CREATE POLICY "System can insert vote history" ON vote_history
  FOR INSERT WITH CHECK (true);

-- RLS Policies: Party bias is public (transparency)
CREATE POLICY "Party bias viewable by everyone" ON user_party_bias
  FOR SELECT USING (true);

-- RLS Policies: System can manage party bias
CREATE POLICY "System can manage party bias" ON user_party_bias
  FOR ALL USING (true);

-- RLS Policies: Only admins can view coordinated voting groups
CREATE POLICY "Admins can view coordinated voting groups" ON coordinated_voting_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- RLS Policies: System can create coordinated voting groups
CREATE POLICY "System can create coordinated voting groups" ON coordinated_voting_groups
  FOR INSERT WITH CHECK (true);

-- Trigger Function: Record vote in history when user votes
CREATE OR REPLACE FUNCTION record_vote_in_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  promise_record RECORD;
BEGIN
  -- Get promise info from the verification
  SELECT
    p.id,
    p.politician_name,
    p.politician_party
  INTO promise_record
  FROM verifications v
  JOIN promises p ON v.promise_id = p.id
  WHERE v.id = NEW.verification_id;

  -- Insert into vote history
  INSERT INTO vote_history (
    user_id,
    verification_id,
    vote_type,
    promise_id,
    politician_name,
    politician_party,
    created_at
  )
  VALUES (
    NEW.user_id,
    NEW.verification_id,
    NEW.vote_type::TEXT,
    promise_record.id,
    promise_record.politician_name,
    promise_record.politician_party,
    NEW.created_at
  )
  ON CONFLICT (user_id, verification_id) DO UPDATE
  SET vote_type = EXCLUDED.vote_type,
      created_at = EXCLUDED.created_at;

  RETURN NEW;
END;
$$;

-- Create trigger on votes table
DROP TRIGGER IF EXISTS trigger_record_vote_history ON votes;
CREATE TRIGGER trigger_record_vote_history
  AFTER INSERT OR UPDATE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION record_vote_in_history();

-- Function: Calculate user party bias
CREATE OR REPLACE FUNCTION calculate_user_party_bias(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  party_record RECORD;
  upvote_count INTEGER;
  downvote_count INTEGER;
  total_count INTEGER;
  calculated_bias DECIMAL(3,2);
BEGIN
  -- For each party the user has voted on
  FOR party_record IN
    SELECT DISTINCT politician_party
    FROM vote_history
    WHERE user_id = target_user_id
    AND politician_party IS NOT NULL
    AND politician_party != ''
  LOOP
    -- Count upvotes and downvotes for this party
    SELECT
      COUNT(*) FILTER (WHERE vote_type = 'upvote') as upvotes,
      COUNT(*) FILTER (WHERE vote_type = 'downvote') as downvotes,
      COUNT(*) as total
    INTO upvote_count, downvote_count, total_count
    FROM vote_history
    WHERE user_id = target_user_id
    AND politician_party = party_record.politician_party;

    -- Calculate bias score: -1 (always downvote) to +1 (always upvote)
    IF total_count > 0 THEN
      calculated_bias := ((upvote_count::DECIMAL - downvote_count::DECIMAL) / total_count);
    ELSE
      calculated_bias := 0.00;
    END IF;

    -- Upsert party bias record
    INSERT INTO user_party_bias (
      user_id,
      party_name,
      upvotes_count,
      downvotes_count,
      total_votes,
      bias_score,
      last_updated
    )
    VALUES (
      target_user_id,
      party_record.politician_party,
      upvote_count,
      downvote_count,
      total_count,
      calculated_bias,
      NOW()
    )
    ON CONFLICT (user_id, party_name) DO UPDATE
    SET
      upvotes_count = EXCLUDED.upvotes_count,
      downvotes_count = EXCLUDED.downvotes_count,
      total_votes = EXCLUDED.total_votes,
      bias_score = EXCLUDED.bias_score,
      last_updated = EXCLUDED.last_updated;
  END LOOP;
END;
$$;

-- Function: Detect extreme partisan bias
CREATE OR REPLACE FUNCTION detect_extreme_partisan_bias()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bias_record RECORD;
BEGIN
  -- Find users with extreme bias (>0.8 or <-0.8) and enough votes (>10)
  FOR bias_record IN
    SELECT
      user_id,
      party_name,
      bias_score,
      total_votes
    FROM user_party_bias
    WHERE total_votes >= 10
    AND (bias_score > 0.80 OR bias_score < -0.80)
  LOOP
    -- Create fraud flag if not already flagged
    INSERT INTO fraud_flags (
      flag_type,
      target_type,
      target_id,
      severity,
      confidence_score,
      details
    )
    SELECT
      'coordinated_voting',
      'user',
      bias_record.user_id,
      CASE
        WHEN ABS(bias_record.bias_score) > 0.95 AND bias_record.total_votes > 50 THEN 'high'
        WHEN ABS(bias_record.bias_score) > 0.90 THEN 'medium'
        ELSE 'low'
      END,
      ABS(bias_record.bias_score),
      jsonb_build_object(
        'party_name', bias_record.party_name,
        'bias_score', bias_record.bias_score,
        'total_votes', bias_record.total_votes,
        'detection_reason', 'Extreme partisan bias detected for ' || bias_record.party_name
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM fraud_flags
      WHERE target_type = 'user'
      AND target_id = bias_record.user_id
      AND flag_type = 'coordinated_voting'
      AND status = 'pending'
      AND created_at > NOW() - INTERVAL '7 days'
      AND details->>'party_name' = bias_record.party_name
    );
  END LOOP;
END;
$$;

-- Function: Detect coordinated voting (vote brigading)
CREATE OR REPLACE FUNCTION detect_coordinated_voting()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  verification_record RECORD;
  voter_ids UUID[];
  time_spread INTERVAL;
  coordination_score DECIMAL(3,2);
BEGIN
  -- Find verifications with 5+ votes in the last 24 hours
  FOR verification_record IN
    SELECT
      verification_id,
      vote_type,
      array_agg(user_id) as voters,
      COUNT(*) as vote_count,
      MAX(created_at) - MIN(created_at) as time_spread_interval
    FROM vote_history
    WHERE created_at > NOW() - INTERVAL '24 hours'
    GROUP BY verification_id, vote_type
    HAVING COUNT(*) >= 5
  LOOP
    voter_ids := verification_record.voters;
    time_spread := verification_record.time_spread_interval;

    -- Calculate coordination score (faster voting = higher score)
    IF EXTRACT(EPOCH FROM time_spread) < 300 THEN -- Less than 5 minutes
      coordination_score := 0.95;
    ELSIF EXTRACT(EPOCH FROM time_spread) < 1800 THEN -- Less than 30 minutes
      coordination_score := 0.80;
    ELSIF EXTRACT(EPOCH FROM time_spread) < 3600 THEN -- Less than 1 hour
      coordination_score := 0.65;
    ELSE
      coordination_score := 0.50;
    END IF;

    -- Only flag if coordination score is high enough
    IF coordination_score >= 0.65 THEN
      -- Insert coordinated voting group
      INSERT INTO coordinated_voting_groups (
        group_members,
        verification_ids,
        vote_type,
        coordination_score,
        time_window_minutes,
        detected_at
      )
      VALUES (
        voter_ids,
        ARRAY[verification_record.verification_id],
        verification_record.vote_type,
        coordination_score,
        EXTRACT(EPOCH FROM time_spread)::INTEGER / 60,
        NOW()
      );

      -- Also create fraud flag
      INSERT INTO fraud_flags (
        flag_type,
        target_type,
        target_id,
        severity,
        confidence_score,
        details
      )
      SELECT
        'coordinated_voting',
        'verification',
        verification_record.verification_id,
        CASE
          WHEN coordination_score > 0.90 THEN 'high'
          WHEN coordination_score > 0.75 THEN 'medium'
          ELSE 'low'
        END,
        coordination_score,
        jsonb_build_object(
          'voter_count', verification_record.vote_count,
          'time_spread_minutes', EXTRACT(EPOCH FROM time_spread)::INTEGER / 60,
          'vote_type', verification_record.vote_type,
          'detection_reason', 'Coordinated voting detected'
        )
      WHERE NOT EXISTS (
        SELECT 1 FROM fraud_flags
        WHERE target_type = 'verification'
        AND target_id = verification_record.verification_id
        AND flag_type = 'coordinated_voting'
        AND status = 'pending'
      );
    END IF;
  END LOOP;
END;
$$;

-- Function: Run all vote pattern analysis
CREATE OR REPLACE FUNCTION run_vote_pattern_analysis()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Calculate bias for all active users
  FOR user_record IN
    SELECT DISTINCT user_id
    FROM vote_history
    WHERE created_at > NOW() - INTERVAL '30 days'
  LOOP
    PERFORM calculate_user_party_bias(user_record.user_id);
  END LOOP;

  -- Detect extreme partisan bias
  PERFORM detect_extreme_partisan_bias();

  -- Detect coordinated voting
  PERFORM detect_coordinated_voting();

  RAISE NOTICE 'Vote pattern analysis completed at %', NOW();
END;
$$;

-- Comments
COMMENT ON COLUMN promises.politician_party IS 'Political party of the politician (BJP, Congress, AAP, etc.)';
COMMENT ON TABLE vote_history IS 'Detailed record of all votes for pattern analysis';
COMMENT ON TABLE user_party_bias IS 'Tracks user voting patterns per political party';
COMMENT ON TABLE coordinated_voting_groups IS 'Suspected vote brigading groups';
COMMENT ON FUNCTION record_vote_in_history() IS 'Trigger to record votes in history table';
COMMENT ON FUNCTION calculate_user_party_bias(UUID) IS 'Calculate user bias toward specific parties';
COMMENT ON FUNCTION detect_extreme_partisan_bias() IS 'Detect users with extreme party bias (>0.8 or <-0.8)';
COMMENT ON FUNCTION detect_coordinated_voting() IS 'Detect groups voting together suspiciously quickly';
COMMENT ON FUNCTION run_vote_pattern_analysis() IS 'Run all vote pattern analysis algorithms';
