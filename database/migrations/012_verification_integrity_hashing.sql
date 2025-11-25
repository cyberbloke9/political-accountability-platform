-- Migration: Verification Integrity Hashing System
-- Description: Add cryptographic hashing for tamper-proof verification evidence
-- Date: 2025-11-25

-- Add verification_hash column to store SHA-256 hash of verification data
ALTER TABLE verifications
ADD COLUMN IF NOT EXISTS verification_hash VARCHAR(64);

-- Create index for hash lookup
CREATE INDEX IF NOT EXISTS idx_verifications_hash ON verifications(verification_hash);

-- Function to generate verification hash
CREATE OR REPLACE FUNCTION generate_verification_hash(
  p_evidence_text TEXT,
  p_evidence_urls TEXT[],
  p_verdict VARCHAR(50),
  p_submitted_by UUID,
  p_promise_id UUID,
  p_created_at TIMESTAMP WITH TIME ZONE
) RETURNS VARCHAR(64) AS $$
DECLARE
  hash_input TEXT;
BEGIN
  -- Concatenate all verification data into a single string
  hash_input :=
    COALESCE(p_evidence_text, '') || '|' ||
    COALESCE(array_to_string(p_evidence_urls, ','), '') || '|' ||
    COALESCE(p_verdict, '') || '|' ||
    COALESCE(p_submitted_by::TEXT, '') || '|' ||
    COALESCE(p_promise_id::TEXT, '') || '|' ||
    COALESCE(p_created_at::TEXT, '');

  -- Generate SHA-256 hash using pgcrypto extension
  RETURN encode(digest(hash_input, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to verify hash integrity
CREATE OR REPLACE FUNCTION verify_verification_hash(verification_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_record RECORD;
  calculated_hash VARCHAR(64);
  stored_hash VARCHAR(64);
BEGIN
  -- Get verification data
  SELECT
    evidence_text,
    evidence_urls,
    verdict,
    submitted_by,
    promise_id,
    created_at,
    verification_hash
  INTO v_record
  FROM verifications
  WHERE id = verification_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Calculate hash from current data
  calculated_hash := generate_verification_hash(
    v_record.evidence_text,
    v_record.evidence_urls,
    v_record.verdict,
    v_record.submitted_by,
    v_record.promise_id,
    v_record.created_at
  );

  stored_hash := v_record.verification_hash;

  -- Compare hashes
  RETURN calculated_hash = stored_hash;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate hash on INSERT
CREATE OR REPLACE FUNCTION trigger_generate_verification_hash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.verification_hash := generate_verification_hash(
    NEW.evidence_text,
    NEW.evidence_urls,
    NEW.verdict,
    NEW.submitted_by,
    NEW.promise_id,
    NEW.created_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on verifications table
DROP TRIGGER IF EXISTS trigger_verification_hash_generation ON verifications;
CREATE TRIGGER trigger_verification_hash_generation
  BEFORE INSERT ON verifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_verification_hash();

-- Backfill existing verifications with hashes
UPDATE verifications
SET verification_hash = generate_verification_hash(
  evidence_text,
  evidence_urls,
  verdict,
  submitted_by,
  promise_id,
  created_at
)
WHERE verification_hash IS NULL;

-- Add comments
COMMENT ON COLUMN verifications.verification_hash IS 'SHA-256 hash of verification data for tamper-proof integrity verification';
COMMENT ON FUNCTION generate_verification_hash IS 'Generate SHA-256 hash of verification data (evidence + metadata)';
COMMENT ON FUNCTION verify_verification_hash IS 'Verify if current verification data matches original hash';

-- Verify migration success
SELECT
  COUNT(*) as total_verifications,
  COUNT(verification_hash) as verifications_with_hash,
  COUNT(verification_hash) = COUNT(*) as all_hashed
FROM verifications;
