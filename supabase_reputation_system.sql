-- Reputation Calculation System
-- This file contains SQL functions and triggers to automatically calculate and update citizen scores

-- Function to calculate a user's reputation score based on their verification votes
CREATE OR REPLACE FUNCTION calculate_user_reputation(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_upvotes INTEGER;
  total_downvotes INTEGER;
  approved_verifications INTEGER;
  reputation_score INTEGER;
BEGIN
  -- Count upvotes on user's verifications
  SELECT COALESCE(COUNT(*), 0)
  INTO total_upvotes
  FROM votes vo
  INNER JOIN verifications v ON vo.verification_id = v.id
  WHERE v.submitted_by = user_uuid AND vo.vote_type = 'upvote';

  -- Count downvotes on user's verifications
  SELECT COALESCE(COUNT(*), 0)
  INTO total_downvotes
  FROM votes vo
  INNER JOIN verifications v ON vo.verification_id = v.id
  WHERE v.submitted_by = user_uuid AND vo.vote_type = 'downvote';

  -- Count approved verifications (bonus points)
  SELECT COUNT(*)
  INTO approved_verifications
  FROM verifications v
  WHERE v.submitted_by = user_uuid AND v.status = 'approved';

  -- Calculate reputation score
  -- Formula: (upvotes * 10) - (downvotes * 5) + (approved verifications * 50)
  -- Base score starts at 100
  reputation_score := 100 + (total_upvotes * 10) - (total_downvotes * 5) + (approved_verifications * 50);

  -- Ensure score doesn't go below 0
  IF reputation_score < 0 THEN
    reputation_score := 0;
  END IF;

  RETURN reputation_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update a user's citizen score
CREATE OR REPLACE FUNCTION update_user_reputation(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  new_score INTEGER;
BEGIN
  -- Calculate the new reputation score
  new_score := calculate_user_reputation(user_uuid);

  -- Update the user's citizen_score
  UPDATE users
  SET citizen_score = new_score,
      updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update reputation when votes change
CREATE OR REPLACE FUNCTION trigger_update_reputation_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  verification_owner UUID;
BEGIN
  -- Get the owner of the verification
  SELECT submitted_by INTO verification_owner
  FROM verifications
  WHERE id = COALESCE(NEW.verification_id, OLD.verification_id);

  -- Update the reputation of the verification owner
  IF verification_owner IS NOT NULL THEN
    PERFORM update_user_reputation(verification_owner);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on votes table
DROP TRIGGER IF EXISTS votes_reputation_trigger ON votes;
CREATE TRIGGER votes_reputation_trigger
AFTER INSERT OR UPDATE OR DELETE ON votes
FOR EACH ROW
EXECUTE FUNCTION trigger_update_reputation_on_vote();

-- Trigger function to update reputation when verification status changes
CREATE OR REPLACE FUNCTION trigger_update_reputation_on_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if status changed to/from approved
  IF (OLD.status IS DISTINCT FROM NEW.status) AND
     (NEW.status = 'approved' OR OLD.status = 'approved') THEN
    PERFORM update_user_reputation(NEW.submitted_by);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on verifications table
DROP TRIGGER IF EXISTS verifications_reputation_trigger ON verifications;
CREATE TRIGGER verifications_reputation_trigger
AFTER UPDATE ON verifications
FOR EACH ROW
EXECUTE FUNCTION trigger_update_reputation_on_verification_status();

-- Function to recalculate all user reputations (for maintenance)
CREATE OR REPLACE FUNCTION recalculate_all_reputations()
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM users LOOP
    PERFORM update_user_reputation(user_record.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Initialize all existing users' reputation scores
SELECT recalculate_all_reputations();
