-- Migration: Ban Management System
-- Description: Comprehensive ban system with temporary/permanent bans, appeals, and full audit trail
-- Date: 2025-11-23

-- ============================================================
-- CREATE BANS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  ban_type VARCHAR(20) NOT NULL CHECK (ban_type IN ('temporary', 'permanent')),
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  unbanned_at TIMESTAMP WITH TIME ZONE,
  unbanned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  unban_reason TEXT,
  metadata JSONB DEFAULT '{}',

  -- Constraints
  CONSTRAINT valid_ban_duration CHECK (
    (ban_type = 'permanent' AND expires_at IS NULL) OR
    (ban_type = 'temporary' AND expires_at > banned_at)
  ),
  CONSTRAINT active_ban_check CHECK (
    (is_active = true AND unbanned_at IS NULL) OR
    (is_active = false AND unbanned_at IS NOT NULL)
  )
);

-- ============================================================
-- CREATE BAN APPEALS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS ban_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ban_id UUID NOT NULL REFERENCES bans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appeal_reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  review_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP WITH TIME ZONE,

  -- Only one pending appeal per ban
  CONSTRAINT unique_pending_appeal UNIQUE (ban_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================
-- CREATE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_bans_user_id ON bans(user_id);
CREATE INDEX IF NOT EXISTS idx_bans_banned_by ON bans(banned_by);
CREATE INDEX IF NOT EXISTS idx_bans_is_active ON bans(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_bans_expires_at ON bans(expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ban_appeals_ban_id ON ban_appeals(ban_id);
CREATE INDEX IF NOT EXISTS idx_ban_appeals_user_id ON ban_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_ban_appeals_status ON ban_appeals(status);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ban_appeals ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- DROP EXISTING POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Bans are viewable by admins and affected users" ON bans;
DROP POLICY IF EXISTS "Only admins can create bans" ON bans;
DROP POLICY IF EXISTS "Only admins can update bans" ON bans;
DROP POLICY IF EXISTS "Ban appeals are viewable by user and admins" ON ban_appeals;
DROP POLICY IF EXISTS "Users can create their own appeals" ON ban_appeals;
DROP POLICY IF EXISTS "Only admins can update appeals" ON ban_appeals;

-- ============================================================
-- CREATE RLS POLICIES
-- ============================================================

-- Bans: Admins can view all, users can view their own
CREATE POLICY "Bans are viewable by admins and affected users" ON bans
  FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN admin_roles ar ON ur.role_id = ar.id
      WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
      AND ar.level >= 1
    )
  );

-- Only admins (level 2+) can create bans
CREATE POLICY "Only admins can create bans" ON bans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN admin_roles ar ON ur.role_id = ar.id
      WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
      AND ar.level >= 2
    )
  );

-- Only admins (level 2+) can update bans
CREATE POLICY "Only admins can update bans" ON bans
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN admin_roles ar ON ur.role_id = ar.id
      WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
      AND ar.level >= 2
    )
  );

-- Ban Appeals: Users can view their own, admins can view all
CREATE POLICY "Ban appeals are viewable by user and admins" ON ban_appeals
  FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN admin_roles ar ON ur.role_id = ar.id
      WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
      AND ar.level >= 1
    )
  );

-- Users can create appeals for their own bans
CREATE POLICY "Users can create their own appeals" ON ban_appeals
  FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) AND
    EXISTS (
      SELECT 1 FROM bans
      WHERE id = ban_id
      AND user_id = ban_appeals.user_id
      AND is_active = true
    )
  );

-- Only admins (level 2+) can update appeals
CREATE POLICY "Only admins can update appeals" ON ban_appeals
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN admin_roles ar ON ur.role_id = ar.id
      WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
      AND ar.level >= 2
    )
  );

-- ============================================================
-- CREATE FUNCTION: Check if user is currently banned
-- ============================================================

