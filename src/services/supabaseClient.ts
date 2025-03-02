import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return false;
  //return Boolean(supabaseUrl && supabaseAnonKey);
};

// Safely execute Supabase queries with error handling
export const safeSupabaseQuery = async <T>(
  queryFn: () => Promise<T>,
  fallbackValue: T
): Promise<T> => {
  if (!isSupabaseConfigured()) {
    return fallbackValue;
  }

  try {
    return await queryFn();
  } catch (error) {
    console.error('Error executing Supabase query:', error);
    return fallbackValue;
  }
};