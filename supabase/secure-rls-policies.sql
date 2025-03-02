-- Improved RLS policies for MyPromptHub
-- These policies are more secure than the defaults and should be used in production

-- First drop existing policies that are too permissive
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow public insert access to prompts" ON prompts;
  DROP POLICY IF EXISTS "Allow public update access to prompts" ON prompts;
  DROP POLICY IF EXISTS "Allow public delete access to prompts" ON prompts;

  DROP POLICY IF EXISTS "Allow public insert access to prompt translations" ON prompt_translations;
  DROP POLICY IF EXISTS "Allow public update access to prompt translations" ON prompt_translations;
  DROP POLICY IF EXISTS "Allow public delete access to prompt translations" ON prompt_translations;

  DROP POLICY IF EXISTS "Allow anonymous users to create ratings" ON prompt_ratings;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
END $$;

-- Create a function to help with RLS management
CREATE OR REPLACE FUNCTION create_rls_policy(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create policies based on table name
  IF table_name = 'prompts' THEN
    -- Read access for everyone
    DROP POLICY IF EXISTS "Read access for prompts" ON prompts;
    CREATE POLICY "Read access for prompts" ON prompts
      FOR SELECT USING (true);

-- Insert access only for authenticated users or client-side custom prompts
DROP POLICY IF EXISTS "Insert access for prompts" ON prompts;
    CREATE POLICY "Insert access for prompts" ON prompts
      FOR INSERT WITH CHECK (
        (auth.role() = 'authenticated' AND NOT is_custom) OR
        (is_custom = true)
      );

    -- Update access to prompts - only allow updates to ratings
    DROP POLICY IF EXISTS "Update access for prompts" ON prompts;
    CREATE POLICY "Update access for prompts" ON prompts
      FOR UPDATE USING (
                                                  -- Only allow updating rating fields
                                                  auth.role() = 'authenticated' OR
                                                  -- Allow updating custom prompts
                                                  is_custom = true
                                                  )
          WITH CHECK (
                                                  -- Only allow updating rating fields by default
                                                  (auth.role() = 'authenticated' AND
                                                  (old.positive_ratings IS DISTINCT FROM positive_ratings OR
                                                  old.negative_ratings IS DISTINCT FROM negative_ratings)) OR
                                                  -- Allow updating custom prompts
                                                  is_custom = true
                                                  );

-- Delete access - only for custom prompts
DROP POLICY IF EXISTS "Delete access for prompts" ON prompts;
    CREATE POLICY "Delete access for prompts" ON prompts
      FOR DELETE USING (is_custom = true);

  ELSIF table_name = 'prompt_translations' THEN
    -- Read access for everyone
    DROP POLICY IF EXISTS "Read access for prompt translations" ON prompt_translations;
    CREATE POLICY "Read access for prompt translations" ON prompt_translations
      FOR SELECT USING (true);

-- Insert access for anyone, but with validation
DROP POLICY IF EXISTS "Insert access for prompt translations" ON prompt_translations;
    CREATE POLICY "Insert access for prompt translations" ON prompt_translations
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM prompts p
          WHERE p.id = prompt_id AND
                (p.is_custom = true OR auth.role() = 'authenticated')
        )
      );

    -- Update access only for translations associated with custom prompts
    DROP POLICY IF EXISTS "Update access for prompt translations" ON prompt_translations;
    CREATE POLICY "Update access for prompt translations" ON prompt_translations
      FOR UPDATE USING (
                                                  EXISTS (
                                                  SELECT 1 FROM prompts p
                                                  WHERE p.id = prompt_id AND
                                                  (p.is_custom = true OR auth.role() = 'authenticated')
                                                  )
                                                  );

