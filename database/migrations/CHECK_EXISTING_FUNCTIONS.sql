-- Run this first to see what functions already exist
-- This will help us understand what needs to be dropped

SELECT
  routine_name,
  routine_type,
  data_type,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as definition
FROM information_schema.routines r
JOIN pg_proc p ON r.specific_name = p.proname || '_' || p.oid
WHERE routine_schema = 'public'
AND routine_name LIKE '%reputation%' OR routine_name LIKE '%verification%'
ORDER BY routine_name;
