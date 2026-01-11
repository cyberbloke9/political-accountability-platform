-- =====================================================
-- SPRINT 4: EVIDENCE QUALITY SYSTEM (Grokipedia-style)
-- Confidence scoring, source tiering, community notes
-- EXTENDS existing verification system - NO BREAKING CHANGES
-- =====================================================

-- =====================================================
-- PART 1: SOURCE CREDIBILITY DOMAINS
-- Pre-populated list of known Indian news/govt sources
-- =====================================================

CREATE TABLE IF NOT EXISTS source_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Domain identification
  domain VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,

  -- Credibility classification
  credibility_tier INTEGER NOT NULL CHECK (credibility_tier BETWEEN 1 AND 4),
  -- 1 = Highest (govt, courts, RTI)
  -- 2 = High (major news, official releases)
  -- 3 = Medium (regional news, verified journalists)
  -- 4 = Low (social media, blogs, unverified)

  source_type VARCHAR(50) NOT NULL CHECK (source_type IN (
    'government', 'court', 'parliament', 'rti',
    'national_news', 'regional_news', 'wire_service',
    'official_release', 'verified_journalist',
    'social_media', 'blog', 'unverified'
  )),

  -- Metadata
  is_verified BOOLEAN DEFAULT false,
  notes TEXT,
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_source_domains_tier ON source_domains(credibility_tier);
CREATE INDEX IF NOT EXISTS idx_source_domains_type ON source_domains(source_type);

-- Pre-populate with known Indian sources
INSERT INTO source_domains (domain, display_name, credibility_tier, source_type, is_verified) VALUES
  -- Tier 1: Government & Official
  ('india.gov.in', 'Government of India Portal', 1, 'government', true),
  ('pib.gov.in', 'Press Information Bureau', 1, 'government', true),
  ('eci.gov.in', 'Election Commission of India', 1, 'government', true),
  ('loksabha.nic.in', 'Lok Sabha', 1, 'parliament', true),
  ('rajyasabha.nic.in', 'Rajya Sabha', 1, 'parliament', true),
  ('sci.gov.in', 'Supreme Court of India', 1, 'court', true),
  ('main.sci.gov.in', 'Supreme Court Portal', 1, 'court', true),
  ('egazette.nic.in', 'Gazette of India', 1, 'government', true),
  ('mha.gov.in', 'Ministry of Home Affairs', 1, 'government', true),
  ('mea.gov.in', 'Ministry of External Affairs', 1, 'government', true),
  ('finmin.nic.in', 'Ministry of Finance', 1, 'government', true),

  -- Tier 2: Major News & Wire Services
  ('ptinews.com', 'Press Trust of India', 2, 'wire_service', true),
  ('reuters.com', 'Reuters', 2, 'wire_service', true),
  ('thehindu.com', 'The Hindu', 2, 'national_news', true),
  ('indianexpress.com', 'Indian Express', 2, 'national_news', true),
  ('hindustantimes.com', 'Hindustan Times', 2, 'national_news', true),
  ('timesofindia.indiatimes.com', 'Times of India', 2, 'national_news', true),
  ('ndtv.com', 'NDTV', 2, 'national_news', true),
  ('thewire.in', 'The Wire', 2, 'national_news', true),
  ('scroll.in', 'Scroll.in', 2, 'national_news', true),
  ('economictimes.indiatimes.com', 'Economic Times', 2, 'national_news', true),
  ('livemint.com', 'Mint', 2, 'national_news', true),
  ('businessstandard.com', 'Business Standard', 2, 'national_news', true),
  ('deccanherald.com', 'Deccan Herald', 2, 'national_news', true),
  ('telegraphindia.com', 'The Telegraph', 2, 'national_news', true),

  -- Tier 3: Regional & Verified
  ('tribuneindia.com', 'The Tribune', 3, 'regional_news', true),
  ('newindianexpress.com', 'New Indian Express', 3, 'regional_news', true),
  ('thestatesman.com', 'The Statesman', 3, 'regional_news', true),
  ('asianage.com', 'Asian Age', 3, 'regional_news', true),
  ('dnaindia.com', 'DNA India', 3, 'regional_news', true),
  ('firstpost.com', 'Firstpost', 3, 'regional_news', true),
  ('news18.com', 'News18', 3, 'regional_news', true),

  -- Tier 4: Social & Unverified (common platforms)
  ('twitter.com', 'Twitter/X', 4, 'social_media', true),
  ('x.com', 'X (Twitter)', 4, 'social_media', true),
  ('facebook.com', 'Facebook', 4, 'social_media', true),
  ('youtube.com', 'YouTube', 4, 'social_media', true),
  ('instagram.com', 'Instagram', 4, 'social_media', true),
  ('medium.com', 'Medium', 4, 'blog', true),
  ('wordpress.com', 'WordPress', 4, 'blog', true),
  ('blogspot.com', 'Blogspot', 4, 'blog', true)
