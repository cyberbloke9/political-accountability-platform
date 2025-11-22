-- Migration: Auto-Approval System (HARSH Rules)
-- Description: Automatically approve high-quality verifications from trusted users
-- Date: 2025-11-23

-- Create auto_approval_rules table (single row configuration)
CREATE TABLE IF NOT EXISTS auto_approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT false, -- Global kill switch (disabled by default)
  min_citizen_score INTEGER DEFAULT 250, -- HARSH: Need 250+ reputation
  min_evidence_length INTEGER DEFAULT 250, -- HARSH: Need 250+ characters
  require_source_url BOOLEAN DEFAULT true, -- HARSH: Must have sources
  min_account_age_days INTEGER DEFAULT 60, -- HARSH: 2 months minimum
  min_approved_verifications INTEGER DEFAULT 10, -- HARSH: 10+ approved verifications
  max_recent_rejections INTEGER DEFAULT 0, -- HARSH: ZERO rejections allowed
  rejection_lookback_days INTEGER DEFAULT 30, -- Check rejections in last 30 days
  description TEXT DEFAULT 'Harsh auto-approval rules for top-tier contributors only',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create auto_approval_log table (audit trail)
CREATE TABLE IF NOT EXISTS auto_approval_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  auto_approved BOOLEAN NOT NULL,
  reason TEXT NOT NULL,
  criteria_met JSONB NOT NULL, -- Detailed breakdown of which criteria passed/failed
  rules_snapshot JSONB, -- Copy of rules at time of decision
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auto_approval_log_verification_id ON auto_approval_log(verification_id);
CREATE INDEX IF NOT EXISTS idx_auto_approval_log_user_id ON auto_approval_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_approval_log_created_at ON auto_approval_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_approval_log_auto_approved ON auto_approval_log(auto_approved);

-- Enable RLS
ALTER TABLE auto_approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_approval_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Auto-approval rules viewable by everyone" ON auto_approval_rules;
DROP POLICY IF EXISTS "Only SuperAdmins can modify auto-approval rules" ON auto_approval_rules;
DROP POLICY IF EXISTS "Auto-approval log viewable by admins" ON auto_approval_log;
DROP POLICY IF EXISTS "System can insert into auto-approval log" ON auto_approval_log;

-- RLS Policies: Rules are public (transparency)
CREATE POLICY "Auto-approval rules viewable by everyone" ON auto_approval_rules
  FOR SELECT USING (true);

-- RLS Policies: Only SuperAdmins can modify rules
CREATE POLICY "Only SuperAdmins can modify auto-approval rules" ON auto_approval_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN admin_roles ar ON ur.role_id = ar.id
      WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
      AND ar.level = 3
    )
  );

-- RLS Policies: Log viewable by admins
CREATE POLICY "Auto-approval log viewable by admins" ON auto_approval_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- RLS Policies: System can insert into log
CREATE POLICY "System can insert into auto-approval log" ON auto_approval_log
  FOR INSERT WITH CHECK (true);

-- Seed default auto-approval rules (DISABLED by default for safety)
INSERT INTO auto_approval_rules (
  enabled,
  min_citizen_score,
  min_evidence_length,
  require_source_url,
  min_account_age_days,
  min_approved_verifications,
  max_recent_rejections,
  rejection_lookback_days,
  description
)
SELECT
  false, -- DISABLED by default - SuperAdmin must enable
  250,   -- HARSH: 250+ citizen score required
  250,   -- HARSH: 250+ character evidence
  true,  -- HARSH: Source URLs mandatory
  60,    -- HARSH: 60 days account age
  10,    -- HARSH: 10+ approved verifications
  0,     -- HARSH: ZERO rejections allowed
  30,    -- Check last 30 days for rejections
  'HARSH auto-approval rules: Only top-tier contributors with 250+ reputation, 10+ approvals, 60+ days old, and ZERO rejections qualify'
