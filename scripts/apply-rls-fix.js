import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const dotenvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(dotenvPath)) {
  const envConfig = fs.readFileSync(dotenvPath, 'utf8')
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

// Apply RLS fix
const applyRlsFix = async () => {
  try {
    console.log('Applying RLS policy fixes...');
    
    // Read the SQL file
    const sqlPath = path.resolve(__dirname, '../supabase/migrations/fix_rls_policies.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL statements
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // Try to execute the SQL statements in chunks
      console.log('Trying to execute SQL statements in chunks...');
      
      // Split the SQL into individual statements
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const statement of statements) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (error) {
            console.error(`Error executing statement: ${statement}`, error);
          } else {
            console.log(`Successfully executed statement: ${statement.substring(0, 50)}...`);
          }
        } catch (stmtError) {
          console.error(`Error executing statement: ${statement}`, stmtError);
        }
      }
      
      console.log('Finished executing SQL statements in chunks.');
      return false;
    }
    
    console.log('RLS policy fixes applied successfully!');
    return true;
  } catch (error) {
    console.error('Error applying RLS fixes:', error);
    return false;
  }
};

// Main function
const main = async () => {
  try {
    const success = await applyRlsFix();
    
    if (success) {
      console.log('You can now run the seeding script again.');
    } else {
      console.error('Failed to apply RLS fixes. Please check your Supabase configuration.');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
};

// Run the main function
main();