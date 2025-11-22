-- Migration: Add Fraud Management Permission
-- Description: Adds manage_fraud permission to moderator and superadmin roles
-- Date: 2025-11-23

DO $$
DECLARE
  moderator_id UUID;
  superadmin_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO moderator_id FROM admin_roles WHERE name = 'Moderator';
  SELECT id INTO superadmin_id FROM admin_roles WHERE name = 'SuperAdmin';

  -- Add manage_fraud permission to Moderator
  INSERT INTO admin_permissions (role_id, permission) VALUES
    (moderator_id, 'manage_fraud')
  ON CONFLICT (role_id, permission) DO NOTHING;

  -- Add manage_fraud permission to SuperAdmin
  INSERT INTO admin_permissions (role_id, permission) VALUES
    (superadmin_id, 'manage_fraud')
  ON CONFLICT (role_id, permission) DO NOTHING;
END $$;