CREATE OR REPLACE FUNCTION is_user_banned(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_ban_exists BOOLEAN;
BEGIN
  -- Check for active ban that hasn't expired
  SELECT EXISTS (
    SELECT 1 FROM bans
    WHERE user_id = check_user_id
    AND is_active = true
    AND (
      ban_type = 'permanent' OR
      (ban_type = 'temporary' AND expires_at > CURRENT_TIMESTAMP)
    )
  ) INTO active_ban_exists;

  RETURN active_ban_exists;
END;
$$;

-- ============================================================
-- CREATE FUNCTION: Auto-expire temporary bans
-- ============================================================

CREATE OR REPLACE FUNCTION expire_temporary_bans()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE bans
  SET
    is_active = false,
    unbanned_at = CURRENT_TIMESTAMP,
    unban_reason = 'Ban expired automatically'
  WHERE
    ban_type = 'temporary'
    AND is_active = true
    AND expires_at <= CURRENT_TIMESTAMP;
END;
$$;

-- ============================================================
-- CREATE FUNCTION: Ban user (for API calls)
-- ============================================================

CREATE OR REPLACE FUNCTION ban_user(
  target_user_id UUID,
  admin_user_id UUID,
  ban_reason TEXT,
  duration_type VARCHAR(20),
  ban_duration_days INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_ban_id UUID;
  expiry_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Verify admin has permission (level 2+)
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN admin_roles ar ON ur.role_id = ar.id
    WHERE ur.user_id = admin_user_id
    AND ar.level >= 2
  ) THEN
    RAISE EXCEPTION 'User does not have permission to ban users';
  END IF;

  -- Calculate expiry date for temporary bans
  IF duration_type = 'temporary' THEN
    IF ban_duration_days IS NULL OR ban_duration_days <= 0 THEN
      RAISE EXCEPTION 'Temporary bans require a valid duration in days';
    END IF;
    expiry_date := CURRENT_TIMESTAMP + (ban_duration_days || ' days')::INTERVAL;
  ELSE
    expiry_date := NULL;
  END IF;

  -- Deactivate any existing active bans
  UPDATE bans
  SET
    is_active = false,
    unbanned_at = CURRENT_TIMESTAMP,
    unbanned_by = admin_user_id,
    unban_reason = 'Superseded by new ban'
  WHERE
    user_id = target_user_id
    AND is_active = true;

  -- Create new ban
  INSERT INTO bans (
    user_id,
    banned_by,
    reason,
    ban_type,
    expires_at,
    is_active
  ) VALUES (
    target_user_id,
    admin_user_id,
    ban_reason,
    duration_type,
    expiry_date,
    true
  )
  RETURNING id INTO new_ban_id;

  -- Log to admin_actions
  INSERT INTO admin_actions (
    action_type,
    target_type,
    target_id,
    admin_id,
    reason,
    metadata
  ) VALUES (
    'ban_user',
    'user',
    target_user_id,
    admin_user_id,
    ban_reason,
    jsonb_build_object(
      'ban_type', duration_type,
      'duration_days', ban_duration_days,
      'expires_at', expiry_date,
      'ban_id', new_ban_id
    )
  );

  RETURN new_ban_id;
END;
$$;

-- ============================================================
-- CREATE FUNCTION: Unban user (for API calls)
-- ============================================================

CREATE OR REPLACE FUNCTION unban_user(
  target_user_id UUID,
  admin_user_id UUID,
  unban_reason_text TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin has permission (level 2+)
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN admin_roles ar ON ur.role_id = ar.id
    WHERE ur.user_id = admin_user_id
    AND ar.level >= 2
  ) THEN
    RAISE EXCEPTION 'User does not have permission to unban users';
  END IF;

  -- Update active bans
  UPDATE bans
  SET
    is_active = false,
    unbanned_at = CURRENT_TIMESTAMP,
    unbanned_by = admin_user_id,
    unban_reason = unban_reason_text
  WHERE
    user_id = target_user_id
    AND is_active = true;

  -- Log to admin_actions
  INSERT INTO admin_actions (
    action_type,
    target_type,
    target_id,
    admin_id,
    reason,
    metadata
  ) VALUES (
    'unban_user',
    'user',
    target_user_id,
    admin_user_id,
    unban_reason_text,
    '{}'::jsonb
  );

  RETURN true;
END;
$$;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE bans IS 'User bans with temporary/permanent durations and full audit trail';
COMMENT ON TABLE ban_appeals IS 'User appeals against bans';
COMMENT ON FUNCTION is_user_banned(UUID) IS 'Check if a user is currently banned (active and not expired)';
COMMENT ON FUNCTION expire_temporary_bans() IS 'Automatically expire temporary bans that have passed their expiry date';
COMMENT ON FUNCTION ban_user(UUID, UUID, TEXT, VARCHAR, INTEGER) IS 'Ban a user (temporary or permanent) with full logging';
COMMENT ON FUNCTION unban_user(UUID, UUID, TEXT) IS 'Unban a user with reason and logging';
