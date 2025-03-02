-- Add INSERT policy for prompts table if it doesn't exist
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

-- Add INSERT policy for prompt_translations table if it doesn't exist
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

-- Add UPDATE policy for prompts table if it doesn't exist
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

-- Add UPDATE policy for prompt_translations table if it doesn't exist
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

-- Add DELETE policy for prompts table if it doesn't exist
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

-- Add DELETE policy for prompt_translations table if it doesn't exist
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