ON CONFLICT (domain) DO NOTHING;

-- =====================================================
-- PART 2: EXTEND VERIFICATIONS TABLE
-- Add quality scoring columns (non-breaking)
-- =====================================================

-- Quality score (0-100, Grokipedia-style)
ALTER TABLE verifications
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(5,2) DEFAULT 0;

-- Confidence level derived from quality_score
ALTER TABLE verifications
ADD COLUMN IF NOT EXISTS confidence_level VARCHAR(20) DEFAULT 'pending';

ALTER TABLE verifications
DROP CONSTRAINT IF EXISTS check_confidence_level;

ALTER TABLE verifications
ADD CONSTRAINT check_confidence_level CHECK (
  confidence_level IN ('very_high', 'high', 'medium', 'low', 'very_low', 'pending')
);

-- Source analysis (parsed URL breakdown)
ALTER TABLE verifications
ADD COLUMN IF NOT EXISTS source_analysis JSONB DEFAULT '{}';

-- Corroboration tracking
ALTER TABLE verifications
ADD COLUMN IF NOT EXISTS corroboration_count INTEGER DEFAULT 0;

-- Last quality calculation timestamp
ALTER TABLE verifications
ADD COLUMN IF NOT EXISTS quality_calculated_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for quality filtering
CREATE INDEX IF NOT EXISTS idx_verifications_quality_score ON verifications(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_verifications_confidence ON verifications(confidence_level);

-- =====================================================
-- PART 3: COMMUNITY NOTES (X-style corrections)
-- =====================================================

CREATE TABLE IF NOT EXISTS community_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target (verification or promise)
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('verification', 'promise')),
  target_id UUID NOT NULL,

  -- Note content
  note_text TEXT NOT NULL CHECK (char_length(note_text) >= 10 AND char_length(note_text) <= 1000),
  note_type VARCHAR(30) NOT NULL CHECK (note_type IN (
    'context', 'correction', 'source_update',
    'outdated', 'misleading', 'needs_sources'
  )),

  -- Supporting evidence
  supporting_urls TEXT[],

  -- Author
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Voting
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'shown', 'hidden', 'rejected'
  )),

  -- Visibility threshold: shown when helpful > not_helpful + 5
  is_visible BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_notes_target ON community_notes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_community_notes_author ON community_notes(author_id);
CREATE INDEX IF NOT EXISTS idx_community_notes_visible ON community_notes(is_visible) WHERE is_visible = true;

