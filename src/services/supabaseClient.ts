import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

// Helper function to execute Supabase queries with error handling
export const safeSupabaseQuery = async <T>(
    queryFn: () => Promise<T>,
    fallbackValue: T
): Promise<T> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase is not configured. Using fallback value.');
    return fallbackValue;
  }

  try {
    return await queryFn();
  } catch (error) {
    console.error('Error executing Supabase query:', error);
    return fallbackValue;
  }
};

// Helper function to check database connection
export const checkSupabaseConnection = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { error } = await supabase.from('prompts').select('id').limit(1);
    return !error;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return false;
  }
};
