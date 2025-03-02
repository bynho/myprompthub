/*
  # Fix RLS policies for seeding

  1. Changes
    - Add INSERT policies for prompts table
    - Add INSERT policies for prompt_translations table
    - Update existing policies to be more permissive for seeding
*/

-- Add INSERT policy for prompts table
CREATE POLICY "Allow public insert access to prompts"
  ON prompts
  FOR INSERT
  WITH CHECK (true);

-- Add INSERT policy for prompt_translations table
CREATE POLICY "Allow public insert access to prompt translations"
  ON prompt_translations
  FOR INSERT
  WITH CHECK (true);

-- Add UPDATE policy for prompts table
CREATE POLICY "Allow public update access to prompts"
  ON prompts
  FOR UPDATE
  USING (true);

-- Add UPDATE policy for prompt_translations table
CREATE POLICY "Allow public update access to prompt translations"
  ON prompt_translations
  FOR UPDATE
  USING (true);

-- Add DELETE policy for prompts table
CREATE POLICY "Allow public delete access to prompts"
  ON prompts
  FOR DELETE
  USING (true);

-- Add DELETE policy for prompt_translations table
CREATE POLICY "Allow public delete access to prompt translations"
  ON prompt_translations
  FOR DELETE
  USING (true);