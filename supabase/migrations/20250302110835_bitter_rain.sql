-- Create policies for prompts table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prompts' AND policyname = 'Allow public insert access to prompts'
  ) THEN
    CREATE POLICY "Allow public insert access to prompts"
      ON prompts
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prompts' AND policyname = 'Allow public update access to prompts'
  ) THEN
    CREATE POLICY "Allow public update access to prompts"
      ON prompts
      FOR UPDATE
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prompts' AND policyname = 'Allow public delete access to prompts'
  ) THEN
    CREATE POLICY "Allow public delete access to prompts"
      ON prompts
      FOR DELETE
      USING (true);
  END IF;
END $$;

-- Create policies for prompt_translations table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prompt_translations' AND policyname = 'Allow public insert access to prompt translations'
  ) THEN
    CREATE POLICY "Allow public insert access to prompt translations"
      ON prompt_translations
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prompt_translations' AND policyname = 'Allow public update access to prompt translations'
  ) THEN
    CREATE POLICY "Allow public update access to prompt translations"
      ON prompt_translations
      FOR UPDATE
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prompt_translations' AND policyname = 'Allow public delete access to prompt translations'
  ) THEN
    CREATE POLICY "Allow public delete access to prompt translations"
      ON prompt_translations
      FOR DELETE
      USING (true);
  END IF;
END $$;

-- Create policies for prompt_ratings table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prompt_ratings' AND policyname = 'Allow anonymous users to create ratings'
  ) THEN
    CREATE POLICY "Allow anonymous users to create ratings"
      ON prompt_ratings
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prompt_ratings' AND policyname = 'Allow users to update their own ratings'
  ) THEN
    CREATE POLICY "Allow users to update their own ratings"
      ON prompt_ratings
      FOR UPDATE
      USING (user_id = coalesce(auth.uid()::text, 'anonymous'));
  END IF;
END $$;