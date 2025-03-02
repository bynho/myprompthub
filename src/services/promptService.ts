import { Prompt, PromptRating } from '../types';
import { supabase, isSupabaseConfigured, safeSupabaseQuery } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Load prompts from JSON file (fallback)
export const loadPromptsFromFile = async (): Promise<Prompt[]> => {
  try {
    const response = await fetch('/src/data/prompts2.json');
    if (!response.ok) {
      throw new Error('Failed to load prompts from file');
    }
    const data = await response.json();
    return data.prompts.map((prompt: any) => ({
      ...prompt,
      createdAt: prompt.createdAt,
      isCustom: false,
      positiveRatings: 0,
      negativeRatings: 0,
      userRating: null
    }));
  } catch (error) {
    console.error('Error loading prompts from file:', error);
    return [];
  }
};

// Load prompts from Supabase
export const loadPromptsFromSupabase = async (): Promise<Prompt[]> => {
  return safeSupabaseQuery(async () => {
    // Fetch all prompts with their translations in one query using a join
    const { data, error } = await supabase
      .from('prompts')
      .select(`
        id, 
        slug, 
        category, 
        created_at, 
        is_custom, 
        positive_ratings, 
        negative_ratings, 
        variables, 
        tags,
        prompt_translations!inner (
          id,
          language,
          title,
          description,
          content,
          created_at
        )
      `)
      .eq('prompt_translations.language', 'en');

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Map the data to our Prompt type
    return data.map(item => {
      const translation = item.prompt_translations[0];
      return {
        id: item.id.toString(), // Use numeric ID as string for consistency
        slug: item.slug,
        title: translation.title,
        category: item.category,
        description: translation.description,
        content: translation.content,
        variables: item.variables as any,
        tags: item.tags,
        createdAt: item.created_at,
        isCustom: item.is_custom,
        positiveRatings: item.positive_ratings,
        negativeRatings: item.negative_ratings,
        userRating: null // Will be populated separately
      };
    });
  }, []);
};

// Load prompts with fallback to JSON file
export const loadPrompts = async (): Promise<Prompt[]> => {
  try {
    // Try to load from Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        return await loadPromptsFromSupabase();
      } catch (error) {
        console.error('Failed to load from Supabase, falling back to file:', error);
        return await loadPromptsFromFile();
      }
    } else {
      // Fallback to JSON file
      return await loadPromptsFromFile();
    }
  } catch (error) {
    console.error('Error loading prompts:', error);
    return [];
  }
};

// Get all unique categories from prompts
export const getCategories = (prompts: Prompt[]): string[] => {
  const categories = new Set(prompts.map(prompt => prompt.category));
  return Array.from(categories);
};

// Get all unique tags from prompts
export const getAllTags = (prompts: Prompt[]): string[] => {
  const tagsSet = new Set<string>();
  prompts.forEach(prompt => {
    prompt.tags.forEach(tag => tagsSet.add(tag));
  });
  return Array.from(tagsSet).sort();
};

// Filter prompts by search term, category, and tags
export const filterPrompts = (
  prompts: Prompt[],
  searchTerm: string = '',
  category: string = '',
  selectedTags: string[] = []
): Prompt[] => {
  return prompts.filter(prompt => {
    // Filter by search term
    const matchesSearch = searchTerm === '' || 
      prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by category
    const matchesCategory = category === '' || prompt.category === category;
    
    // Filter by tags
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => prompt.tags.includes(tag));
    
    return matchesSearch && matchesCategory && matchesTags;
  });
};

// Generate prompt content by replacing variables with values
export const generatePromptContent = (
  promptContent: string,
  variableValues: Record<string, string>
): string => {
  let generatedContent = promptContent;
  
  Object.entries(variableValues).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    generatedContent = generatedContent.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return generatedContent;
};

// Get a prompt by ID
export const getPromptById = (prompts: Prompt[], id: string): Prompt | undefined => {
  return prompts.find(prompt => prompt.id === id);
};

// Get numeric ID from prompt ID
export const getNumericIdFromPromptId = async (promptId: string): Promise<number | null> => {
  return safeSupabaseQuery(async () => {
    // Check if the ID is a custom prompt (starts with 'custom-')
    if (promptId.startsWith('custom-')) {
      // For custom prompts, we don't have a numeric ID in the database
      // Return null to indicate this is a custom prompt
      return null;
    }

    // If the ID is already numeric, just parse it
    if (!isNaN(Number(promptId))) {
      return Number(promptId);
    }

    // Otherwise, look up by slug (for backward compatibility)
    const { data, error } = await supabase
      .from('prompts')
      .select('id')
      .eq('slug', promptId)
      .maybeSingle();

    if (error) {
      console.error('Error getting numeric ID from prompt ID:', error);
      return null;
    }

    return data?.id || null;
  }, null);
};

