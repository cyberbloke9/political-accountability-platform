-- Create Missing Tables for Moderation System
-- Run this in Supabase SQL Editor

-- Create admin_actions table (audit log)
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table (in-app notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin actions are viewable by everyone" ON admin_actions;
DROP POLICY IF EXISTS "Only admins can create admin actions" ON admin_actions;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- RLS Policies: Admin actions viewable by everyone (transparency)
CREATE POLICY "Admin actions are viewable by everyone" ON admin_actions
  FOR SELECT USING (true);

-- RLS Policies: Only admins can create admin actions
CREATE POLICY "Only admins can create admin actions" ON admin_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- RLS Policies: Users can only view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- RLS Policies: System can create notifications (for triggers)
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- RLS Policies: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Verify tables were created
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM (VALUES ('admin_actions'), ('notifications')) AS t(table_name)
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = t.table_name
);
