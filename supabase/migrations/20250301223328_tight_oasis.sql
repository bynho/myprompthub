/*
  # Create Prompts Schema

  1. New Tables
    - `prompts` - Stores all prompt templates
      - `id` (text, primary key)
      - `title` (text)
      - `category` (text)
      - `description` (text)
      - `content` (text)
      - `variables` (jsonb)
      - `tags` (text[])
      - `created_at` (timestamptz)
      - `is_custom` (boolean)
      - `positive_ratings` (integer)
      - `negative_ratings` (integer)
    
    - `prompt_translations` - Stores translations for prompts
      - `id` (uuid, primary key)
      - `prompt_id` (text, foreign key to prompts.id)
      - `language` (text)
      - `title` (text)
      - `description` (text)
      - `content` (text)
      - `created_at` (timestamptz)
    
    - `prompt_ratings` - Stores user ratings for prompts
      - `id` (uuid, primary key)
      - `prompt_id` (text, foreign key to prompts.id)
      - `rating` (boolean) - true for positive, false for negative
      - `created_at` (timestamptz)
      - `user_id` (text) - anonymous identifier for users
  
  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for authenticated users to rate prompts
*/

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  content text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  is_custom boolean NOT NULL DEFAULT false,
  positive_ratings integer NOT NULL DEFAULT 0,
  negative_ratings integer NOT NULL DEFAULT 0
);

-- Create prompt translations table
CREATE TABLE IF NOT EXISTS prompt_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id text NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  language text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(prompt_id, language)
);

-- Create prompt ratings table
CREATE TABLE IF NOT EXISTS prompt_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id text NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  rating boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id text -- Can be null for anonymous users
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

-- Create policies for prompt_translations table
CREATE POLICY "Allow public read access to prompt translations"
  ON prompt_translations
  FOR SELECT
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
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON prompts USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_prompt_translations_language ON prompt_translations(language);
CREATE INDEX IF NOT EXISTS idx_prompt_translations_prompt_id ON prompt_translations(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_ratings_prompt_id ON prompt_ratings(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_ratings_user_id ON prompt_ratings(user_id);