-- Delete access only for translations associated with custom prompts
DROP POLICY IF EXISTS "Delete access for prompt translations" ON prompt_translations;
    CREATE POLICY "Delete access for prompt translations" ON prompt_translations
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM prompts p
          WHERE p.id = prompt_id AND p.is_custom = true
        )
      );

  ELSIF table_name = 'prompt_ratings' THEN
    -- Read access for everyone
    DROP POLICY IF EXISTS "Read access for prompt ratings" ON prompt_ratings;
    CREATE POLICY "Read access for prompt ratings" ON prompt_ratings
      FOR SELECT USING (true);

-- Insert access - anyone can rate, but store user ID
DROP POLICY IF EXISTS "Insert access for prompt ratings" ON prompt_ratings;
    CREATE POLICY "Insert access for prompt ratings" ON prompt_ratings
      FOR INSERT WITH CHECK (
        -- Ensure the prompt exists
        EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id)
      );

    -- Update access - only the user who created the rating
    DROP POLICY IF EXISTS "Update access for prompt ratings" ON prompt_ratings;
    CREATE POLICY "Update access for prompt ratings" ON prompt_ratings
      FOR UPDATE USING (
                                                  -- Can only update your own rating
                                                  user_id = coalesce(auth.uid()::text, 'anonymous')
                                                  );

-- Delete access - only the user who created the rating
DROP POLICY IF EXISTS "Delete access for prompt ratings" ON prompt_ratings;
    CREATE POLICY "Delete access for prompt ratings" ON prompt_ratings
      FOR DELETE USING (
        -- Can only delete your own rating
        user_id = coalesce(auth.uid()::text, 'anonymous')
      );
END IF;

RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policies for %: %', table_name, SQLERRM;
RETURN false;
END $$;

-- Apply the improved RLS policies to tables
SELECT create_rls_policy('prompts');
SELECT create_rls_policy('prompt_translations');
SELECT create_rls_policy('prompt_ratings');

-- Create SQL sanitization function to help prevent SQL injection
CREATE OR REPLACE FUNCTION sanitize_sql_input(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Replace potentially dangerous characters
RETURN regexp_replace(
        regexp_replace(
                regexp_replace(
                        regexp_replace(
                                regexp_replace(
                                    input,
                                        E'\'', E'\'\'', 'g'), -- Escape single quotes
          E';', E'\\;', 'g'),    -- Escape semicolons
        E'--', E'\\--', 'g'),   -- Escape comment markers
      E'/\\*', E'\\/*', 'g'),  -- Escape multi-line comment start
    E'\\*/', E'\\*/', 'g');   -- Escape multi-line comment end
END $$;

-- Create a stored procedure for safely rating prompts
CREATE OR REPLACE FUNCTION rate_prompt(
  p_prompt_id integer,
  p_rating boolean,
  p_user_id text DEFAULT 'anonymous'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
v_existing_rating_id uuid;
  v_positive_count integer;
  v_negative_count integer;
BEGIN
  -- Check if the prompt exists
  IF NOT EXISTS (SELECT 1 FROM prompts WHERE id = p_prompt_id) THEN
    RAISE EXCEPTION 'Prompt not found';
END IF;

  -- Check for existing rating
SELECT id INTO v_existing_rating_id
FROM prompt_ratings
WHERE prompt_id = p_prompt_id AND user_id = p_user_id;

-- Insert or update the rating
IF v_existing_rating_id IS NULL THEN
    -- Insert new rating
    INSERT INTO prompt_ratings (prompt_id, rating, user_id)
    VALUES (p_prompt_id, p_rating, p_user_id);
ELSE
    -- Update existing rating
UPDATE prompt_ratings
SET rating = p_rating
WHERE id = v_existing_rating_id;
END IF;

  -- Count ratings and update prompt
SELECT
    COUNT(*) FILTER (WHERE rating = true),
        COUNT(*) FILTER (WHERE rating = false)
INTO v_positive_count, v_negative_count
FROM prompt_ratings
WHERE prompt_id = p_prompt_id;

-- Update prompt ratings
UPDATE prompts
SET
    positive_ratings = v_positive_count,
    negative_ratings = v_negative_count
WHERE id = p_prompt_id;

RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error rating prompt: %', SQLERRM;
RETURN false;
END $$;
