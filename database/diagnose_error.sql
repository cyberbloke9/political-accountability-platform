-- Diagnostic Script: Find the exact error
-- Run this in Supabase SQL Editor to see what's failing

-- 1. Check if required tables exist
SELECT
  table_name,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_name) as exists
FROM (VALUES ('admin_actions'), ('notifications'), ('verifications'), ('users')) AS t(table_name);

-- 2. Check if verifications table has required columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'verifications'
  AND column_name IN ('submitted_by', 'verdict', 'promise_id', 'status', 'updated_at')
ORDER BY column_name;

-- 3. Get a sample verification ID to test with
SELECT id, submitted_by, verdict, promise_id, status
FROM verifications
LIMIT 1;

-- 4. Get your admin user ID
SELECT id, username, email
FROM users
WHERE email = 'your-email@example.com';  -- REPLACE WITH YOUR EMAIL

-- 5. Test the approve_verification function directly
-- REPLACE THE UUIDs BELOW with actual IDs from step 3 and 4
-- SELECT approve_verification(
--   'verification-id-from-step-3'::UUID,
--   'admin-user-id-from-step-4'::UUID,
--   'Test approval'
-- );
