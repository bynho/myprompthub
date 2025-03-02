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

    const { error } = await supabase.rpc('create_rls_policy', {
      table_name: tableName
    });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    errorService.handleError(error as Error, {
      context: { component: 'SupabaseClient', method: 'setupRlsPolicy', tableName },
      severity: 'medium',
      userMessage: `Failed to set up security policy for table "${tableName}".`
    });
    return false;
  }
};

// Sanitize inputs before sending to Supabase
export const sanitizeForDatabase = <T extends Record<string, any>>(input: T): T => {
  const sanitized = { ...input };

  // Process each field
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];

    // Handle strings
    if (typeof value === 'string') {
      // Trim strings and filter out dangerous HTML/SQL
      sanitized[key] = value.trim()
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/'/g, '&#39;')
          .replace(/"/g, '&quot;')
          .replace(/\\/, '&#92;');
    }

    // Handle arrays
    if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
          typeof item === 'string'
              ? item.trim()
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/'/g, '&#39;')
                  .replace(/"/g, '&quot;')
                  .replace(/\\/, '&#92;')
              : item
      );
    }

    // Handle nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeForDatabase(value);
    }
  });

  return sanitized;
};
