-- Migration: Admin Roles and Permissions System
-- Description: Implements role-based access control for moderation
-- Date: 2025-11-22

-- Create admin_roles table
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  level INTEGER NOT NULL, -- 1=Reviewer, 2=Moderator, 3=SuperAdmin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_permissions table
CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, role_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_role_id ON admin_permissions(role_id);

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can view roles (to know what exists)
CREATE POLICY "Roles are viewable by everyone" ON admin_roles
  FOR SELECT USING (true);

-- RLS Policies: Everyone can view permissions
CREATE POLICY "Permissions are viewable by everyone" ON admin_permissions
  FOR SELECT USING (true);

-- RLS Policies: Everyone can view user role assignments (transparency)
CREATE POLICY "User roles are viewable by everyone" ON user_roles
  FOR SELECT USING (true);

-- RLS Policies: Only SuperAdmins can assign roles
CREATE POLICY "Only SuperAdmins can assign roles" ON user_roles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN admin_roles ar ON ur.role_id = ar.id
      WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
      AND ar.level = 3
    )
  );

-- RLS Policies: Only SuperAdmins can revoke roles
CREATE POLICY "Only SuperAdmins can revoke roles" ON user_roles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN admin_roles ar ON ur.role_id = ar.id
      WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
      AND ar.level = 3
    )
  );

-- Seed admin roles
INSERT INTO admin_roles (name, description, level) VALUES
  ('Reviewer', 'Can review and flag content, cannot approve/reject', 1),
  ('Moderator', 'Can approve/reject verifications, issue temporary bans', 2),
  ('SuperAdmin', 'Full platform control, can assign roles and access all features', 3)
ON CONFLICT (name) DO NOTHING;

-- Seed permissions for each role
DO $$
DECLARE
  reviewer_id UUID;
  moderator_id UUID;
  superadmin_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO reviewer_id FROM admin_roles WHERE name = 'Reviewer';
  SELECT id INTO moderator_id FROM admin_roles WHERE name = 'Moderator';
  SELECT id INTO superadmin_id FROM admin_roles WHERE name = 'SuperAdmin';

  -- Reviewer permissions
  INSERT INTO admin_permissions (role_id, permission) VALUES
    (reviewer_id, 'view_admin_dashboard'),
    (reviewer_id, 'view_verification_queue'),
    (reviewer_id, 'flag_content'),
    (reviewer_id, 'view_reports')
  ON CONFLICT (role_id, permission) DO NOTHING;

  -- Moderator permissions (includes all Reviewer permissions)
  INSERT INTO admin_permissions (role_id, permission) VALUES
    (moderator_id, 'view_admin_dashboard'),
    (moderator_id, 'view_verification_queue'),
    (moderator_id, 'flag_content'),
    (moderator_id, 'view_reports'),
    (moderator_id, 'approve_verification'),
    (moderator_id, 'reject_verification'),
    (moderator_id, 'issue_temp_ban'),
    (moderator_id, 'view_user_details'),
    (moderator_id, 'view_audit_log')
  ON CONFLICT (role_id, permission) DO NOTHING;

  -- SuperAdmin permissions (full access)
  INSERT INTO admin_permissions (role_id, permission) VALUES
    (superadmin_id, 'view_admin_dashboard'),
    (superadmin_id, 'view_verification_queue'),
    (superadmin_id, 'flag_content'),
    (superadmin_id, 'view_reports'),
    (superadmin_id, 'approve_verification'),
    (superadmin_id, 'reject_verification'),
    (superadmin_id, 'issue_temp_ban'),
    (superadmin_id, 'issue_permanent_ban'),
    (superadmin_id, 'assign_roles'),
    (superadmin_id, 'revoke_roles'),
    (superadmin_id, 'view_user_details'),
    (superadmin_id, 'edit_user_reputation'),
    (superadmin_id, 'view_audit_log'),
    (superadmin_id, 'configure_auto_approval'),
    (superadmin_id, 'override_auto_approval'),
    (superadmin_id, 'manage_admins')
  ON CONFLICT (role_id, permission) DO NOTHING;
END $$;

-- Helper function: Check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(user_auth_id UUID, required_permission VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN admin_permissions ap ON ur.role_id = ap.role_id
    WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = user_auth_id)
    AND ap.permission = required_permission
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if user is admin (has any role)
CREATE OR REPLACE FUNCTION user_is_admin(user_auth_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = user_auth_id)
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get user's highest admin level
CREATE OR REPLACE FUNCTION user_admin_level(user_auth_id UUID)
RETURNS INTEGER AS $$
DECLARE
  max_level INTEGER;
BEGIN
  SELECT COALESCE(MAX(ar.level), 0)
  INTO max_level
  FROM user_roles ur
  JOIN admin_roles ar ON ur.role_id = ar.id
  WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = user_auth_id)
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW());

  RETURN max_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE admin_roles IS 'Available admin roles: Reviewer, Moderator, SuperAdmin';
COMMENT ON TABLE admin_permissions IS 'Granular permissions assigned to each role';
COMMENT ON TABLE user_roles IS 'Junction table assigning roles to users';
COMMENT ON FUNCTION user_has_permission IS 'Check if user has a specific permission';
COMMENT ON FUNCTION user_is_admin IS 'Check if user has any admin role';
COMMENT ON FUNCTION user_admin_level IS 'Get user highest admin level (0=none, 1=Reviewer, 2=Moderator, 3=SuperAdmin)';
