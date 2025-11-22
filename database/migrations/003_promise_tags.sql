-- Migration: Promise Tags and Categories System
-- Description: Adds tagging capability for promise categorization
-- Date: 2025-11-22

-- Create promise_tags table
CREATE TABLE IF NOT EXISTS promise_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Default blue color
  icon VARCHAR(50) DEFAULT 'Tag', -- Lucide icon name
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create promise_tag_mappings junction table
CREATE TABLE IF NOT EXISTS promise_tag_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promise_id UUID NOT NULL REFERENCES promises(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES promise_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(promise_id, tag_id) -- Prevent duplicate tag assignments
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_promise_tag_mappings_promise_id ON promise_tag_mappings(promise_id);
CREATE INDEX IF NOT EXISTS idx_promise_tag_mappings_tag_id ON promise_tag_mappings(tag_id);
CREATE INDEX IF NOT EXISTS idx_promise_tags_slug ON promise_tags(slug);

-- Enable RLS
ALTER TABLE promise_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE promise_tag_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can read tags
CREATE POLICY "Tags are viewable by everyone" ON promise_tags
  FOR SELECT USING (true);

-- RLS Policies: Tag mappings viewable by everyone
CREATE POLICY "Tag mappings are viewable by everyone" ON promise_tag_mappings
  FOR SELECT USING (true);

-- RLS Policies: Only authenticated users can create tag mappings
CREATE POLICY "Authenticated users can create tag mappings" ON promise_tag_mappings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies: Users can delete their own promise's tag mappings
CREATE POLICY "Users can delete their promise tag mappings" ON promise_tag_mappings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM promises
      WHERE promises.id = promise_tag_mappings.promise_id
      AND promises.created_by IN (
        SELECT id FROM users WHERE auth_id = auth.uid()
      )
    )
  );

-- Seed initial tags
INSERT INTO promise_tags (name, slug, description, color, icon) VALUES
  ('Economy', 'economy', 'Economic policies, GDP, employment, taxation', '#10B981', 'TrendingUp'),
  ('Healthcare', 'healthcare', 'Medical facilities, insurance, public health', '#EF4444', 'Heart'),
  ('Education', 'education', 'Schools, universities, literacy programs', '#3B82F6', 'GraduationCap'),
  ('Infrastructure', 'infrastructure', 'Roads, bridges, railways, airports', '#F59E0B', 'Building'),
  ('Security', 'security', 'National defense, law enforcement, public safety', '#8B5CF6', 'Shield'),
  ('Environment', 'environment', 'Climate change, pollution, conservation', '#22C55E', 'Leaf'),
  ('Agriculture', 'agriculture', 'Farming, subsidies, rural development', '#84CC16', 'Tractor'),
  ('Technology', 'technology', 'Digital India, IT sector, innovation', '#06B6D4', 'Cpu'),
  ('Social Welfare', 'social-welfare', 'Poverty alleviation, welfare schemes', '#EC4899', 'Users'),
  ('Governance', 'governance', 'Transparency, corruption, bureaucracy', '#6366F1', 'Scale'),
  ('Energy', 'energy', 'Power supply, renewable energy, fuel', '#F97316', 'Zap'),
  ('Transportation', 'transportation', 'Metro, buses, public transit', '#14B8A6', 'Train')
ON CONFLICT (slug) DO NOTHING;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_promise_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER promise_tags_updated_at
  BEFORE UPDATE ON promise_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_promise_tags_updated_at();

-- Add helpful comment
COMMENT ON TABLE promise_tags IS 'Categorization tags for promises (Economy, Healthcare, etc.)';
COMMENT ON TABLE promise_tag_mappings IS 'Junction table linking promises to their tags';