WHERE NOT EXISTS (SELECT 1 FROM auto_approval_rules LIMIT 1);

-- Trigger Function: Check auto-approval eligibility
CREATE OR REPLACE FUNCTION check_auto_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rules RECORD;
  user_info RECORD;
  approved_count INTEGER;
  recent_rejections INTEGER;
  account_age_days INTEGER;
  evidence_length INTEGER;
  has_source_urls BOOLEAN;
  has_fraud_flags BOOLEAN;
  criteria JSONB;
  all_criteria_met BOOLEAN;
  fail_reason TEXT;
BEGIN
  -- Only check on INSERT with pending status
  IF TG_OP != 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Get auto-approval rules
  SELECT * INTO rules FROM auto_approval_rules LIMIT 1;

  -- If rules don't exist or disabled, skip auto-approval
  IF NOT FOUND OR NOT rules.enabled THEN
    RETURN NEW;
  END IF;

  -- Get user info
  SELECT
    u.citizen_score,
    u.created_at,
    EXTRACT(DAY FROM NOW() - u.created_at)::INTEGER as account_age
  INTO user_info
  FROM users u
  WHERE u.id = NEW.submitted_by;

  -- Count approved verifications
  SELECT COUNT(*)
  INTO approved_count
  FROM verifications
  WHERE submitted_by = NEW.submitted_by
  AND status = 'approved';

  -- Count recent rejections
  SELECT COUNT(*)
  INTO recent_rejections
  FROM verifications
  WHERE submitted_by = NEW.submitted_by
  AND status = 'rejected'
  AND updated_at > NOW() - (rules.rejection_lookback_days || ' days')::INTERVAL;

  -- Check evidence quality
  evidence_length := LENGTH(NEW.evidence_text);
  has_source_urls := NEW.evidence_urls IS NOT NULL AND array_length(NEW.evidence_urls, 1) > 0;

  -- Check for ANY fraud flags (pending or confirmed)
  SELECT EXISTS (
    SELECT 1
    FROM fraud_flags
    WHERE target_type = 'user'
    AND target_id = NEW.submitted_by
    AND status IN ('pending', 'confirmed')
  ) INTO has_fraud_flags;

  -- Build criteria check results
  criteria := jsonb_build_object(
    'citizen_score', jsonb_build_object(
      'required', rules.min_citizen_score,
      'actual', user_info.citizen_score,
      'passed', user_info.citizen_score >= rules.min_citizen_score
    ),
    'evidence_length', jsonb_build_object(
      'required', rules.min_evidence_length,
      'actual', evidence_length,
      'passed', evidence_length >= rules.min_evidence_length
    ),
    'source_urls', jsonb_build_object(
      'required', rules.require_source_url,
      'actual', has_source_urls,
      'passed', (NOT rules.require_source_url) OR has_source_urls
    ),
    'account_age_days', jsonb_build_object(
      'required', rules.min_account_age_days,
      'actual', user_info.account_age,
      'passed', user_info.account_age >= rules.min_account_age_days
    ),
    'approved_verifications', jsonb_build_object(
      'required', rules.min_approved_verifications,
      'actual', approved_count,
      'passed', approved_count >= rules.min_approved_verifications
    ),
    'recent_rejections', jsonb_build_object(
      'max_allowed', rules.max_recent_rejections,
      'actual', recent_rejections,
      'passed', recent_rejections <= rules.max_recent_rejections
    ),
    'no_fraud_flags', jsonb_build_object(
      'required', true,
      'actual', NOT has_fraud_flags,
      'passed', NOT has_fraud_flags
    )
  );

  -- Check if ALL criteria are met
  all_criteria_met :=
    user_info.citizen_score >= rules.min_citizen_score AND
    evidence_length >= rules.min_evidence_length AND
    ((NOT rules.require_source_url) OR has_source_urls) AND
    user_info.account_age >= rules.min_account_age_days AND
    approved_count >= rules.min_approved_verifications AND
    recent_rejections <= rules.max_recent_rejections AND
    NOT has_fraud_flags;

  -- If ALL criteria met, auto-approve
  IF all_criteria_met THEN
    NEW.status := 'approved';
    fail_reason := 'Auto-approved: All criteria met';

    -- Log to admin_actions
    INSERT INTO admin_actions (action_type, target_type, target_id, admin_id, reason, metadata)
    VALUES (
      'auto_approve_verification',
      'verification',
      NEW.id,
      NEW.submitted_by, -- User themselves (automated)
      'Verification auto-approved by system',
      jsonb_build_object(
        'citizen_score', user_info.citizen_score,
        'approved_count', approved_count,
        'evidence_length', evidence_length
      )
    );

    -- Trigger reputation update will happen automatically via existing trigger
  ELSE
    -- Build failure reason
    fail_reason := 'Manual review required: ';
    IF user_info.citizen_score < rules.min_citizen_score THEN
      fail_reason := fail_reason || 'Citizen score ' || user_info.citizen_score || ' < ' || rules.min_citizen_score || '; ';
    END IF;
    IF evidence_length < rules.min_evidence_length THEN
      fail_reason := fail_reason || 'Evidence too short (' || evidence_length || ' < ' || rules.min_evidence_length || '); ';
    END IF;
    IF rules.require_source_url AND NOT has_source_urls THEN
      fail_reason := fail_reason || 'Missing source URLs; ';
    END IF;
    IF user_info.account_age < rules.min_account_age_days THEN
      fail_reason := fail_reason || 'Account too new (' || user_info.account_age || ' < ' || rules.min_account_age_days || ' days); ';
    END IF;
    IF approved_count < rules.min_approved_verifications THEN
      fail_reason := fail_reason || 'Not enough approvals (' || approved_count || ' < ' || rules.min_approved_verifications || '); ';
    END IF;
    IF recent_rejections > rules.max_recent_rejections THEN
      fail_reason := fail_reason || 'Recent rejections (' || recent_rejections || ' > ' || rules.max_recent_rejections || '); ';
    END IF;
    IF has_fraud_flags THEN
      fail_reason := fail_reason || 'Has fraud flags; ';
    END IF;
  END IF;

  -- Log decision
  INSERT INTO auto_approval_log (
    verification_id,
    user_id,
    auto_approved,
    reason,
    criteria_met,
    rules_snapshot
  )
  VALUES (
    NEW.id,
    NEW.submitted_by,
    all_criteria_met,
    fail_reason,
    criteria,
    row_to_json(rules)::jsonb
  );

  RETURN NEW;
END;
$$;

-- Create trigger on verifications table (BEFORE INSERT)
DROP TRIGGER IF EXISTS trigger_check_auto_approval ON verifications;
CREATE TRIGGER trigger_check_auto_approval
  BEFORE INSERT ON verifications
  FOR EACH ROW
  EXECUTE FUNCTION check_auto_approval();

-- Comments
COMMENT ON TABLE auto_approval_rules IS 'Configuration for automatic verification approval (HARSH rules - disabled by default)';
COMMENT ON TABLE auto_approval_log IS 'Audit trail of all auto-approval decisions';
COMMENT ON FUNCTION check_auto_approval() IS 'Check if verification qualifies for auto-approval based on harsh criteria';
COMMENT ON COLUMN auto_approval_rules.min_citizen_score IS 'HARSH: Requires 250+ reputation (top-tier users only)';
COMMENT ON COLUMN auto_approval_rules.min_approved_verifications IS 'HARSH: Requires 10+ approved verifications (proven track record)';
COMMENT ON COLUMN auto_approval_rules.max_recent_rejections IS 'HARSH: Zero rejections allowed (perfect quality only)';
COMMENT ON COLUMN auto_approval_rules.enabled IS 'Global kill switch - SuperAdmin must enable manually';