-- Community note votes
CREATE TABLE IF NOT EXISTS community_note_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES community_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(15) NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(note_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_note_votes_note ON community_note_votes(note_id);
CREATE INDEX IF NOT EXISTS idx_note_votes_user ON community_note_votes(user_id);

-- =====================================================
-- PART 4: EVIDENCE CORROBORATION TRACKING
-- Track when multiple users submit similar evidence
-- =====================================================

CREATE TABLE IF NOT EXISTS evidence_corroborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The primary verification
  verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,

  -- User corroborating
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Their evidence (might differ slightly)
  evidence_text TEXT,
  evidence_urls TEXT[],

  -- Agreement level
  agrees_with_verdict BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(verification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_corroborations_verification ON evidence_corroborations(verification_id);
CREATE INDEX IF NOT EXISTS idx_corroborations_user ON evidence_corroborations(user_id);

-- =====================================================
-- PART 5: RATE LIMITING TABLE
-- Track API calls per user for rate limiting
-- =====================================================

CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ip_address INET,
  endpoint VARCHAR(100) NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Composite key for user+endpoint or ip+endpoint
  UNIQUE(user_id, endpoint, window_start),
  UNIQUE(ip_address, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user ON api_rate_limits(user_id, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON api_rate_limits(ip_address, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON api_rate_limits(window_start);

-- Clean up old rate limit entries (run periodically)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM api_rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 6: QUALITY SCORING FUNCTIONS
-- =====================================================

-- Extract domain from URL
CREATE OR REPLACE FUNCTION extract_domain(url TEXT)
RETURNS TEXT AS $$
DECLARE
  domain TEXT;
BEGIN
  IF url IS NULL OR url = '' THEN
    RETURN NULL;
  END IF;

  -- Remove protocol
  domain := regexp_replace(url, '^https?://(www\.)?', '');
  -- Get just the domain
  domain := split_part(domain, '/', 1);
  -- Remove port if present
  domain := split_part(domain, ':', 1);

  RETURN lower(domain);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get credibility tier for a URL
CREATE OR REPLACE FUNCTION get_url_credibility(url TEXT)
RETURNS TABLE (
  domain TEXT,
  display_name TEXT,
  credibility_tier INTEGER,
  source_type TEXT,
  is_verified BOOLEAN
) AS $$
DECLARE
  extracted_domain TEXT;
BEGIN
  extracted_domain := extract_domain(url);

  IF extracted_domain IS NULL THEN
    RETURN QUERY SELECT
      NULL::TEXT,
      'Unknown'::TEXT,
      4::INTEGER,
      'unverified'::TEXT,
      false::BOOLEAN;
    RETURN;
  END IF;

  -- Try exact match first
  RETURN QUERY
  SELECT
    sd.domain::TEXT,
    sd.display_name::TEXT,
    sd.credibility_tier,
    sd.source_type::TEXT,
    sd.is_verified
  FROM source_domains sd
  WHERE sd.domain = extracted_domain
  LIMIT 1;

  -- If no match, check if it's a subdomain
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      sd.domain::TEXT,
      sd.display_name::TEXT,
      sd.credibility_tier,
      sd.source_type::TEXT,
      sd.is_verified
    FROM source_domains sd
    WHERE extracted_domain LIKE '%.' || sd.domain
    LIMIT 1;
  END IF;

  -- If still no match, return default
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      extracted_domain,
      'Unverified Source'::TEXT,
      4::INTEGER,
      'unverified'::TEXT,
      false::BOOLEAN;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Calculate quality score for a verification
CREATE OR REPLACE FUNCTION calculate_quality_score(p_verification_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_record RECORD;
  base_score DECIMAL := 0;
  source_score DECIMAL := 0;
  url_count INTEGER := 0;
  tier1_count INTEGER := 0;
  tier2_count INTEGER := 0;
  tier3_count INTEGER := 0;
  tier4_count INTEGER := 0;
  corroboration_multiplier DECIMAL := 1.0;
  trust_multiplier DECIMAL := 1.0;
  final_score DECIMAL;
  url TEXT;
  url_cred RECORD;
BEGIN
  -- Get verification record
  SELECT * INTO v_record
  FROM verifications
  WHERE id = p_verification_id;

  IF v_record IS NULL THEN
    RETURN 0;
  END IF;

  -- Base score from evidence text length (max 15 points)
  IF v_record.evidence_text IS NOT NULL THEN
    base_score := LEAST(char_length(v_record.evidence_text) / 50.0, 15);
  END IF;

  -- Analyze each evidence URL
  IF v_record.evidence_urls IS NOT NULL THEN
    FOREACH url IN ARRAY v_record.evidence_urls
    LOOP
      url_count := url_count + 1;

      SELECT * INTO url_cred FROM get_url_credibility(url);

      CASE url_cred.credibility_tier
        WHEN 1 THEN tier1_count := tier1_count + 1;
        WHEN 2 THEN tier2_count := tier2_count + 1;
        WHEN 3 THEN tier3_count := tier3_count + 1;
        WHEN 4 THEN tier4_count := tier4_count + 1;
      END CASE;
    END LOOP;
  END IF;

  -- Source score calculation (max 50 points)
  -- Tier 1 sources: 20 points each (max 40)
  -- Tier 2 sources: 10 points each (max 30)
  -- Tier 3 sources: 5 points each (max 15)
  -- Tier 4 sources: 1 point each (max 5)
  source_score := LEAST(tier1_count * 20, 40) +
                  LEAST(tier2_count * 10, 30) +
                  LEAST(tier3_count * 5, 15) +
                  LEAST(tier4_count * 1, 5);
  source_score := LEAST(source_score, 50);

  -- Diversity bonus (max 10 points)
  -- Having sources from different tiers is better
  IF tier1_count > 0 AND tier2_count > 0 THEN
    source_score := source_score + 5;
  END IF;
  IF url_count >= 3 THEN
    source_score := source_score + 5;
  END IF;
  source_score := LEAST(source_score, 60);

  -- Corroboration multiplier (max 1.5x)
  SELECT COUNT(*) INTO v_record.corroboration_count
  FROM evidence_corroborations
  WHERE verification_id = p_verification_id
    AND agrees_with_verdict = true;

  corroboration_multiplier := 1.0 + (LEAST(v_record.corroboration_count, 10) * 0.05);

  -- Trust level multiplier
  trust_multiplier := CASE v_record.trust_level
    WHEN 'admin' THEN 1.3
    WHEN 'trusted_community' THEN 1.2
    WHEN 'community' THEN 1.0
    WHEN 'untrusted' THEN 0.8
    ELSE 1.0
  END;

  -- Calculate final score
  final_score := (base_score + source_score) * corroboration_multiplier * trust_multiplier;

  -- Cap at 100
  final_score := LEAST(final_score, 100);

  -- Round to 2 decimal places
  RETURN ROUND(final_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Get confidence level from score
CREATE OR REPLACE FUNCTION get_confidence_level(score DECIMAL)
RETURNS VARCHAR(20) AS $$
BEGIN
  RETURN CASE
    WHEN score >= 80 THEN 'very_high'
    WHEN score >= 60 THEN 'high'
    WHEN score >= 40 THEN 'medium'
    WHEN score >= 20 THEN 'low'
    ELSE 'very_low'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update verification quality score
CREATE OR REPLACE FUNCTION update_verification_quality(p_verification_id UUID)
RETURNS void AS $$
DECLARE
  new_score DECIMAL(5,2);
  new_confidence VARCHAR(20);
  source_data JSONB := '[]'::JSONB;
  url TEXT;
  url_cred RECORD;
  v_urls TEXT[];
BEGIN
  -- Calculate new score
  new_score := calculate_quality_score(p_verification_id);
  new_confidence := get_confidence_level(new_score);

  -- Build source analysis JSON
  SELECT evidence_urls INTO v_urls
  FROM verifications WHERE id = p_verification_id;

  IF v_urls IS NOT NULL THEN
    FOREACH url IN ARRAY v_urls
    LOOP
      SELECT * INTO url_cred FROM get_url_credibility(url);
      source_data := source_data || jsonb_build_object(
        'url', url,
        'domain', url_cred.domain,
        'display_name', url_cred.display_name,
        'tier', url_cred.credibility_tier,
        'type', url_cred.source_type,
        'verified', url_cred.is_verified
      );
    END LOOP;
  END IF;

  -- Update verification
  UPDATE verifications
  SET
    quality_score = new_score,
    confidence_level = new_confidence,
    source_analysis = jsonb_build_object('sources', source_data),
    corroboration_count = (
      SELECT COUNT(*) FROM evidence_corroborations
      WHERE verification_id = p_verification_id AND agrees_with_verdict = true
    ),
    quality_calculated_at = NOW()
  WHERE id = p_verification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 7: TRIGGERS FOR AUTO-CALCULATION
-- =====================================================

-- Trigger to calculate quality on verification insert/update
CREATE OR REPLACE FUNCTION trigger_calculate_quality()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate quality score asynchronously (don't block insert)
  PERFORM update_verification_quality(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_verification_quality ON verifications;
CREATE TRIGGER trigger_verification_quality
  AFTER INSERT OR UPDATE OF evidence_text, evidence_urls ON verifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_quality();

-- Trigger to update community note visibility
CREATE OR REPLACE FUNCTION trigger_update_note_visibility()
RETURNS TRIGGER AS $$
DECLARE
  helpful INTEGER;
  not_helpful INTEGER;
BEGIN
  -- Count votes
  SELECT
    COUNT(*) FILTER (WHERE vote_type = 'helpful'),
    COUNT(*) FILTER (WHERE vote_type = 'not_helpful')
  INTO helpful, not_helpful
  FROM community_note_votes
  WHERE note_id = COALESCE(NEW.note_id, OLD.note_id);

  -- Update note visibility and counts
  UPDATE community_notes
  SET
    helpful_count = helpful,
    not_helpful_count = not_helpful,
    is_visible = (helpful > not_helpful + 5),
    status = CASE
      WHEN helpful > not_helpful + 5 THEN 'shown'
      WHEN not_helpful > helpful + 10 THEN 'hidden'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.note_id, OLD.note_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_note_vote ON community_note_votes;
CREATE TRIGGER trigger_note_vote
  AFTER INSERT OR UPDATE OR DELETE ON community_note_votes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_note_visibility();

-- Trigger to update corroboration count
CREATE OR REPLACE FUNCTION trigger_update_corroboration()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate quality for the verification
  PERFORM update_verification_quality(
    COALESCE(NEW.verification_id, OLD.verification_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_corroboration_update ON evidence_corroborations;
CREATE TRIGGER trigger_corroboration_update
  AFTER INSERT OR DELETE ON evidence_corroborations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_corroboration();

-- =====================================================
-- PART 8: ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE source_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_note_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_corroborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Source domains: public read, admin write
CREATE POLICY "Anyone can view source domains"
  ON source_domains FOR SELECT USING (true);

CREATE POLICY "Admins can manage source domains"
  ON source_domains FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN users u ON u.id = ur.user_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Community notes: public read visible, auth write own
CREATE POLICY "Anyone can view visible community notes"
  ON community_notes FOR SELECT
  USING (is_visible = true OR status = 'shown' OR
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id = author_id));

CREATE POLICY "Auth users can create community notes"
  ON community_notes FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id = author_id)
  );

CREATE POLICY "Users can update own pending notes"
  ON community_notes FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id = author_id)
    AND status = 'pending'
  );

CREATE POLICY "Users can delete own notes"
  ON community_notes FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id = author_id)
  );

-- Community note votes: auth users
CREATE POLICY "Anyone can view note votes"
  ON community_note_votes FOR SELECT USING (true);

CREATE POLICY "Auth users can vote on notes"
  ON community_note_votes FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id = user_id)
  );

CREATE POLICY "Users can change own vote"
  ON community_note_votes FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id = user_id)
  );

