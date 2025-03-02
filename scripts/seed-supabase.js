import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Process command line arguments to get the JSON file path
const args = process.argv.slice(2);
let promptsFilePath;

if (args.length > 0) {
  promptsFilePath = args[0];
} else {
  // Default path if no argument provided
  promptsFilePath = path.resolve(__dirname, '../src/data/prompts-engb.json');
}

// Load environment variables
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

// Check for required environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  console.error('Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Load prompts from JSON file
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

// Seed prompts to Supabase
const seedPrompts = async (prompts) => {
  console.log(`Seeding ${prompts.length} prompts to Supabase...`);
  
  // Map to store the relationship between original ID and numeric ID in the database
  const idMap = new Map();
  
  for (const prompt of prompts) {
    try {
      // Ensure we use the numeric id converted to a string as the slug
      const slug = prompt.id.toString();
      
      // First, check if the prompt already exists by slug
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
      
      if (existingPrompt) {
        // Prompt already exists, use its ID
        promptId = existingPrompt.id;
        console.log(`Prompt with slug ${slug} already exists with ID ${promptId}`);
      } else {
        // Create a new prompt record
        const formattedPrompt = {
          slug, // use the numeric id converted to string as slug
          category: prompt.category,
          is_custom: false,
          positive_ratings: 0,
          negative_ratings: 0,
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
      
      // Store the mapping between original numeric id and the generated promptId
      idMap.set(slug, promptId);
      
      // Check if translation for this prompt already exists
      const { data: existingTranslation, error: translationLookupError } = await supabase
        .from('prompt_translations')
        .select('id')
        .eq('prompt_id', promptId)
        .maybeSingle();
      
      if (translationLookupError) {
        console.error(`Error looking up translation for prompt ${slug}:`, translationLookupError);
        continue;
      }
      
      if (existingTranslation) {
        // Update existing translation record
        const { error: updateError } = await supabase
          .from('prompt_translations')
          .update({
            title: prompt.title,
            description: prompt.description,
            content: prompt.content,
            created_at: new Date().toISOString()
          })
          .eq('id', existingTranslation.id);
        
        if (updateError) {
          console.error(`Error updating translation for prompt ${slug}:`, updateError);
        } else {
          console.log(`Updated translation for prompt ${slug}`);
        }
      } else {
        // Insert new translation record linked to the parent prompt
        const translationData = {
          prompt_id: promptId,
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

// Check if RLS (Row Level Security) policies are properly set
const checkRlsPolicies = async () => {
  try {
    // Try to insert a test prompt
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
    
    // Clean up the test prompt
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

// Main function to run the seeding process
const main = async () => {
  try {
    // Check RLS policies first
    console.log('Checking RLS policies...');
    const rlsPoliciesOk = await checkRlsPolicies();
    if (!rlsPoliciesOk) {
      console.log('Attempting to fix RLS policies automatically...');
      
      // Try to apply RLS fixes directly
      try {
        // Execute SQL to create policies for prompts and prompt_translations if they don't exist
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
            END $$;
          `
        });
        
        console.log('RLS policies fixed. Proceeding with seeding...');
      } catch (rlsFixError) {
        console.error('Failed to fix RLS policies automatically:', rlsFixError);
        console.log('Please run "npm run fix-rls" manually before seeding.');
        process.exit(1);
      }
    }
    
    // Load prompts from the provided JSON file
    const prompts = loadPrompts(promptsFilePath);
    if (prompts.length === 0) {
      console.error('No prompts found to seed');
      process.exit(1);
    }
    
    // Seed prompts and translations
    await seedPrompts(prompts);
    
    console.log('Seeding process completed successfully!');
  } catch (error) {
    console.error('Error in seeding process:', error);
    process.exit(1);
  }
};

// Run the main function
main();