-- Migration 030: Fix missing users and ensure trigger is working
-- This fixes any auth users that don't have corresponding users table records

-- Step 1: Re-create the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, username, citizen_score, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (auth_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If username conflicts, append random suffix
    INSERT INTO public.users (auth_id, email, username, citizen_score, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(MD5(NEW.id::text), 1, 6),
      0,
      NOW(),
      NOW()
    )
    ON CONFLICT (auth_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Fix existing auth users that don't have users records
DO $$
DECLARE
  auth_user RECORD;
  new_username TEXT;
BEGIN
  FOR auth_user IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.users u ON u.auth_id = au.id
    WHERE u.id IS NULL
  LOOP
    -- Generate username
    new_username := COALESCE(
      auth_user.raw_user_meta_data->>'username',
      SPLIT_PART(auth_user.email, '@', 1)
    );

    -- Try to insert, handle username conflicts
    BEGIN
      INSERT INTO public.users (auth_id, email, username, citizen_score, created_at, updated_at)
      VALUES (
        auth_user.id,
        auth_user.email,
        new_username,
        0,
        NOW(),
        NOW()
      );
      RAISE NOTICE 'Created user record for: %', auth_user.email;
    EXCEPTION
      WHEN unique_violation THEN
        -- Username conflict - add suffix
        INSERT INTO public.users (auth_id, email, username, citizen_score, created_at, updated_at)
        VALUES (
          auth_user.id,
          auth_user.email,
          new_username || '_' || SUBSTR(MD5(auth_user.id::text), 1, 6),
          0,
          NOW(),
          NOW()
        );
        RAISE NOTICE 'Created user record with modified username for: %', auth_user.email;
    END;
  END LOOP;
END $$;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Report how many users were fixed
SELECT
  (SELECT COUNT(*) FROM auth.users) AS total_auth_users,
  (SELECT COUNT(*) FROM public.users) AS total_user_records,
  (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.users u ON u.auth_id = au.id WHERE u.id IS NULL) AS missing_records;
