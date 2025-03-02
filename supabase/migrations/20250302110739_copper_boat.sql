/*
  # Create database schema for MyPromptHub

  1. New Tables
    - `prompts` - Stores prompt metadata
    - `prompt_translations` - Stores prompt content in different languages
    - `prompt_ratings` - Stores user ratings for prompts
  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for authenticated users to create/update ratings
*/

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS prompt_ratings;
DROP TABLE IF EXISTS prompt_translations;
DROP TABLE IF EXISTS prompts;

-- Create prompts table with numeric IDs
CREATE TABLE prompts (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL, -- For URL-friendly identifiers
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_custom BOOLEAN NOT NULL DEFAULT false,
  positive_ratings INTEGER NOT NULL DEFAULT 0,
  negative_ratings INTEGER NOT NULL DEFAULT 0,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[]
);

-- Create prompt translations table
CREATE TABLE prompt_translations (
  id SERIAL PRIMARY KEY,
  prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(prompt_id)
);

-- Create prompt ratings table
CREATE TABLE prompt_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  rating BOOLEAN NOT NULL, -- true for positive, false for negative
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id TEXT -- Can be null for anonymous users
);

-- Enable Row Level Security
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for prompts table
CREATE POLICY "Allow public read access to prompts"
  ON prompts
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to prompts"
  ON prompts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to prompts"
  ON prompts
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access to prompts"
  ON prompts
  FOR DELETE
  USING (true);

-- Create policies for prompt_translations table
CREATE POLICY "Allow public read access to prompt translations"
  ON prompt_translations
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to prompt translations"
  ON prompt_translations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to prompt translations"
  ON prompt_translations
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access to prompt translations"
  ON prompt_translations
  FOR DELETE
  USING (true);

-- Create policies for prompt_ratings table
CREATE POLICY "Allow public read access to prompt ratings"
  ON prompt_ratings
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous users to create ratings"
  ON prompt_ratings
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow users to update their own ratings"
  ON prompt_ratings
  FOR UPDATE
  USING (user_id = coalesce(auth.uid()::text, 'anonymous'));

-- Create indexes for better performance
CREATE INDEX idx_prompts_category ON prompts(category);
CREATE INDEX idx_prompts_tags ON prompts USING gin(tags);
CREATE INDEX idx_prompts_slug ON prompts(slug);
CREATE INDEX idx_prompt_translations_prompt_id ON prompt_translations(prompt_id);
CREATE INDEX idx_prompt_ratings_prompt_id ON prompt_ratings(prompt_id);
CREATE INDEX idx_prompt_ratings_user_id ON prompt_ratings(user_id);