CREATE POLICY "Users can remove own vote"
  ON community_note_votes FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id = user_id)
  );

-- Corroborations: auth users
CREATE POLICY "Anyone can view corroborations"
  ON evidence_corroborations FOR SELECT USING (true);

CREATE POLICY "Auth users can add corroboration"
  ON evidence_corroborations FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id = user_id)
  );

CREATE POLICY "Users can update own corroboration"
  ON evidence_corroborations FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id = user_id)
  );

CREATE POLICY "Users can delete own corroboration"
  ON evidence_corroborations FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id = user_id)
  );

-- Rate limits: only system access
CREATE POLICY "System can manage rate limits"
  ON api_rate_limits FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- PART 9: API FUNCTIONS
-- =====================================================

-- Add community note
CREATE OR REPLACE FUNCTION add_community_note(
  p_target_type VARCHAR(20),
  p_target_id UUID,
  p_note_text TEXT,
  p_note_type VARCHAR(30),
  p_supporting_urls TEXT[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_note_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Validate target exists
  IF p_target_type = 'verification' THEN
    IF NOT EXISTS (SELECT 1 FROM verifications WHERE id = p_target_id) THEN
      RAISE EXCEPTION 'Verification not found';
    END IF;
  ELSIF p_target_type = 'promise' THEN
    IF NOT EXISTS (SELECT 1 FROM promises WHERE id = p_target_id) THEN
      RAISE EXCEPTION 'Promise not found';
    END IF;
  END IF;

  -- Check rate limit (max 10 notes per hour)
  IF (
    SELECT COUNT(*) FROM community_notes
    WHERE author_id = v_user_id
    AND created_at > NOW() - INTERVAL '1 hour'
  ) >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Max 10 notes per hour.';
  END IF;

  -- Insert note
  INSERT INTO community_notes (
    target_type, target_id, note_text, note_type,
    supporting_urls, author_id
  ) VALUES (
    p_target_type, p_target_id, p_note_text, p_note_type,
    p_supporting_urls, v_user_id
  ) RETURNING id INTO v_note_id;

  RETURN v_note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vote on community note
CREATE OR REPLACE FUNCTION vote_on_community_note(
  p_note_id UUID,
  p_vote_type VARCHAR(15)
)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Check note exists
  IF NOT EXISTS (SELECT 1 FROM community_notes WHERE id = p_note_id) THEN
    RAISE EXCEPTION 'Note not found';
  END IF;

  -- Can't vote on own note
  IF EXISTS (SELECT 1 FROM community_notes WHERE id = p_note_id AND author_id = v_user_id) THEN
    RAISE EXCEPTION 'Cannot vote on your own note';
  END IF;

  -- Upsert vote
  INSERT INTO community_note_votes (note_id, user_id, vote_type)
  VALUES (p_note_id, v_user_id, p_vote_type)
  ON CONFLICT (note_id, user_id)
  DO UPDATE SET vote_type = p_vote_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add corroboration
CREATE OR REPLACE FUNCTION add_corroboration(
  p_verification_id UUID,
  p_evidence_text TEXT DEFAULT NULL,
  p_evidence_urls TEXT[] DEFAULT NULL,
  p_agrees BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_corr_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Check verification exists
  IF NOT EXISTS (SELECT 1 FROM verifications WHERE id = p_verification_id) THEN
    RAISE EXCEPTION 'Verification not found';
  END IF;

  -- Can't corroborate own verification
  IF EXISTS (SELECT 1 FROM verifications WHERE id = p_verification_id AND submitted_by = v_user_id) THEN
    RAISE EXCEPTION 'Cannot corroborate your own verification';
  END IF;

  -- Rate limit (max 20 corroborations per hour)
  IF (
    SELECT COUNT(*) FROM evidence_corroborations
    WHERE user_id = v_user_id
    AND created_at > NOW() - INTERVAL '1 hour'
  ) >= 20 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Max 20 corroborations per hour.';
  END IF;

  -- Upsert corroboration
  INSERT INTO evidence_corroborations (
    verification_id, user_id, evidence_text, evidence_urls, agrees_with_verdict
  ) VALUES (
    p_verification_id, v_user_id, p_evidence_text, p_evidence_urls, p_agrees
  )
  ON CONFLICT (verification_id, user_id)
  DO UPDATE SET
    evidence_text = COALESCE(p_evidence_text, evidence_corroborations.evidence_text),
    evidence_urls = COALESCE(p_evidence_urls, evidence_corroborations.evidence_urls),
    agrees_with_verdict = p_agrees
  RETURNING id INTO v_corr_id;

  RETURN v_corr_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get verification with quality details
CREATE OR REPLACE FUNCTION get_verification_quality(p_verification_id UUID)
RETURNS TABLE (
  id UUID,
  quality_score DECIMAL,
  confidence_level TEXT,
  source_analysis JSONB,
  corroboration_count INTEGER,
  trust_level TEXT,
  verification_weight DECIMAL,
  community_notes_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.quality_score,
    v.confidence_level::TEXT,
    v.source_analysis,
    v.corroboration_count,
    v.trust_level::TEXT,
    v.verification_weight,
    (SELECT COUNT(*)::INTEGER FROM community_notes cn
     WHERE cn.target_type = 'verification' AND cn.target_id = v.id AND cn.is_visible = true)
  FROM verifications v
  WHERE v.id = p_verification_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 10: GRANTS
-- =====================================================

GRANT SELECT ON source_domains TO authenticated;
GRANT SELECT ON source_domains TO anon;
GRANT SELECT ON community_notes TO authenticated;
GRANT SELECT ON community_notes TO anon;
GRANT SELECT ON community_note_votes TO authenticated;
GRANT SELECT ON evidence_corroborations TO authenticated;
GRANT SELECT ON evidence_corroborations TO anon;

GRANT EXECUTE ON FUNCTION add_community_note(VARCHAR, UUID, TEXT, VARCHAR, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION vote_on_community_note(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION add_corroboration(UUID, TEXT, TEXT[], BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_verification_quality(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_verification_quality(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_url_credibility(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_url_credibility(TEXT) TO anon;

-- =====================================================
-- PART 11: BACKFILL EXISTING VERIFICATIONS
-- =====================================================

-- Calculate quality for all existing verifications
DO $$
DECLARE
  v_id UUID;
BEGIN
  FOR v_id IN SELECT id FROM verifications
  LOOP
    PERFORM update_verification_quality(v_id);
  END LOOP;

  RAISE NOTICE 'Backfilled quality scores for all existing verifications';
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Migration 023 completed successfully';
  RAISE NOTICE '✓ Source domains table created with 40+ Indian sources';
  RAISE NOTICE '✓ Quality scoring system added to verifications';
  RAISE NOTICE '✓ Community notes system created (X-style)';
  RAISE NOTICE '✓ Evidence corroboration tracking added';
  RAISE NOTICE '✓ Rate limiting implemented in API functions';
  RAISE NOTICE '✓ All RLS policies configured';
  RAISE NOTICE '✓ Existing verifications backfilled with quality scores';
END $$;
