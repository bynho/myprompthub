import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const args = process.argv.slice(2);

// Get the prompts file path from arguments or use default
let promptsFilePath;
if (args.length > 0) {
  promptsFilePath = args[0];
} else {
  promptsFilePath = path.resolve(__dirname, '../src/data/prompts-engb.json');
}

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

// Load prompts from file
const loadPrompts = (filePath) => {
  try {
    console.log(`Loading prompts from ${filePath}...`);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File ${filePath} does not exist`);
      process.exit(1);
    }
    const promptsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return promptsData.prompts;
  } catch (error) {
    console.error('Error loading prompts from file:', error);
    return [];
  }
};

// Function to seed prompts to Supabase
const seedPrompts = async (prompts) => {
  console.log(`Seeding ${prompts.length} prompts to Supabase...`);
  const idMap = new Map();

  for (const prompt of prompts) {
    try {
      const slug = prompt.id.toString();

      // Check if prompt already exists
      const { data: existingPrompt, error: lookupError } = await supabase
          .from('prompts')
          .select('id, slug')
          .eq('slug', slug)
          .maybeSingle();

      if (lookupError) {
        console.error(`Error looking up prompt ${slug}:`, lookupError);
        continue;
      }

      let promptId;

      // Insert or use existing prompt
      if (existingPrompt) {
        promptId = existingPrompt.id;
        console.log(`Prompt with slug ${slug} already exists with ID ${promptId}`);

        // Update existing prompt
        const { error: updateError } = await supabase
            .from('prompts')
            .update({
              category: prompt.category,
              variables: prompt.variables || [],
              tags: prompt.tags || [],
              is_custom: false,
              positive_ratings: prompt.positiveRatings || 0,
              negative_ratings: prompt.negativeRatings || 0
            })
            .eq('id', promptId);

        if (updateError) {
          console.error(`Error updating prompt ${slug}:`, updateError);
        } else {
          console.log(`Updated prompt ${slug}`);
        }
      } else {
        // Insert new prompt
        const formattedPrompt = {
          slug,
          category: prompt.category,
          is_custom: false,
          positive_ratings: prompt.positiveRatings || 0,
          negative_ratings: prompt.negativeRatings || 0,
          variables: prompt.variables || [],
          tags: prompt.tags || [],
          created_at: prompt.createdAt || new Date().toISOString()
        };

        const { data: newPrompt, error: insertError } = await supabase
            .from('prompts')
            .insert(formattedPrompt)
            .select('id');

        if (insertError) {
          console.error(`Error inserting prompt ${slug}:`, insertError);
          continue;
        }

        if (!newPrompt || newPrompt.length === 0) {
          console.error(`Failed to insert prompt ${slug}`);
          continue;
        }

        promptId = newPrompt[0].id;
        console.log(`Created new prompt with slug ${slug} and ID ${promptId}`);
      }

      idMap.set(slug, promptId);

      // Check if translation exists
      const { data: existingTranslation, error: translationLookupError } = await supabase
          .from('prompt_translations')
          .select('id')
          .eq('prompt_id', promptId)
          .eq('language', 'en')
          .maybeSingle();

      if (translationLookupError) {
        console.error(`Error looking up translation for prompt ${slug}:`, translationLookupError);
        continue;
      }

      // Update or insert translation
      if (existingTranslation) {
        const { error: updateError } = await supabase
            .from('prompt_translations')
            .update({
              title: prompt.title,
              description: prompt.description,
              content: prompt.content
            })
            .eq('id', existingTranslation.id);

        if (updateError) {
          console.error(`Error updating translation for prompt ${slug}:`, updateError);
        } else {
          console.log(`Updated translation for prompt ${slug}`);
        }
      } else {
        const translationData = {
          prompt_id: promptId,
          language: 'en',
          title: prompt.title,
          description: prompt.description,
          content: prompt.content,
          created_at: new Date().toISOString()
        };

        const { error: insertTransError } = await supabase
            .from('prompt_translations')
            .insert(translationData);

        if (insertTransError) {
          console.error(`Error inserting translation for prompt ${slug}:`, insertTransError);
        } else {
          console.log(`Added translation for prompt ${slug}`);
        }
      }
    } catch (error) {
      console.error(`Error processing prompt ${prompt.id}:`, error);
    }
  }

  console.log('Prompts and translations seeding completed!');
  return idMap;
};

// Check RLS policies
const checkRlsPolicies = async () => {
  try {
    // Test insert permissions
    const testPrompt = {
      slug: 'test-prompt-rls-check',
      category: 'Test',
      is_custom: false,
      variables: [],
      tags: ['test'],
      created_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
        .from('prompts')
        .insert(testPrompt);

    if (insertError) {
      console.error('RLS policy check failed. Insert policy is not properly set:', insertError);
      console.log('Please run "npm run fix-rls" to fix the RLS policies before seeding.');
      return false;
    }

    // Clean up test prompt
    await supabase
        .from('prompts')
        .delete()
        .eq('slug', 'test-prompt-rls-check');

    return true;
  } catch (error) {
    console.error('Error checking RLS policies:', error);
    return false;
  }
};

// Create SQL function for executing SQL
const createExecSqlFunction = async () => {
  try {
    // Check if the function exists
    const { data: existingFunction, error: checkError } = await supabase
        .rpc('exec_sql', { sql: 'SELECT 1' })
        .maybeSingle();

    if (!checkError) {
      console.log('exec_sql function already exists');
      return true;
    }

    // Create the function using raw SQL via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        sql: `
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
        `
      })
    });

    if (!response.ok) {
      console.error('Failed to create exec_sql function:', await response.text());
      return false;
    }

    console.log('Created exec_sql function');
    return true;
  } catch (error) {
    console.error('Error creating exec_sql function:', error);
    return false;
  }
};

// Fix RLS policies
const fixRlsPolicies = async () => {
  try {
    await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Allow public insert access to prompts') THEN
            CREATE POLICY "Allow public insert access to prompts" ON prompts FOR INSERT WITH CHECK (true);
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_translations' AND policyname = 'Allow public insert access to prompt translations') THEN
            CREATE POLICY "Allow public insert access to prompt translations" ON prompt_translations FOR INSERT WITH CHECK (true);
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompts' AND policyname = 'Allow public update access to prompts') THEN
            CREATE POLICY "Allow public update access to prompts" ON prompts FOR UPDATE USING (true);
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_translations' AND policyname = 'Allow public update access to prompt translations') THEN
            CREATE POLICY "Allow public update access to prompt translations" ON prompt_translations FOR UPDATE USING (true);
          END IF;
        END $$;
      `
    });

    console.log('RLS policies fixed. Proceeding with seeding...');
    return true;
  } catch (error) {
    console.error('Failed to fix RLS policies automatically:', error);
    return false;
  }
};

// Main function
const main = async () => {
  try {
    // Check if the exec_sql function exists
    const funcExists = await createExecSqlFunction();
    if (!funcExists) {
      console.error('Failed to create or verify exec_sql function. This is required for RLS fixes.');
      process.exit(1);
    }

    // Check RLS policies
    console.log('Checking RLS policies...');
    const rlsPoliciesOk = await checkRlsPolicies();

    if (!rlsPoliciesOk) {
      console.log('Attempting to fix RLS policies automatically...');
      const fixed = await fixRlsPolicies();

      if (!fixed) {
        console.log('Please run "npm run fix-rls" manually before seeding.');
        process.exit(1);
      }
    }

    // Load and seed prompts
    const prompts = loadPrompts(promptsFilePath);
    if (prompts.length === 0) {
      console.error('No prompts found to seed');
      process.exit(1);
    }

    await seedPrompts(prompts);
    console.log('Seeding process completed successfully!');

  } catch (error) {
    console.error('Error in seeding process:', error);
    process.exit(1);
  }
};

main();
