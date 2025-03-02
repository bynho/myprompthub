-- MyPromptHub Database Setup Script
-- Run this in your Supabase SQL Editor to set up the required tables and policies

-- Drop existing tables if they exist (uncomment if needed)
-- DROP TABLE IF EXISTS prompt_ratings;
-- DROP TABLE IF EXISTS prompt_translations;
-- DROP TABLE IF EXISTS prompts;

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
                                       id SERIAL PRIMARY KEY,
                                       slug TEXT UNIQUE NOT NULL,
                                       category TEXT NOT NULL,
                                       created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_custom BOOLEAN NOT NULL DEFAULT false,
    positive_ratings INTEGER NOT NULL DEFAULT 0,
    negative_ratings INTEGER NOT NULL DEFAULT 0,
    variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags TEXT[] NOT NULL DEFAULT '{}'::text[]
    );

-- Create prompt_translations table
CREATE TABLE IF NOT EXISTS prompt_translations (
                                                   id SERIAL PRIMARY KEY,
                                                   prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(prompt_id, language)
    );

-- Create prompt_ratings table
CREATE TABLE IF NOT EXISTS prompt_ratings (
                                              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    rating BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id TEXT
    );

-- Enable RLS on all tables
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for prompts table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Allow public read access to prompts') THEN
    CREATE POLICY "Allow public read access to prompts" ON prompts FOR SELECT USING (true);
END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Allow public insert access to prompts') THEN
    CREATE POLICY "Allow public insert access to prompts" ON prompts FOR INSERT WITH CHECK (true);
END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Allow public update access to prompts') THEN
    CREATE POLICY "Allow public update access to prompts" ON prompts FOR UPDATE USING (true);
END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Allow public delete access to prompts') THEN
    CREATE POLICY "Allow public delete access to prompts" ON prompts FOR DELETE USING (true);
END IF;
END $$;

-- Create policies for prompt_translations table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_translations' AND policyname = 'Allow public read access to prompt translations') THEN
    CREATE POLICY "Allow public read access to prompt translations" ON prompt_translations FOR SELECT USING (true);
END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_translations' AND policyname = 'Allow public insert access to prompt translations') THEN
    CREATE POLICY "Allow public insert access to prompt translations" ON prompt_translations FOR INSERT WITH CHECK (true);
END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_translations' AND policyname = 'Allow public update access to prompt translations') THEN
    CREATE POLICY "Allow public update access to prompt translations" ON prompt_translations FOR UPDATE USING (true);
END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_translations' AND policyname = 'Allow public delete access to prompt translations') THEN
    CREATE POLICY "Allow public delete access to prompt translations" ON prompt_translations FOR DELETE USING (true);
END IF;
END $$;

-- Create policies for prompt_ratings table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_ratings' AND policyname = 'Allow public read access to prompt ratings') THEN
    CREATE POLICY "Allow public read access to prompt ratings" ON prompt_ratings FOR SELECT USING (true);
END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_ratings' AND policyname = 'Allow anonymous users to create ratings') THEN
    CREATE POLICY "Allow anonymous users to create ratings" ON prompt_ratings FOR INSERT WITH CHECK (true);
END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_ratings' AND policyname = 'Allow users to update their own ratings') THEN
    CREATE POLICY "Allow users to update their own ratings" ON prompt_ratings FOR UPDATE USING (user_id = coalesce(auth.uid()::text, 'anonymous'));
END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON prompts USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_prompts_slug ON prompts(slug);
CREATE INDEX IF NOT EXISTS idx_prompt_translations_language ON prompt_translations(language);
CREATE INDEX IF NOT EXISTS idx_prompt_translations_prompt_id ON prompt_translations(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_ratings_prompt_id ON prompt_ratings(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_ratings_user_id ON prompt_ratings(user_id);

-- Optional: Create a function to execute SQL for maintenance scripts
-- Note: This requires elevated privileges and might not work with anon key
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
EXECUTE sql;
RETURN '{"success": true}'::json;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;
