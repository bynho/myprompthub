import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const dotenvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(dotenvPath)) {
    const envConfig = fs
        .readFileSync(dotenvPath, 'utf8')
        .split('\n')
        .filter(line => line.trim() !== '' && !line.startsWith('#'))
        .reduce((acc, line) => {
            const [key, value] = line.split('=');
            if (key && value) {
                acc[key.trim()] = value.trim().replace(/^['"](.*)['"]$/, '$1');
            }
            return acc;
        }, {});
    Object.entries(envConfig).forEach(([key, value]) => {
        process.env[key] = value;
    });
}

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase credentials in .env file');
    console.error('Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Check if a table exists
async function tableExists(tableName) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        // If the error is about the relation not existing, the table doesn't exist
        if (error && error.code === 'PGRST116') {
            return false;
        }

        // If there's no error or a different error, the table likely exists
        return !error;
    } catch (err) {
        console.error(`Error checking if table ${tableName} exists:`, err);
        return false;
    }
}

// Create the database schema using Supabase's native functions
const setupDatabase = async () => {
    console.log('Setting up database...');

    try {
        // Check if tables already exist
        const promptsExists = await tableExists('prompts');
        if (promptsExists) {
            console.log('Database tables already exist. No setup needed.');
            return true;
        }

        // We'll use the raw REST API to create tables one by one
        // Create prompts table
        console.log('Creating prompts table...');
        const { error: promptsError } = await supabase.rpc('create_prompts_table', {});

        if (promptsError) {
            // If the rpc function doesn't exist, we'll provide instructions instead
            console.error('Unable to create tables automatically.');
            console.log('\nPlease run the following SQL in your Supabase SQL editor:');
            console.log(`
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
CREATE POLICY "Allow public read access to prompts"
  ON prompts FOR SELECT USING (true);
  
CREATE POLICY "Allow public insert access to prompts"
  ON prompts FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Allow public update access to prompts"
  ON prompts FOR UPDATE USING (true);
  
CREATE POLICY "Allow public delete access to prompts"
  ON prompts FOR DELETE USING (true);

-- Create policies for prompt_translations table
CREATE POLICY "Allow public read access to prompt translations"
  ON prompt_translations FOR SELECT USING (true);
  
CREATE POLICY "Allow public insert access to prompt translations"
  ON prompt_translations FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Allow public update access to prompt translations"
  ON prompt_translations FOR UPDATE USING (true);
  
CREATE POLICY "Allow public delete access to prompt translations"
  ON prompt_translations FOR DELETE USING (true);

-- Create policies for prompt_ratings table  
CREATE POLICY "Allow public read access to prompt ratings"
  ON prompt_ratings FOR SELECT USING (true);
  
CREATE POLICY "Allow anonymous users to create ratings"
  ON prompt_ratings FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Allow users to update their own ratings"
  ON prompt_ratings FOR UPDATE USING (user_id = coalesce(auth.uid()::text, 'anonymous'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON prompts USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_prompts_slug ON prompts(slug);
CREATE INDEX IF NOT EXISTS idx_prompt_translations_language ON prompt_translations(language);
CREATE INDEX IF NOT EXISTS idx_prompt_translations_prompt_id ON prompt_translations(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_ratings_prompt_id ON prompt_ratings(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_ratings_user_id ON prompt_ratings(user_id);
      `);

            console.log("\nAfter running this SQL, run 'npm run seed' to populate the database with initial data.");
            return false;
        }

        console.log('Database setup completed successfully!');
        return true;
    } catch (error) {
        console.error('Error setting up database:', error);
        return false;
    }
};

// Verify database connection
const verifyConnection = async () => {
    try {
        console.log('Verifying Supabase connection...');
        // Try to use a service that should be available on any Supabase project
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Error connecting to Supabase:', error);
            return false;
        }

        console.log('Supabase connection verified successfully!');
        return true;
    } catch (error) {
        console.error('Error verifying Supabase connection:', error);
        return false;
    }
};

// Create RPC function for creating tables
const createRpcFunction = async () => {
    try {
        console.log('Creating RPC function for database setup...');

        // Check if the function already exists
        const { data, error } = await supabase.rpc('create_prompts_table', {});

        if (!error) {
            console.log('RPC function already exists.');
            return true;
        }

        console.log('RPC function needs to be created manually.');
        console.log(`
Please run the following SQL in your Supabase SQL editor to create the RPC function:

CREATE OR REPLACE FUNCTION create_prompts_table()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create prompts table if it doesn't exist
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
  
  -- Create prompt_translations table if it doesn't exist
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
  
  -- Create prompt_ratings table if it doesn't exist
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
  
  -- Create policies for prompt_translations table
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
  
  -- Create policies for prompt_ratings table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_ratings' AND policyname = 'Allow public read access to prompt ratings') THEN
    CREATE POLICY "Allow public read access to prompt ratings" ON prompt_ratings FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_ratings' AND policyname = 'Allow anonymous users to create ratings') THEN
    CREATE POLICY "Allow anonymous users to create ratings" ON prompt_ratings FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_ratings' AND policyname = 'Allow users to update their own ratings') THEN
    CREATE POLICY "Allow users to update their own ratings" ON prompt_ratings FOR UPDATE USING (user_id = coalesce(auth.uid()::text, 'anonymous'));
  END IF;
  
  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
  CREATE INDEX IF NOT EXISTS idx_prompts_tags ON prompts USING gin(tags);
  CREATE INDEX IF NOT EXISTS idx_prompts_slug ON prompts(slug);
  CREATE INDEX IF NOT EXISTS idx_prompt_translations_language ON prompt_translations(language);
  CREATE INDEX IF NOT EXISTS idx_prompt_translations_prompt_id ON prompt_translations(prompt_id);
  CREATE INDEX IF NOT EXISTS idx_prompt_ratings_prompt_id ON prompt_ratings(prompt_id);
  CREATE INDEX IF NOT EXISTS idx_prompt_ratings_user_id ON prompt_ratings(user_id);
  
  RETURN true;
END;
$$;
`);

        return false;
    } catch (error) {
        console.error('Error creating RPC function:', error);
        return false;
    }
};

// Main function
const main = async () => {
    try {
        // Verify connection to Supabase
        const connected = await verifyConnection();
        if (!connected) {
            console.error('Failed to connect to Supabase. Please check your credentials.');
            process.exit(1);
        }

        // Create RPC function
        await createRpcFunction();

        // Set up database
        const success = await setupDatabase();

        if (success) {
            console.log('Database setup completed successfully!');
            console.log('You can now run the seeding script with: npm run seed');
        } else {
            console.log('Database setup needs manual intervention. Please follow the instructions above.');
        }
    } catch (error) {
        console.error('Unexpected error:', error);
        process.exit(1);
    }
};

main();
