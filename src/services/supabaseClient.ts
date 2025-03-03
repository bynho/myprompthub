import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import errorService from './errorService';
import { protectedFetch } from './csrfProtection';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client with custom fetch implementation for CSRF protection
export const supabase = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      global: {
        fetch: protectedFetch
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
);

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

// Safely execute Supabase queries with error handling
export const safeSupabaseQuery = async <T>(
    queryFn: () => Promise<T>,
    fallbackValue: T
): Promise<T> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase is not configured. Using fallback value.');
    return fallbackValue;
  }

  try {
    return await errorService.handlePromise<T>(
        queryFn(),
        {
          context: { component: 'SupabaseClient', method: 'safeSupabaseQuery' },
          userMessage: 'Failed to complete database operation. Using local data instead.'
        }
    );
  } catch (error) {
    console.error('Error executing Supabase query:', error);
    errorService.handleError(error as Error, {
      context: { component: 'SupabaseClient', method: 'safeSupabaseQuery' },
      severity: 'high',
      userMessage: 'Failed to complete database operation. Using local data instead.'
    })
    return fallbackValue;
  }
};

// Check database connection
export const checkSupabaseConnection = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    // Test simple query to verify connection
    const { error } = await supabase.from('prompts').select('id').limit(1);

    // If the error is not "relation does not exist", it's a connection issue
    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return true;
  } catch (error) {
    errorService.handleError(error as Error, {
      context: { component: 'SupabaseClient', method: 'checkSupabaseConnection' },
      severity: 'medium'
    });
    return false;
  }
};

// Improved RLS protection for Supabase tables
export const setupRlsPolicy = async (tableName: string): Promise<boolean> => {
  try {
    // This should be executed by an authenticated user with admin permissions

    // Fix for TS2345: Use 'exec_sql' instead of 'create_rls_policy'
    const { error } = await supabase.rpc('exec_sql', {
      sql: `SELECT create_rls_policy('${tableName}')`
    });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    errorService.handleError(error as Error, {
      context: { component: 'SupabaseClient', method: 'setupRlsPolicy', tableName },
      severity: 'high',
      userMessage: `Failed to set up security policy for table "${tableName}".`
    });
    return false;
  }
};

// Sanitize inputs before sending to Supabase
// Fix for TS2862: Change function signature to indicate we're returning a new object
export const sanitizeForDatabase = <T extends Record<string, any>>(input: T): Partial<T> => {
  // Create a new object to avoid modifying the input directly
  const sanitized: Partial<T> = {};

  // Process each field
  Object.keys(input).forEach(key => {
    const value = input[key];
    const typedKey = key as keyof T;

    // Handle strings
    if (Array.isArray(value)) {
      sanitized[typedKey] = value.map(item =>
          typeof item === 'string'
              ? item.trim()
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/'/g, '&#39;')
                  .replace(/"/g, '&quot;')
                  .replace(/\\/, '&#92;')
              : item
      ) as T[keyof T];
    }

    // Handle nested objects
    else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[typedKey] = sanitizeForDatabase(value) as T[keyof T];
    }

    // Copy other types as is
    else {
      sanitized[typedKey] = value;
    }
  });

  return sanitized;
};