// Rate a prompt (if Supabase is configured)
export const ratePrompt = async (
  promptId: string, 
  rating: boolean, // true for positive, false for negative
  userId?: string
): Promise<boolean> => {
  return safeSupabaseQuery(async () => {
    // Get numeric ID from prompt ID
    const numericId = await getNumericIdFromPromptId(promptId);
    
    // If this is a custom prompt or we couldn't find the numeric ID,
    // we can't save the rating to the database
    if (numericId === null) {
      console.log('Custom prompt or prompt not found in database, rating stored locally only');
      return true; // Return true to allow local rating to be saved
    }

    // Check if user has already rated this prompt
    const { data: existingRatings, error: fetchError } = await supabase
      .from('prompt_ratings')
      .select('*')
      .eq('prompt_id', numericId)
      .eq('user_id', userId || 'anonymous');
    
    if (fetchError) {
      console.error('Error fetching existing ratings:', fetchError);
      return false;
    }

    const existingRating = existingRatings && existingRatings.length > 0 ? existingRatings[0] : null;

    if (existingRating) {
      // Update existing rating if it's different
      if (existingRating.rating !== rating) {
        // Update the rating
        const { error: updateError } = await supabase
          .from('prompt_ratings')
          .update({ rating })
          .eq('id', existingRating.id);
          
        if (updateError) {
          console.error('Error updating rating:', updateError);
          return false;
        }

        // Update the prompt's rating counts
        await updatePromptRatingCounts(numericId);
      }
    } else {
      // Insert new rating
      const { error: insertError } = await supabase
        .from('prompt_ratings')
        .insert({
          id: uuidv4(),
          prompt_id: numericId,
          rating,
          user_id: userId || 'anonymous',
          created_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error inserting rating:', insertError);
        return false;
      }

      // Update the prompt's rating counts
      await updatePromptRatingCounts(numericId);
    }

    return true;
  }, true);
};

// Get user's rating for a prompt
export const getUserRating = async (
  promptId: string,
  userId?: string
): Promise<boolean | null> => {
  return safeSupabaseQuery(async () => {
    // Check if the prompt is a custom prompt
    if (promptId.startsWith('custom-')) {
      // For custom prompts, we don't store ratings in the database
      return null;
    }
    
    // Get numeric ID from prompt ID
    const numericId = await getNumericIdFromPromptId(promptId);
    if (numericId === null) {
      // If we couldn't find the numeric ID, return null
      return null;
    }

    const { data, error } = await supabase
      .from('prompt_ratings')
      .select('rating')
      .eq('prompt_id', numericId)
      .eq('user_id', userId || 'anonymous')
      .maybeSingle();
      
    if (error) {
      // Handle the error gracefully
      console.error('Error getting user rating:', error);
      return null;
    }
    
    // Check if we have any results
    if (data) {
      return data.rating;
    }
    
    return null;
  }, null);
};

// Update prompt rating counts
const updatePromptRatingCounts = async (numericId: number): Promise<void> => {
  return safeSupabaseQuery(async () => {
    // Count positive ratings
    const { count: positiveCount, error: positiveError } = await supabase
      .from('prompt_ratings')
      .select('*', { count: 'exact', head: true })
      .eq('prompt_id', numericId)
      .eq('rating', true);

    if (positiveError) {
      console.error('Error counting positive ratings:', positiveError);
      return;
    }

    // Count negative ratings
    const { count: negativeCount, error: negativeError } = await supabase
      .from('prompt_ratings')
      .select('*', { count: 'exact', head: true })
      .eq('prompt_id', numericId)
      .eq('rating', false);

    if (negativeError) {
      console.error('Error counting negative ratings:', negativeError);
      return;
    }

    // Update prompt with new counts
    const { error: updateError } = await supabase
      .from('prompts')
      .update({
        positive_ratings: positiveCount || 0,
        negative_ratings: negativeCount || 0
      })
      .eq('id', numericId);
      
    if (updateError) {
      console.error('Error updating prompt rating counts:', updateError);
    }
  }, undefined);
};