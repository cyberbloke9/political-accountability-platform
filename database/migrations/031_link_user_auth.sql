-- Migration 031: Function to link auth_id to user by email
-- This bypasses RLS to allow linking when auth_id is NULL

CREATE OR REPLACE FUNCTION link_user_auth_id(
  p_auth_id UUID,
  p_email TEXT
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- First check if user already linked
  SELECT id INTO v_user_id
  FROM users
  WHERE auth_id = p_auth_id;

  IF v_user_id IS NOT NULL THEN
    RETURN v_user_id;
  END IF;

  -- Try to link by email
  UPDATE users
  SET auth_id = p_auth_id, updated_at = NOW()
  WHERE email = p_email
    AND (auth_id IS NULL OR auth_id != p_auth_id)
  RETURNING id INTO v_user_id;

  IF v_user_id IS NOT NULL THEN
    RETURN v_user_id;
  END IF;

  -- If no user exists, create one
  INSERT INTO users (auth_id, email, username, citizen_score, created_at, updated_at)
  VALUES (
    p_auth_id,
    p_email,
    SPLIT_PART(p_email, '@', 1),
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE
    SET auth_id = p_auth_id, updated_at = NOW()
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION link_user_auth_id TO authenticated;
GRANT EXECUTE ON FUNCTION link_user_auth_id TO anon;
